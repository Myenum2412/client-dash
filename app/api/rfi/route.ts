import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parsePaginationParams, createPaginatedResponse } from "@/lib/api/pagination";
import { requireUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export type RFIRow = {
  id: string;
  proultimaPm: string;
  jobNo: string;
  projectName: string;
  workDescription: string;
  drawingNo: string;
  submissionDate: string;
  status: string;
  evaluationDate: string | null;
  evaluatedBy: string | null;
  sheets: string | null;
  pdfPath: string | null;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, pageSize } = parsePaginationParams(searchParams);
    
    const supabase = await createSupabaseServerClient();
    
    // Fetch only RFI submissions with project data
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select(`
        *,
        projects (
          project_number,
          project_name
        )
      `)
      .eq('submission_type', 'RFI')
      .order('submission_date', { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    // Map submissions to the expected format
    const rfiRows: RFIRow[] = (submissions || []).map((s: any) => {
      const project = s.projects as any;
      return {
        id: s.id,
        proultimaPm: s.submitted_by || "PROULTIMA PM",
        jobNo: project?.project_number ?? "",
        projectName: project?.project_name ?? "",
        workDescription: s.work_description || "",
        drawingNo: s.drawing_number || "",
        submissionDate: s.submission_date,
        status: s.status || "PENDING",
        evaluationDate: s.evaluation_date,
        evaluatedBy: s.evaluated_by,
        sheets: s.sheets,
        pdfPath: s.pdf_path,
      };
    });

    // Return paginated response
    const paginated = createPaginatedResponse(rfiRows, page, pageSize);
    return NextResponse.json(paginated);
  } catch (error) {
    console.error("Error fetching RFI submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch RFI submissions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Ensure user is authenticated
    await requireUser();
    
    const body = await request.json();
    const {
      project_id,
      work_description,
      drawing_number,
      sheets,
      submission_date,
      submitted_by,
      status,
    } = body;

    // Validate required fields
    if (!project_id || !work_description || !submission_date) {
      return NextResponse.json(
        { error: "Missing required fields: project_id, work_description, submission_date" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // Insert new RFI submission
    const { data: newRFI, error } = await supabase
      .from("submissions")
      .insert({
        project_id,
        submission_type: "RFI",
        work_description,
        drawing_number: drawing_number || null,
        sheets: sheets || null,
        submission_date,
        submitted_by: submitted_by || "PROULTIMA PM",
        status: status || "PENDING",
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    return NextResponse.json(
      { message: "RFI created successfully", data: newRFI },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating RFI:", error);
    return NextResponse.json(
      { error: "Failed to create RFI submission" },
      { status: 500 }
    );
  }
}

