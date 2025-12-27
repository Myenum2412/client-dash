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
  Building2,
  MapPin,
  Calendar,
  FileText,
  User,
  CheckCircle2,
  Clock,
  DollarSign,
  Briefcase,
} from "lucide-react";
import { format } from "date-fns";
import type { ProjectsListItem } from "@/app/api/projects/route";

type ReleasedJobsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: ProjectsListItem[];
};

type ReleasedProject = {
  id: string;
  jobTitle: string;
  jobId: string;
  companyName: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  description: string;
  requiredSkills: string[];
  postedDate: string | null;
  applicationDeadline: string | null;
  releaseStatus: string;
  releasedDate: string | null;
};

// Mock data generator - in production, this would come from API
function getReleasedProjectDetails(project: ProjectsListItem): ReleasedProject {
  const contractors = ["T&T CONSTRUCTION", "FORCINE CONCRETE", "ABC BUILDERS"];
  const locations = ["JESSUP, PA", "BETHEL, PA", "UPPER SAUCON TWP, PA"];
  const jobTypes = ["Tilt Panels", "Foundation", "Structural Steel"];
  const experienceLevels = ["Intermediate", "Advanced", "Expert"];
  const skills = [
    "Structural Engineering",
    "CAD Design",
    "Project Management",
    "Quality Control",
    "Steel Detailing",
  ];

  const randomContractor = contractors[Math.floor(Math.random() * contractors.length)];
  const randomLocation = locations[Math.floor(Math.random() * locations.length)];
  const randomJobType = jobTypes[Math.floor(Math.random() * jobTypes.length)];
  const randomExperience = experienceLevels[Math.floor(Math.random() * experienceLevels.length)];
  const selectedSkills = skills.slice(0, Math.floor(Math.random() * 3) + 3);

  return {
    id: project.id,
    jobTitle: project.name,
    jobId: project.jobNumber,
    companyName: randomContractor,
    location: randomLocation,
    jobType: randomJobType,
    experienceLevel: randomExperience,
    description: `Complete project details for ${project.name}. This project involves comprehensive structural engineering and detailing work. All drawings have been reviewed, approved, and released for production.`,
    requiredSkills: selectedSkills,
    postedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    releaseStatus: project.releaseStatus || "RELEASED COMPLETELY",
    releasedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
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

export function ReleasedJobsDialog({
  open,
  onOpenChange,
  projects,
}: ReleasedJobsDialogProps) {
  const releasedProjects = React.useMemo(() => {
    return projects
      .filter((p) => p.releaseStatus?.includes("RELEASED"))
      .map(getReleasedProjectDetails);
  }, [projects]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-screen-xl w-full min-w-[95vw] max-h-[95vh] h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0 w-full">
          <DialogTitle>Released Jobs</DialogTitle>
          <DialogDescription>
            Complete details of all released projects and jobs
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 px-6 pb-6 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-6">
              {releasedProjects.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No released jobs</p>
                  <p className="text-sm mt-2">
                    There are currently no projects that have been released
                  </p>
                </div>
              ) : (
                releasedProjects.map((project) => (
                  <div
                    key={project.id}
                    className="border rounded-lg p-6 space-y-4 bg-card hover:shadow-md transition-shadow"
                  >
                    {/* Header Section */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold">{project.jobTitle}</h3>
                          <Badge
                            variant="default"
                            className="bg-emerald-600 text-white"
                          >
                            {project.releaseStatus}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            <span>Job ID: {project.jobId}</span>
                          </div>
                          {project.releasedDate && (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Released: {formatDate(project.releasedDate)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Key Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Company Name */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                          Company Name
                        </div>
                        <p className="text-sm font-medium">{project.companyName}</p>
                      </div>

                      {/* Location */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          Location
                        </div>
                        <p className="text-sm">{project.location}</p>
                      </div>

                      {/* Job Type */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Briefcase className="h-4 w-4" />
                          Job Type
                        </div>
                        <Badge variant="outline">{project.jobType}</Badge>
                      </div>

                      {/* Experience Level */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <User className="h-4 w-4" />
                          Experience Level
                        </div>
                        <Badge variant="secondary">{project.experienceLevel}</Badge>
                      </div>

                      {/* Posted Date */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          Posted Date
                        </div>
                        <p className="text-sm">{formatDate(project.postedDate)}</p>
                      </div>

                      {/* Application Deadline */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          Application Deadline
                        </div>
                        <p className="text-sm">{formatDate(project.applicationDeadline)}</p>
                      </div>
                    </div>

                    {/* Description */}
                    {project.description && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          Description
                        </div>
                        <div className="bg-muted/50 rounded-md p-4 text-sm leading-relaxed">
                          {project.description}
                        </div>
                      </div>
                    )}

                    {/* Required Skills */}
                    {project.requiredSkills.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Briefcase className="h-4 w-4" />
                          Required Skills
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {project.requiredSkills.map((skill, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
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

