"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api/fetch-json";
import { queryKeys } from "@/lib/query/keys";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  TrendingUp,
  FileText,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  Activity,
  Users,
  Folder,
  Package,
} from "lucide-react";
import { formatDate } from "@/lib/utils/date-format";

type ProjectDetails = {
  project: {
    id: string;
    projectNumber: string;
    projectName: string;
    contractorName: string | null;
    estimatedTons: number | null;
    releasedTons: number | null;
    detailingStatus: string | null;
    revisionStatus: string | null;
    releaseStatus: string | null;
    dueDate: string | null;
    createdAt: string;
    updatedAt: string;
  };
  metrics: {
    totalDrawings: number;
    approvedDrawings: number;
    releasedDrawings: number;
    pendingDrawings: number;
    yetToReleaseCount: number;
    totalInvoices: number;
    totalBilled: number;
    paidAmount: number;
    outstandingAmount: number;
  };
  counts: {
    drawingsYetToReturn: number;
    drawingsYetToRelease: number;
    drawingLogEntries: number;
    invoices: number;
    submissions: number;
    changeOrders: number;
    materialLists: number;
  };
  recentActivity: Array<{
    type: string;
    date: string;
    description: string;
  }>;
  summary: {
    completionPercentage: number;
    approvalRate: number;
    billingStatus: number;
    activeSubmissions: number;
    pendingChangeOrders: number;
  };
};

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

export function ProjectDetailsComprehensive({ projectId }: { projectId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: [...queryKeys.project(projectId), "details"],
    queryFn: () => fetchJson<ProjectDetails>(`/api/projects/${projectId}/details`),
    staleTime: 30_000, // 30 seconds
    refetchInterval: 60_000, // Refetch every minute
  });

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !data) {
    return null;
  }

  const { project, metrics, counts, recentActivity, summary } = data;

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Completion Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.completionPercentage}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.releasedDrawings} of {metrics.totalDrawings} drawings released
            </p>
          </CardContent>
        </Card>

        {/* Approval Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.approvalRate}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.approvedDrawings} drawings approved
            </p>
          </CardContent>
        </Card>

        {/* Billing Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Billing Status</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.billingStatus}%</div>
            <p className="text-xs text-muted-foreground">
              ${metrics.paidAmount.toLocaleString()} of ${metrics.totalBilled.toLocaleString()} paid
            </p>
          </CardContent>
        </Card>

        {/* Pending Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Items</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.pendingDrawings + summary.pendingChangeOrders}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.pendingDrawings} drawings, {summary.pendingChangeOrders} change orders
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Project Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Project Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-muted-foreground">Project Number</span>
                <span className="text-sm font-semibold">{project.projectNumber}</span>
              </div>
              <Separator />
              
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-muted-foreground">Contractor</span>
                <span className="text-sm font-semibold">{project.contractorName || "N/A"}</span>
              </div>
              <Separator />
              
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-muted-foreground">Estimated Tons</span>
                <span className="text-sm font-semibold">
                  {project.estimatedTons?.toLocaleString() || "N/A"}
                </span>
              </div>
              <Separator />
              
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-muted-foreground">Released Tons</span>
                <span className="text-sm font-semibold">
                  {project.releasedTons?.toLocaleString() || "0"}
                </span>
              </div>
              <Separator />
              
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-muted-foreground">Due Date</span>
                <span className="text-sm font-semibold">
                  {project.dueDate ? formatDate(project.dueDate) : "Not set"}
                </span>
              </div>
              <Separator />
              
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-muted-foreground">Status</span>
                <div className="flex flex-col gap-1 items-end">
                  {project.detailingStatus && (
                    <Badge variant="outline" className="text-xs">
                      Detailing: {project.detailingStatus}
                    </Badge>
                  )}
                  {project.revisionStatus && (
                    <Badge variant="outline" className="text-xs">
                      Revision: {project.revisionStatus}
                    </Badge>
                  )}
                  {project.releaseStatus && (
                    <Badge variant="outline" className="text-xs">
                      Release: {project.releaseStatus}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Counts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Project Data Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Drawings Yet to Return</span>
                </div>
                <Badge variant="secondary">{counts.drawingsYetToReturn}</Badge>
              </div>
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Drawings Yet to Release</span>
                </div>
                <Badge variant="secondary">{counts.drawingsYetToRelease}</Badge>
              </div>
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Drawing Log Entries</span>
                </div>
                <Badge variant="secondary">{counts.drawingLogEntries}</Badge>
              </div>
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Invoices</span>
                </div>
                <Badge variant="secondary">{counts.invoices}</Badge>
              </div>
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Submissions</span>
                </div>
                <Badge variant="secondary">{counts.submissions}</Badge>
              </div>
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Change Orders</span>
                </div>
                <Badge variant="secondary">{counts.changeOrders}</Badge>
              </div>
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Material Lists</span>
                </div>
                <Badge variant="secondary">{counts.materialLists}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest updates and changes to this project</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'drawing_log' ? 'bg-blue-500' :
                        activity.type === 'submission' ? 'bg-green-500' :
                        'bg-orange-500'
                      }`} />
                      {index < recentActivity.length - 1 && (
                        <div className="w-px h-full bg-border mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(activity.date)}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs capitalize">
                          {activity.type.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

