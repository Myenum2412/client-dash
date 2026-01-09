import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parsePaginationParams, createPaginatedResponse } from "@/lib/api/pagination";
import { getSubmissions } from "@/lib/supabase/queries";
import { demoSubmissions } from "@/public/assets";

export const dynamic = "force-dynamic";
export const revalidate = 0; // Disable caching

export type SubmissionRow = {
  id: string;
  proultimaPm: string;
  jobNo: string;
  projectName: string;
  submissionType: string;
  workDescription: string;
  drawingNo: string;
  submissionDate: string;
};

// Get project name from job number
function getProjectNameFromJobNumber(jobNumber: string): string {
  const projectNames: Record<string, string> = {
    "U2524": "Valley View Business Park Tilt Panels",
    "U2532": "MID-WAY SOUTH LOGISTIC CENTER, PANELS",
    "U3223P": "PANATTONI LEHIGH 309 BUILDING B TILT PANELS",
    "PRO-2025-002": "Commercial Warehouse Complex",
    "PRO-2025-003": "Industrial Manufacturing Facility",
    "PRO-2025-004": "Retail Distribution Center",
    "PRO-2025-005": "Office Building Complex",
  };
  return projectNames[jobNumber] || `Project ${jobNumber}`;
}

// Map submission types to new format
function mapSubmissionType(type: string | null | undefined): string {
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
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, pageSize } = parsePaginationParams(searchParams);
    
    // Always use demo data for demonstration purposes
    // Map demo submissions to proper format
    const submissionRows: SubmissionRow[] = demoSubmissions.map((sub, index) => ({
      id: `demo-submission-${index + 1}`,
      proultimaPm: sub.proultimaPm || "Vel, Rajesh",
      jobNo: sub.jobNumber || "U2524",
      projectName: getProjectNameFromJobNumber(sub.jobNumber || "U2524"),
      submissionType: mapSubmissionType(sub.submissionType),
      workDescription: sub.workDescription || "",
      drawingNo: sub.drawingNo || "",
      submissionDate: sub.submissionDate || new Date().toISOString(),
    }));

    // Return paginated response with no-cache headers
    const paginated = createPaginatedResponse(submissionRows, page, pageSize);
    return NextResponse.json(paginated, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    
    // Return demo data on error as well
    const demoRows = demoSubmissions.map((sub, index) => ({
      id: `demo-submission-${index + 1}`,
      proultimaPm: sub.proultimaPm || "Vel, Rajesh",
      jobNo: sub.jobNumber || "U2524",
      projectName: getProjectNameFromJobNumber(sub.jobNumber || "U2524"),
      submissionType: mapSubmissionType(sub.submissionType),
      workDescription: sub.workDescription || "",
      drawingNo: sub.drawingNo || "",
      submissionDate: sub.submissionDate || new Date().toISOString(),
    }));
    
    const { searchParams } = new URL(request.url);
    const { page, pageSize } = parsePaginationParams(searchParams);
    const paginated = createPaginatedResponse(demoRows, page, pageSize);
    return NextResponse.json(paginated, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }
}

