import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProjects, createProject } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export type ProjectsListItem = {
  id: string;
  jobNumber: string;
  name: string;
  estimatedTons?: number | null;
  releasedTons?: number | null;
  detailingStatus?: string | null;
  revisionStatus?: string | null;
  releaseStatus?: string | null;
  createdAt?: string | null;
  dueDate?: string | null;
};

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Fetch projects from Supabase
    const projects = await getProjects(supabase);

    const items: ProjectsListItem[] = projects.map((p) => ({
      id: p.id,
      jobNumber: p.project_number,
      name: p.project_name,
      estimatedTons: p.estimated_tons,
      releasedTons: p.released_tons,
      detailingStatus: p.detailing_status,
      revisionStatus: p.revision_status,
      releaseStatus: p.release_status,
      createdAt: p.created_at,
      dueDate: p.due_date,
    }));

    return NextResponse.json(items, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      projectName,
      projectNumber,
      dueDate,
      description,
    } = body;

    if (!projectName || !projectNumber) {
      return NextResponse.json(
        { error: "Project name and number are required" },
        { status: 400 }
      );
    }

    // Use description as is
    const finalDescription = description || "";

    // Create project in database
    const project = await createProject(supabase, {
      project_number: projectNumber,
      project_name: projectName,
      due_date: dueDate ? new Date(dueDate).toISOString().split("T")[0] : null,
      detailing_status: "IN PROCESS",
      revision_status: "IN PROCESS",
      release_status: "IN PROCESS",
      contractor_name: null, // Will use default from schema
      estimated_tons: null,
      released_tons: null,
    });

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        jobNumber: project.project_number,
        name: project.project_name,
        estimatedTons: project.estimated_tons,
        releasedTons: project.released_tons,
        detailingStatus: project.detailing_status,
        revisionStatus: project.revision_status,
        releaseStatus: project.release_status,
      },
    });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      {
        error: "Failed to create project",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


