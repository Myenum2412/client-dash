import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parsePaginationParams, createPaginatedResponse } from "@/lib/api/pagination";
import { 
  getProjectById, 
  getDrawingLogByProject, 
  getDrawingsYetToReleaseByProject, 
  getDrawingsYetToReturnByProject,
  getInvoicesByProjectNumber,
  getSubmissionsByProject,
  getChangeOrdersByProject
} from "@/lib/supabase/queries";
import { resolvePdfPath, normalizePdfPath, type ModuleType } from "@/lib/utils/pdf-path-resolver";

export const dynamic = "force-dynamic";
export const revalidate = 0; // Disable caching

type SectionKey =
  | "drawings_yet_to_return"
  | "drawings_yet_to_release"
  | "drawing_log"
  | "invoice_history"
  | "upcoming_submissions"
  | "change_orders"
  | "rfi_submissions";

function isSectionKey(value: string | null): value is SectionKey {
  return (
    value === "drawings_yet_to_return" ||
    value === "drawings_yet_to_release" ||
    value === "drawing_log" ||
    value === "invoice_history" ||
    value === "upcoming_submissions" ||
    value === "change_orders" ||
    value === "rfi_submissions"
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { searchParams } = new URL(request.url);
    const section = searchParams.get("section");
    const { page, pageSize } = parsePaginationParams(searchParams);

    if (!isSectionKey(section)) {
      return NextResponse.json({ message: "Invalid section" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    
    // Fetch the project
    const project = await getProjectById(supabase, projectId);
    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    const jobNumber = project.project_number;

    if (
      section === "drawings_yet_to_return" ||
      section === "drawings_yet_to_release" ||
      section === "drawing_log"
    ) {
      let drawings;
      
      if (section === "drawing_log") {
        drawings = await getDrawingLogByProject(supabase, projectId);
      } else if (section === "drawings_yet_to_release") {
        drawings = await getDrawingsYetToReleaseByProject(supabase, projectId);
      } else {
        drawings = await getDrawingsYetToReturnByProject(supabase, projectId);
      }

      // Sort by latest submitted date (descending)
      drawings.sort((a, b) => {
        const dateA = new Date(a.latest_submitted_date || 0).getTime();
        const dateB = new Date(b.latest_submitted_date || 0).getTime();
        return dateB - dateA;
      });

      const mappedDrawings = drawings.map((d: any) => {
        const dwgNo = d.dwg || d.dwg_no;
        // Resolve PDF path using intelligent path resolver
        const resolvedPdfPath = resolvePdfPath(
          projectId,
          section as ModuleType,
          {
            id: d.id,
            dwgNo,
            jobNo: jobNumber,
            status: d.status,
            description: d.description,
          },
          d.pdf_path
        );
        
        return {
          id: d.id,
          dwgNo,
          status: d.status || null,
          description: d.description || "",
          elements: d.elements || "",
          totalWeightTons: d.total_weight || d.total_weight_tons || 0,
          latestSubmittedDate: d.latest_submitted_date || "",
          releaseStatus: d.release_status || "",
          pdfPath: normalizePdfPath(resolvedPdfPath) || normalizePdfPath(`/assets/${jobNumber}/Drawing-Log/${dwgNo}.pdf`),
        };
      });

      // Return paginated response
      const paginated = createPaginatedResponse(mappedDrawings, page, pageSize);
      return NextResponse.json(paginated);
    }

    if (section === "invoice_history") {
      // Filter invoices by project number
      const invoices = await getInvoicesByProjectNumber(supabase, project.project_number);

      // Sort by invoice number (descending)
      invoices.sort((a, b) => b.invoice_id.localeCompare(a.invoice_id));

      const mappedInvoices = invoices.map((inv) => {
        // Resolve PDF path for invoices
        const resolvedPdfPath = resolvePdfPath(
          projectId,
          "invoice_history",
          {
            id: inv.id,
            invoiceId: inv.invoice_id,
            invoice_id: inv.invoice_id,
            jobNo: jobNumber,
            projectNumber: inv.project_number,
          },
          (inv as any).pdf_path || (inv as any).pdfPath
        );
        
        return {
          id: inv.id,
          invoiceNo: inv.invoice_id,
          projectNo: inv.project_number,
          contractor: project.contractor_name,
          projectName: project.project_name,
          billedTonnage: inv.billed_tonnage || 0,
          unitPriceOrLumpSum: `$${inv.unit_price_lump_sum || 0}`,
          tonsBilledAmount: inv.tons_billed_amount || 0,
          billedHoursCo: inv.billed_hours_co || 0,
          coPrice: inv.co_price || 0,
          coBilledAmount: inv.co_billed_amount || 0,
          totalAmountBilled: inv.total_amount_billed || 0,
          pdfPath: normalizePdfPath(resolvedPdfPath),
        };
      });

      // Return paginated response
      const paginated = createPaginatedResponse(mappedInvoices, page, pageSize);
      return NextResponse.json(paginated);
    }

    if (section === "upcoming_submissions") {
      // Filter submissions by project
      const submissions = await getSubmissionsByProject(supabase, projectId);

      // Sort by submission date (descending)
      submissions.sort((a, b) => {
        const dateA = new Date(a.submission_date || 0).getTime();
        const dateB = new Date(b.submission_date || 0).getTime();
        return dateB - dateA;
      });

      // Map submission types to new format
      const mapSubmissionType = (type: string | null | undefined): string => {
        if (!type) return "For Approval (APP)";
        
        const upperType = type.toUpperCase().trim();
        
        // Map legacy types to new format
        if (upperType === "APP" || upperType.includes("APPROVAL") || upperType.includes("FOR APPROVAL")) {
          return "For Approval (APP)";
        }
        if (upperType === "ENQUIRY" || upperType.includes("ENQUIRY") || upperType === "ENQUIRY") {
          return "Enquiry";
        }
        if (upperType.includes("MATERIAL") || upperType.includes("MATERIAL LIST") || upperType === "MATERIAL LIST") {
          return "Material List";
        }
        
        // Map other common types
        if (upperType === "RR" || upperType === "R&R" || upperType.includes("REVIEW")) {
          return "For Approval (APP)"; // Map R&R to For Approval
        }
        if (upperType === "FFU" || upperType.includes("FIELD USE")) {
          return "For Approval (APP)"; // Map FFU to For Approval
        }
        if (upperType === "RFI" || upperType.includes("RFI")) {
          return "Enquiry"; // Map RFI to Enquiry
        }
        if (upperType === "SUBMITTAL" || upperType.includes("SUBMITTAL")) {
          return "Material List"; // Map Submittal to Material List
        }
        
        // If already in new format, return as is
        if (type === "For Approval (APP)" || type === "Enquiry" || type === "Material List") {
          return type;
        }
        
        // Default: map unknown types to "For Approval (APP)"
        return "For Approval (APP)";
      };

      const mappedSubmissions = submissions.map((s) => {
        // Resolve PDF path for submissions
        const resolvedPdfPath = resolvePdfPath(
          projectId,
          "upcoming_submissions",
          {
            id: s.id,
            drawingNo: s.drawing_number,
            drawing_number: s.drawing_number,
            jobNo: jobNumber,
            submissionType: s.submission_type,
          },
          (s as any).pdf_path || (s as any).pdfPath
        );
        
        return {
          id: s.id,
          proultimaPm: s.submitted_by || "Vel, Rajesh",
          jobNo: jobNumber,
          projectName: project.project_name,
          submissionType: mapSubmissionType(s.submission_type),
          workDescription: s.work_description || "",
          drawingNo: s.drawing_number || "",
          submissionDate: s.submission_date,
          pdfPath: normalizePdfPath(resolvedPdfPath),
        };
      });

      // Return paginated response with no-cache headers
      const paginated = createPaginatedResponse(mappedSubmissions, page, pageSize);
      return NextResponse.json(paginated, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }

    // change_orders - Fetch from Supabase
    if (section === "change_orders") {
      const changeOrders = await getChangeOrdersByProject(supabase, projectId);

      // Sort by submitted date (descending)
      changeOrders.sort((a, b) => {
        const dateA = new Date(a.submitted_date || 0).getTime();
        const dateB = new Date(b.submitted_date || 0).getTime();
        return dateB - dateA;
      });

      const mappedChangeOrders = changeOrders.map((co, index) => {
        // Format change order ID as "U2524 - CO #001"
        // Handle cases where change_order_id might already include "CO #" or just be a number
        let coNumber = String(co.change_order_id || "").trim();
        // Remove any existing "CO #" or "CO#" prefix if present
        coNumber = coNumber.replace(/^CO\s*#?\s*/i, "").trim();
        // Ensure we have a valid number, default to empty string if not
        if (!coNumber) {
          coNumber = "001"; // Default fallback
        }
        const formattedChangeOrderId = `${jobNumber} - CO #${coNumber}`;
        
        // Calculate sequential number (1-based index + 100 to match example format like "112")
        // This can be adjusted based on actual sequential numbering system
        const sequentialNumber = String(100 + index + 1).padStart(3, '0');
        
        // Resolve PDF path for change orders using local file structure
        const resolvedPdfPath = resolvePdfPath(
          projectId,
          "change_orders",
          {
            id: co.id,
            changeOrderId: formattedChangeOrderId,
            change_order_id: co.change_order_id,
            sequentialNumber: sequentialNumber, // Pass sequential number for path generation
            sequential_number: sequentialNumber,
            jobNo: jobNumber,
            job_number: jobNumber,
            projectNumber: jobNumber,
            project_number: jobNumber,
            projectName: project.project_name,
            project_name: project.project_name,
            drawingNo: co.drawing_no,
          },
          (co as any).pdf_path || (co as any).pdfPath
        );
        
        return {
          id: co.id,
          changeOrderId: formattedChangeOrderId,
          description: co.drawing_no, // Using drawing_no as description field
          hours: co.hours,
          date: co.submitted_date,
          status: co.status,
          pdfPath: normalizePdfPath(resolvedPdfPath),
        };
      });

      // Return paginated response
      const paginated = createPaginatedResponse(mappedChangeOrders, page, pageSize);
      return NextResponse.json(paginated);
    }

    // rfi_submissions - Fetch RFI submissions for this project
    if (section === "rfi_submissions") {
      const { data: submissions, error } = await supabase
        .from('submissions')
        .select(`
          *,
          projects (
            project_number,
            project_name
          )
        `)
        .eq('project_id', projectId)
        .eq('submission_type', 'RFI')
        .order('submission_date', { ascending: false });

      if (error) {
        console.error("Supabase error fetching RFI submissions:", error);
        throw error;
      }

      // Map submissions to the expected format
      const rfiRows = (submissions || []).map((s: any) => {
        const project = s.projects as any;
        
        // Parse work_description JSON if it exists
        let rfiData: any = {};
        try {
          if (s.work_description) {
            rfiData = JSON.parse(s.work_description);
          }
        } catch {
          // If not JSON, treat as legacy format
          rfiData = { question: s.work_description || "" };
        }

        // Generate RFI No from PRO RFI # or use a default
        const proRfiNo = rfiData.proRfiNo || `${project?.project_number || ""}_RFI#${s.id.slice(0, 6)}`;
        
        // Combine drawing references
        const drawingRef = rfiData.placingDrawingReference 
          ? `${rfiData.placingDrawingReference}${rfiData.contractDrawingReference ? ` / ${rfiData.contractDrawingReference}` : ""}`
          : s.drawing_number || "";

        // Resolve PDF path for RFI submissions
        const resolvedPdfPath = resolvePdfPath(
          projectId,
          "rfi_submissions",
          {
            id: s.id,
            rfiNo: proRfiNo,
            rfi_no: proRfiNo,
            proRfiNo: rfiData.proRfiNo,
            jobNo: project?.project_number ?? "",
            drawingNo: s.drawing_number,
          },
          (s as any).pdf_path || (s as any).pdfPath
        );
        
        return {
          id: s.id,
          rfiNo: proRfiNo,
          projectName: project?.project_name ?? project.project_name ?? "",
          jobNo: project?.project_number ?? project.project_number ?? "",
          client: rfiData.client || project?.client_name || "",
          impactedElement: rfiData.impactedElement || "",
          drawingReference: drawingRef,
          date: s.submission_date,
          status: s.status || "OPEN",
          // Additional fields for editing
          projectId: s.project_id,
          proRfiNo: rfiData.proRfiNo,
          placingDrawingReference: rfiData.placingDrawingReference || s.drawing_number || "",
          contractDrawingReference: rfiData.contractDrawingReference || "",
          question: rfiData.question || s.notes || "",
          pdfPath: normalizePdfPath(resolvedPdfPath),
        };
      });

      // Return paginated response
      const paginated = createPaginatedResponse(rfiRows, page, pageSize);
      return NextResponse.json(paginated);
    }

    // Fallback for unknown sections
    const paginated = createPaginatedResponse([], page, pageSize);
    return NextResponse.json(paginated);
  } catch (error) {
    console.error("Error fetching project sections:", error);
    return NextResponse.json(
      { error: "Failed to fetch project sections" },
      { status: 500 }
    );
  }
}
