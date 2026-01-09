import type { Metadata } from "next";
import { TopHeader } from "@/components/app/top-header";
import { ProjectCardsAccordion } from "@/components/projects/project-cards-accordion";
import {
  ProjectOverview,
  type ProjectOverviewData,
} from "@/components/projects/project-overview";
import { LocalStorageDataDisplay } from "@/components/projects/local-storage-data-display";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/server";
import { ProjectsPageClient } from "@/components/projects/projects-page-client";
import { ProjectSearchResults } from "@/components/projects/project-search-results";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getProjects,
  getProjectById,
  getAllDrawingsByProject,
} from "@/lib/supabase/queries";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "View and manage all your construction projects, drawings, and project details",
};

// Use dynamic rendering with caching for better performance
export const dynamic = "force-dynamic";
export const revalidate = 3600; // Revalidate every hour

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; q?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const searchQuery = params.q;
  const supabase = await createSupabaseServerClient();

  // Fetch projects from Supabase
  const projectsData = await getProjects(supabase);

  const projects = projectsData.map((p) => ({
    id: p.id,
    jobNumber: p.project_number,
    name: p.project_name,
  }));

  // Get selected project ID from URL params, default to first project
  const selectedProjectId = params.project || projects[0]?.id || "";

  // Find the selected project
  const selectedProject = await getProjectById(supabase, selectedProjectId);

  if (!selectedProject) {
    // Fallback to first project if not found
    const firstProject = projectsData[0];
    if (!firstProject) {
      throw new Error("No projects found");
    }
  }

  const project = selectedProject || projectsData[0];

  // Calculate metrics from drawings data
  const drawings = await getAllDrawingsByProject(supabase, project.id);

  const totals = drawings.reduce(
    (acc: { total: number; released: number }, r) => {
      acc.total += r.total_weight || 0;
      const rs = String(r.release_status ?? "").toLowerCase();
      if (rs.includes("released")) acc.released += r.total_weight || 0;
      return acc;
    },
    { total: 0, released: 0 }
  );

  const overview: ProjectOverviewData = {
    projectName: project.project_name,
    jobNumber: project.project_number,
    fabricatorName: null,
    contractorName: project.contractor_name ?? null,
    projectLocation: null,
    estimatedTons: project.estimated_tons ?? null,
    approvalTons: totals.total,
    latestRevTons: totals.total,
    releasedTons: totals.released,
    detailingStatus: project.detailing_status ?? null,
    revisionStatus: project.revision_status ?? null,
    releaseStatus: project.release_status ?? null,
  };

  return (
    <>
      <TopHeader
        section="Projects"
        page="All Projects"
        search={{
          placeholder: "Search projects...",
          action: "/client/projects",
          name: "q",
        }}
      />
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* Show search results if query exists */}
          {searchQuery && (
            <div className="animate-in fade-in slide-in-from-bottom-1 duration-300">
              <ProjectSearchResults />
            </div>
          )}

          {/* Show project cards only if no search query */}
          {!searchQuery && (
            <>
              <Card className="w-full shadow-lg overflow-hidden relative animate-in fade-in slide-in-from-bottom-1 duration-300">
                <div className="absolute inset-0 h-full w-full bg-section opacity-70 " />
                <CardHeader className="relative overflow-hidden ">
                  <div className="relative">
                    <h1 className="text-xl font-semibold text-white">
                      Project Drawings Overview
                    </h1>
                    <p className="text-sm text-white/80">
                      Select a project to view drawings, submissions, invoices,
                      logs, and change orders
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="-mt-4">
                  <ProjectsPageClient
                    projects={projects}
                    selectedProjectId={selectedProjectId}
                  />
                </CardContent>
              </Card>

              {/* Show selected project details */}
              <Card className="w-full shadow-lg overflow-hidden relative p-0">
                <CardContent className="p-0 border-none">
                  <div className="animate-in fade-in slide-in-from-bottom-1 duration-300">
                    <ProjectOverview data={overview} />
                  </div>
                </CardContent>
              </Card>

              <ProjectCardsAccordion key={selectedProjectId} projectId={selectedProjectId} />
              <LocalStorageDataDisplay />
            </>
          )}
        </div>
    </>
  );
}
