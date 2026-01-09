import type { Metadata } from "next";
import { TopHeader } from "@/components/app/top-header";
import { ProjectFilesClient } from "@/components/files/project-files-client";

export const metadata: Metadata = {
  title: "Project Files",
  description: "View project files and folders",
};

export default async function ProjectFilesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <>
      <TopHeader
        section="Files"
        page={`Project: ${decodeURIComponent(projectId)}`}
        search={{ placeholder: "Search files...", action: `/client/files/${projectId}`, name: "q" }}
      />
      <div className="min-h-0 flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
        <ProjectFilesClient projectId={projectId} />
      </div>
    </>
  );
}
