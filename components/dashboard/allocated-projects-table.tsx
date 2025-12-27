"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Checkbox } from "@/components/ui/checkbox";
import { fetchJson } from "@/lib/api/fetch-json";
import { queryKeys } from "@/lib/query/keys";
import type { ProjectsListItem } from "@/app/api/projects/route";
import { FileText, Building2, Hash, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

function getStatusVariant(status: string | null | undefined): "default" | "secondary" | "destructive" | "outline" {
  if (!status) return "outline";
  const upperStatus = status.toUpperCase();
  if (upperStatus.includes("COMPLETED") || upperStatus.includes("RELEASED")) {
    return "default";
  }
  if (upperStatus.includes("CANCELLED") || upperStatus.includes("REJECTED")) {
    return "destructive";
  }
  return "outline";
}

function getStatusColor(status: string | null | undefined): string {
  if (!status) return "";
  const upperStatus = status.toUpperCase();
  if (upperStatus.includes("COMPLETED") || upperStatus.includes("RELEASED")) {
    return "bg-emerald-600 text-white border-emerald-600";
  }
  if (upperStatus.includes("CANCELLED") || upperStatus.includes("REJECTED")) {
    return "bg-red-600 text-white border-red-600";
  }
  return "";
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    return format(date, "MMM dd, yyyy");
  } catch {
    return "—";
  }
}

export function AllocatedProjectsTable() {
  const router = useRouter();
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [selectedProjects, setSelectedProjects] = React.useState<Set<string>>(new Set());

  const { data: projects = [], isLoading } = useQuery({
    queryKey: queryKeys.projects(),
    queryFn: () => fetchJson<ProjectsListItem[]>("/api/projects"),
    staleTime: 30_000,
  });

  // Sort by project number
  const sortedProjects = React.useMemo(() => {
    return [...projects].sort((a, b) => {
      return a.jobNumber.localeCompare(b.jobNumber);
    });
  }, [projects]);

  // Calculate pagination
  const total = sortedProjects.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedProjects = sortedProjects.slice(startIndex, endIndex);

  // Reset to page 1 if current page is out of bounds
  React.useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(1);
    }
  }, [totalPages, page]);

  // Checkbox handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(paginatedProjects.map((p) => p.id));
      setSelectedProjects((prev) => new Set([...prev, ...allIds]));
    } else {
      const pageIds = new Set(paginatedProjects.map((p) => p.id));
      setSelectedProjects((prev) => {
        const newSet = new Set(prev);
        pageIds.forEach((id) => newSet.delete(id));
        return newSet;
      });
    }
  };

  const handleSelectProject = (projectId: string, checked: boolean) => {
    setSelectedProjects((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(projectId);
      } else {
        newSet.delete(projectId);
      }
      return newSet;
    });
  };

  // Check if all current page items are selected
  const allPageItemsSelected = paginatedProjects.length > 0 && paginatedProjects.every((p) => selectedProjects.has(p.id));
  const somePageItemsSelected = paginatedProjects.some((p) => selectedProjects.has(p.id));

  // Handle row click to navigate to project details
  const handleRowClick = (projectId: string, e: React.MouseEvent) => {
    // Don't navigate if clicking on checkbox
    if ((e.target as HTMLElement).closest('input[type="checkbox"]')) {
      return;
    }
    router.push(`/projects/${projectId}`);
  };

  if (isLoading) {
    return (
      <Card className="w-full shadow-lg overflow-hidden">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Recently Allocated Projects</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Projects allocated through the allocation form
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg overflow-hidden">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Recently Allocated Projects</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Projects allocated through the allocation form
        </p>
      </CardHeader>
      <CardContent>
        {sortedProjects.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
              <FileText className="h-8 w-8 opacity-50" />
            </div>
            <p className="text-base font-medium mb-1">No projects allocated yet</p>
            <p className="text-sm">Use the "Allocate Project" button to create one</p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-lg border bg-background/50 backdrop-blur-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-emerald-50/70 hover:bg-emerald-50/70">
                    <TableHead className="px-4 py-4 w-12">
                      <div className="flex items-center justify-center">
                        <Checkbox
                          checked={allPageItemsSelected || (somePageItemsSelected ? "indeterminate" : false)}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center text-emerald-900 font-semibold">
                      <div className="flex items-center justify-center gap-2">
                        <Hash className="h-4 w-4" />
                        Project Number
                      </div>
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center text-emerald-900 font-semibold">
                      <div className="flex items-center justify-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Project Name
                      </div>
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center text-emerald-900 font-semibold">
                      Detailing Status
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center text-emerald-900 font-semibold">
                      Revision Status
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center text-emerald-900 font-semibold">
                      Release Status
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center text-emerald-900 font-semibold">
                      <div className="flex items-center justify-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Date
                      </div>
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center text-emerald-900 font-semibold">
                      <div className="flex items-center justify-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Expected Submission date
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProjects.map((project, index) => (
                    <TableRow
                      key={project.id}
                      className="hover:bg-emerald-50/30 transition-colors cursor-pointer"
                      onClick={(e) => handleRowClick(project.id, e)}
                    >
                      <TableCell className="px-4 py-4 w-12">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={selectedProjects.has(project.id)}
                            onCheckedChange={(checked) => handleSelectProject(project.id, checked as boolean)}
                            aria-label={`Select ${project.jobNumber}`}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center font-semibold text-emerald-900">
                        {project.jobNumber}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center max-w-xs">
                        <div
                          className="truncate font-medium"
                          title={project.name}
                        >
                          {project.name}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        <Badge
                          variant={getStatusVariant(project.detailingStatus)}
                          className={getStatusColor(project.detailingStatus)}
                        >
                          {project.detailingStatus || "IN PROCESS"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        <Badge
                          variant={getStatusVariant(project.revisionStatus)}
                          className={getStatusColor(project.revisionStatus)}
                        >
                          {project.revisionStatus || "IN PROCESS"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        <Badge
                          variant={getStatusVariant(project.releaseStatus)}
                          className={getStatusColor(project.releaseStatus)}
                        >
                          {project.releaseStatus || "IN PROCESS"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center text-sm">
                        {formatDate(project.createdAt)}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center text-sm">
                        {formatDate(project.dueDate)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4">
              <PaginationControls
                page={page}
                pageSize={pageSize}
                total={total}
                totalPages={totalPages}
                onPageChange={setPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setPage(1); // Reset to first page when changing page size
                }}
                pageSizeOptions={[20, 40, 60, 80, 100, 200, 400, 500]}
                itemLabel="projects"
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

