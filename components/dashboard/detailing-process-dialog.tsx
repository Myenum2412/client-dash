"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Calendar,
    User,
    FileText,
    Download,
    Clock,
    CheckCircle2,
    MessageSquare,
    History,
    Upload,
    Activity,
  } from "lucide-react";
      
import { format } from "date-fns";
import type { ProjectsListItem } from "@/app/api/projects/route";

type DetailingProcessDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: ProjectsListItem[];
};

type DetailingProject = {
  id: string;
  projectName: string;
  jobNumber: string;
  detailingStatus: string;
  assignedDetailers: string[];
  startDate: string | null;
  expectedCompletionDate: string | null;
  progressPercentage: number;
  latestUpdate: string | null;
  uploadedFiles: Array<{
    name: string;
    url: string;
    type: string;
    uploadedAt: string;
  }>;
  revisionHistory: Array<{
    version: string;
    date: string;
    updatedBy: string;
    changes: string;
  }>;
};

// Mock data generator - in production, this would come from API
function getDetailingDetails(project: ProjectsListItem): DetailingProject {
  // Generate mock data based on project
  const detailers = ["Vel", "Rajesh"];
  const randomDetailer = detailers[Math.floor(Math.random() * detailers.length)];
  
  return {
    id: project.id,
    projectName: project.name,
    jobNumber: project.jobNumber,
    detailingStatus: project.detailingStatus || "IN PROCESS",
    assignedDetailers: [randomDetailer],
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    expectedCompletionDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
    progressPercentage: Math.floor(Math.random() * 40) + 40, // 40-80%
    latestUpdate: "Working on foundation drawings. All panels reviewed and approved.",
    uploadedFiles: [
      {
        name: "Foundation_Drawings.pdf",
        url: "#",
        type: "application/pdf",
        uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        name: "Reference_Specs.docx",
        url: "#",
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    revisionHistory: [
      {
        version: "Rev 1.0",
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updatedBy: randomDetailer,
        changes: "Initial detailing started",
      },
      {
        version: "Rev 1.1",
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedBy: randomDetailer,
        changes: "Foundation drawings updated based on client feedback",
      },
    ],
  };
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "Not set";
  try {
    const date = new Date(dateString);
    return format(date, "MMM dd, yyyy");
  } catch {
    return "Invalid date";
  }
}

export function DetailingProcessDialog({
  open,
  onOpenChange,
  projects,
}: DetailingProcessDialogProps) {
  const detailingProjects = React.useMemo(() => {
    return projects
      .filter((p) => p.detailingStatus === "IN PROCESS")
      .map(getDetailingDetails);
  }, [projects]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-screen-xl w-full min-w-[95vw] max-h-[95vh] h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0 w-full">
          <DialogTitle>Detailing Process Details</DialogTitle>
          <DialogDescription>
            Comprehensive detailing information for projects in process
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 px-6 pb-6 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
          <div className="space-y-6">
            {detailingProjects.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No projects in detailing process</p>
                <p className="text-sm mt-2">
                  All projects have completed detailing or are pending start
                </p>
              </div>
            ) : (
              detailingProjects.map((project) => (
                <div
                  key={project.id}
                  className="border rounded-lg p-6 space-y-4 bg-card"
                >
                  {/* Project Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{project.projectName}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Job Number: {project.jobNumber}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    >
                      {project.detailingStatus}
                    </Badge>
                  </div>

                  <Separator />

                  {/* Key Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Assigned Detailers */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <User className="h-4 w-4" />
                        Assigned Detailer(s)
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {project.assignedDetailers.map((detailer, idx) => (
                          <Badge key={idx} variant="outline">
                            {detailer}
                          </Badge>
                        ))}
                      </div>
                    </div>

                     {/* Progress Percentage */}
                     <div className="space-y-2">
                       <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                         <Activity className="h-4 w-4" />
                         Current Progress
                       </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{project.progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-emerald-600 h-2 rounded-full transition-all"
                            style={{ width: `${project.progressPercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Start Date */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Start Date
                      </div>
                      <p className="text-sm">{formatDate(project.startDate)}</p>
                    </div>

                    {/* Expected Completion Date */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4" />
                        Expected Completion Date
                      </div>
                      <p className="text-sm">{formatDate(project.expectedCompletionDate)}</p>
                    </div>
                  </div>

                  {/* Latest Update / Remarks */}
                  {project.latestUpdate && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <MessageSquare className="h-4 w-4" />
                        Latest Update / Remarks
                      </div>
                      <div className="bg-muted/50 rounded-md p-3 text-sm">
                        {project.latestUpdate}
                      </div>
                    </div>
                  )}

                  {/* Uploaded Files */}
                  {project.uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Upload className="h-4 w-4" />
                        Uploaded Drawings / Reference Files
                      </div>
                      <div className="space-y-2">
                        {project.uploadedFiles.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Uploaded {formatDate(file.uploadedAt)}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Handle file download
                                window.open(file.url, "_blank");
                              }}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Revision History */}
                  {project.revisionHistory.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <History className="h-4 w-4" />
                        Revision / Version History
                      </div>
                      <div className="space-y-2">
                        {project.revisionHistory.map((revision, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 p-3 border rounded-md"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {revision.version}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(revision.date)}
                                </span>
                              </div>
                              <p className="text-sm font-medium">{revision.changes}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Updated by: {revision.updatedBy}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

