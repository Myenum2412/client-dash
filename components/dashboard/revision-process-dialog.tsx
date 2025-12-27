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
  User,
  FileText,
  Download,
  Clock,
  MessageSquare,
  History,
  Upload,
  Activity,
  Eye,
  X,
} from "lucide-react";
import { format } from "date-fns";
import type { ProjectsListItem } from "@/app/api/projects/route";

type RevisionProcessDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: ProjectsListItem[];
};

type RevisionProject = {
  id: string;
  projectName: string;
  jobNumber: string;
  revisionStatus: string;
  currentStage: string;
  lastUpdated: string | null;
  responsibleTeamMember: string;
  revisionNotes: string | null;
  attachedFiles: Array<{
    name: string;
    url: string;
    type: string;
    uploadedAt: string;
  }>;
  versionHistory: Array<{
    version: string;
    date: string;
    updatedBy: string;
    changes: string;
    status: string;
  }>;
};

// Mock data generator - in production, this would come from API
function getRevisionDetails(project: ProjectsListItem): RevisionProject {
  const teamMembers = ["Vel", "Rajesh"];
  const randomMember = teamMembers[Math.floor(Math.random() * teamMembers.length)];
  const stages = ["Initial Review", "Client Feedback", "Final Revision", "Approval Pending"];
  const randomStage = stages[Math.floor(Math.random() * stages.length)];
  
  return {
    id: project.id,
    projectName: project.name,
    jobNumber: project.jobNumber,
    revisionStatus: project.revisionStatus || "IN PROCESS",
    currentStage: randomStage,
    lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    responsibleTeamMember: randomMember,
    revisionNotes: "Reviewing client feedback on foundation drawings. Need to update panel connections based on new specifications.",
    attachedFiles: [
      {
        name: "Revision_Drawings_Rev2.pdf",
        url: "#",
        type: "application/pdf",
        uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        name: "Client_Feedback_Comments.docx",
        url: "#",
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        name: "Updated_Specifications.xlsx",
        url: "#",
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        uploadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    versionHistory: [
      {
        version: "Rev 1.0",
        date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updatedBy: randomMember,
        changes: "Initial revision submitted",
        status: "COMPLETED",
      },
      {
        version: "Rev 1.1",
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updatedBy: randomMember,
        changes: "Client requested changes to foundation details",
        status: "COMPLETED",
      },
      {
        version: "Rev 2.0",
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedBy: randomMember,
        changes: "Current revision in progress - updating panel connections",
        status: "IN PROCESS",
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

function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return "Not set";
  try {
    const date = new Date(dateString);
    return format(date, "MMM dd, yyyy 'at' hh:mm a");
  } catch {
    return "Invalid date";
  }
}

export function RevisionProcessDialog({
  open,
  onOpenChange,
  projects,
}: RevisionProcessDialogProps) {
  const revisionProjects = React.useMemo(() => {
    return projects
      .filter((p) => p.revisionStatus === "IN PROCESS")
      .map(getRevisionDetails);
  }, [projects]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-screen-xl w-full min-w-[95vw] max-h-[95vh] h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0 w-full">
          <DialogTitle>Revision Process Details</DialogTitle>
          <DialogDescription>
            Comprehensive revision information for projects in process
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 px-6 pb-6 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-6">
              {revisionProjects.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No projects in revision process</p>
                  <p className="text-sm mt-2">
                    All projects have completed revisions or are pending start
                  </p>
                </div>
              ) : (
                revisionProjects.map((project) => (
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
                        {project.revisionStatus}
                      </Badge>
                    </div>

                    <Separator />

                    {/* Key Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Revision Status */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Activity className="h-4 w-4" />
                          Revision Status
                        </div>
                        <Badge variant="outline" className="text-sm">
                          {project.revisionStatus}
                        </Badge>
                      </div>

                      {/* Current Stage */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <History className="h-4 w-4" />
                          Current Stage
                        </div>
                        <p className="text-sm font-medium">{project.currentStage}</p>
                      </div>

                      {/* Last Updated */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          Last Updated
                        </div>
                        <p className="text-sm">{formatDateTime(project.lastUpdated)}</p>
                      </div>

                      {/* Responsible Team Member */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <User className="h-4 w-4" />
                          Responsible Team Member
                        </div>
                        <Badge variant="outline">{project.responsibleTeamMember}</Badge>
                      </div>
                    </div>

                    {/* Revision Notes / Comments */}
                    {project.revisionNotes && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <MessageSquare className="h-4 w-4" />
                          Revision Notes / Comments
                        </div>
                        <div className="bg-muted/50 rounded-md p-3 text-sm">
                          {project.revisionNotes}
                        </div>
                      </div>
                    )}

                    {/* Attached Files / Drawings */}
                    {project.attachedFiles.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Upload className="h-4 w-4" />
                          Attached Files / Drawings
                        </div>
                        <div className="space-y-2">
                          {project.attachedFiles.map((file, idx) => (
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
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    // Handle file view
                                    window.open(file.url, "_blank");
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Button>
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
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Version History Timeline */}
                    {project.versionHistory.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <History className="h-4 w-4" />
                          Version History Timeline
                        </div>
                        <div className="space-y-3">
                          {project.versionHistory.map((revision, idx) => (
                            <div
                              key={idx}
                              className="relative flex items-start gap-4 pl-6"
                            >
                              {/* Timeline line */}
                              {idx < project.versionHistory.length - 1 && (
                                <div className="absolute left-2 top-8 bottom-0 w-0.5 bg-border" />
                              )}
                              {/* Timeline dot */}
                              <div
                                className={`absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 ${
                                  revision.status === "IN PROCESS"
                                    ? "bg-blue-500 border-blue-500"
                                    : "bg-emerald-500 border-emerald-500"
                                }`}
                              />
                              <div className="flex-1 border rounded-md p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${
                                      revision.status === "IN PROCESS"
                                        ? "bg-blue-50 text-blue-700 border-blue-300"
                                        : "bg-emerald-50 text-emerald-700 border-emerald-300"
                                    }`}
                                  >
                                    {revision.version}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${
                                      revision.status === "IN PROCESS"
                                        ? "bg-blue-50 text-blue-700 border-blue-300"
                                        : ""
                                    }`}
                                  >
                                    {revision.status}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground ml-auto">
                                    {formatDateTime(revision.date)}
                                  </span>
                                </div>
                                <p className="text-sm font-medium mb-1">{revision.changes}</p>
                                <p className="text-xs text-muted-foreground">
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

