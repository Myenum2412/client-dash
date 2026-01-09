import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProjectById } from "@/lib/supabase/queries";
import { TopHeader } from "@/components/app/top-header";
import { ProjectCardsAccordion } from "@/components/projects/project-cards-accordion";
import { ProjectDetailsComprehensive } from "@/components/projects/project-details-comprehensive";
import { requireUser } from "@/lib/auth/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projectId: string }>;
}): Promise<Metadata> {
  try {
    const { projectId } = await params;
    const supabase = await createSupabaseServerClient();
    const project = await getProjectById(supabase, projectId);
    
    return {
      title: `${project.project_number} - ${project.project_name}`,
      description: `View project details, drawings, submissions, invoices, and change orders for ${project.project_name}`,
    };
  } catch {
    return {
      title: "Project Details",
      description: "View project details and related information",
    };
  }
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  await requireUser();
  const supabase = await createSupabaseServerClient();

  // Fetch project from Supabase
  let project;
  try {
    project = await getProjectById(supabase, projectId);
  } catch {
    notFound();
  }

  if (!project) {
    notFound();
  }

  return (
    <>
      <TopHeader
        section="Projects"
        page={project.project_name}
        search={{ placeholder: "Search projects...", action: "/client/projects", name: "q" }}
      />
      <div className="min-h-0 flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Comprehensive Project Details */}
        <div className="animate-in fade-in slide-in-from-bottom-1 duration-300">
          <ProjectDetailsComprehensive projectId={projectId} />
        </div>

        <ProjectCardsAccordion projectId={projectId} />
      </div>
    </>
  );
}
