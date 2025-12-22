"use client";

import * as React from "react";
import {
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { Filter, Eye, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SectionTableCard } from "@/components/ui/section-table-card";

export interface UpcomingSubmission extends Record<string, unknown> {
  id: string;
  proultimaPm: string;
  jobNumber: string;
  projectName: string;
  submissionType: string;
  workDescription: string;
  drawingNumber: string;
  submissionDate: string;
}

const submissionTypeColors = {
  RFI: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  SUBMITTAL: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  APPROVAL: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  PENDING: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

export const upcomingSubmissionsColumns: ColumnDef<UpcomingSubmission>[] = [
  {
    id: "_search",
    accessorKey: "_search",
    header: "Search",
    enableHiding: false,
    enableSorting: false,
    filterFn: "includesString",
    cell: () => null,
    meta: {
      headerClassName: "sr-only",
      cellClassName: "sr-only",
    },
  },
  {
    accessorKey: "proultimaPm",
    header: ({ column }) => {
      const sortState = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-2"
        >
          <span>PROULTIMA PM</span>
          {sortState === "asc" && <span className="ml-2 text-xs">(A-Z)</span>}
          {sortState === "desc" && <span className="ml-2 text-xs">(Z-A)</span>}
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="font-medium py-2">{row.getValue("proultimaPm")}</div>
    ),
  },
  {
    accessorKey: "jobNumber",
    header: ({ column }) => {
      const sortState = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-2"
        >
          <span>JOB #</span>
          {sortState === "asc" && <span className="ml-2 text-xs">(A-Z)</span>}
          {sortState === "desc" && <span className="ml-2 text-xs">(Z-A)</span>}
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="font-medium py-2">{row.getValue("jobNumber")}</div>
    ),
  },
  {
    accessorKey: "projectName",
    header: ({ column }) => {
      const sortState = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-2"
        >
          <span>PROJECT NAME</span>
          {sortState === "asc" && <span className="ml-2 text-xs">(A-Z)</span>}
          {sortState === "desc" && <span className="ml-2 text-xs">(Z-A)</span>}
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-sm py-2 max-w-[200px] truncate" title={row.getValue("projectName") as string}>
        {row.getValue("projectName")}
      </div>
    ),
  },
  {
    accessorKey: "submissionType",
    header: ({ column }) => {
      const sortState = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-2"
        >
          <span>SUBMISSION TYPE</span>
          {sortState === "asc" && <span className="ml-2 text-xs">(A-Z)</span>}
          {sortState === "desc" && <span className="ml-2 text-xs">(Z-A)</span>}
        </Button>
      );
    },
    cell: ({ row }) => {
      const status = row.getValue("submissionType") as string;
      return (
        <div className="py-2">
          <Badge className={submissionTypeColors[status as keyof typeof submissionTypeColors] || ""}>
            {status}
          </Badge>
        </div>
      );
    },
    meta: {
      filterVariant: "select",
      filterOptions: [
        { label: "All Types", value: "all" },
        { label: "RFI", value: "RFI" },
        { label: "SUBMITTAL", value: "SUBMITTAL" },
        { label: "APPROVAL", value: "APPROVAL" },
        { label: "PENDING", value: "PENDING" },
      ],
    },
  },
  {
    accessorKey: "workDescription",
    header: ({ column }) => {
      const sortState = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-2"
        >
          <span>WORK DESCRIPTION</span>
          {sortState === "asc" && <span className="ml-2 text-xs">(A-Z)</span>}
          {sortState === "desc" && <span className="ml-2 text-xs">(Z-A)</span>}
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-sm max-w-[300px] truncate py-2" title={row.getValue("workDescription") as string}>
        {row.getValue("workDescription") || "—"}
      </div>
    ),
  },
  {
    accessorKey: "drawingNumber",
    header: ({ column }) => {
      const sortState = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-2"
        >
          <span>DRAWING #</span>
          {sortState === "asc" && <span className="ml-2 text-xs">(A-Z)</span>}
          {sortState === "desc" && <span className="ml-2 text-xs">(Z-A)</span>}
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="font-mono text-sm font-medium py-2">{row.getValue("drawingNumber")}</div>
    ),
  },
  {
    accessorKey: "submissionDate",
    header: ({ column }) => {
      const sortState = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-2"
        >
          <span>SUBMISSION DATE</span>
          {sortState === "asc" && <span className="ml-2 text-xs">(Oldest First)</span>}
          {sortState === "desc" && <span className="ml-2 text-xs">(Newest First)</span>}
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue("submissionDate") as string;
      return (
        <div className="text-sm py-2">
          {date && date !== "—" ? format(new Date(date), "yyyy-MM-dd") : "—"}
        </div>
      );
    },
  },
];

// Dummy data
const dummyUpcomingSubmissions: UpcomingSubmission[] = [
  {
    id: "1",
    proultimaPm: "PROULTIMA PM",
    jobNumber: "U2524",
    projectName: "Valley View Business Park Tilt Panels",
    submissionType: "RFI",
    workDescription: "Anchor bolt plan update",
    drawingNumber: "R-71",
    submissionDate: "2024-12-22",
  },
  {
    id: "2",
    proultimaPm: "PROULTIMA PM",
    jobNumber: "U2524",
    projectName: "Valley View Business Park Tilt Panels",
    submissionType: "SUBMITTAL",
    workDescription: "Embed layout confirmation",
    drawingNumber: "R-16",
    submissionDate: "2024-12-18",
  },
  {
    id: "3",
    proultimaPm: "PROULTIMA PM",
    jobNumber: "U2525",
    projectName: "Downtown Office Complex",
    submissionType: "APPROVAL",
    workDescription: "Foundation reinforcement review",
    drawingNumber: "F-101",
    submissionDate: "2024-12-20",
  },
  {
    id: "4",
    proultimaPm: "PROULTIMA PM",
    jobNumber: "U2526",
    projectName: "Residential Tower Project",
    submissionType: "RFI",
    workDescription: "Structural connection details",
    drawingNumber: "S-201",
    submissionDate: "2024-12-19",
  },
  {
    id: "5",
    proultimaPm: "PROULTIMA PM",
    jobNumber: "U2527",
    projectName: "Industrial Warehouse Facility",
    submissionType: "SUBMITTAL",
    workDescription: "Roof truss design approval",
    drawingNumber: "R-45",
    submissionDate: "2024-12-21",
  },
  {
    id: "6",
    proultimaPm: "PROULTIMA PM",
    jobNumber: "U2528",
    projectName: "Shopping Mall Expansion",
    submissionType: "PENDING",
    workDescription: "Column reinforcement details",
    drawingNumber: "C-301",
    submissionDate: "2024-12-17",
  },
];

interface UpcomingSubmissionsTableProps {
  submissions?: UpcomingSubmission[];
}

export function UpcomingSubmissionsTable({ submissions = dummyUpcomingSubmissions }: UpcomingSubmissionsTableProps) {
  const [typeFilter, setTypeFilter] = React.useState<string>("all");

  // Filter data based on type filter
  const filteredData = React.useMemo(() => {
    if (typeFilter === "all") return submissions;
    return submissions.filter((sub) => sub.submissionType === typeFilter);
  }, [submissions, typeFilter]);

  // Create a computed search column that combines all searchable fields
  const dataWithSearch = React.useMemo(() => {
    return filteredData.map((submission: UpcomingSubmission) => ({
      ...submission,
      _search: [
        submission.proultimaPm,
        submission.jobNumber,
        submission.projectName,
        submission.drawingNumber,
        submission.workDescription,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
    }));
  }, [filteredData]);

  // Custom filter menu for submission type
  const renderTypeFilterMenu = React.useCallback(
    (table: ReturnType<typeof import("@tanstack/react-table").useReactTable<UpcomingSubmission>>) => {
      return (
        <div className="w-[min(360px,calc(100vw-2rem))] p-3 max-w-[78vw]">
          <div className="flex items-center justify-between gap-3 pb-2">
            <div className="text-sm font-medium">Filters</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                table.resetColumnFilters();
                setTypeFilter("all");
              }}
            >
              Clear
            </Button>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Submission Type</div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="RFI">RFI</SelectItem>
                  <SelectItem value="SUBMITTAL">SUBMITTAL</SelectItem>
                  <SelectItem value="APPROVAL">APPROVAL</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      );
    },
    [typeFilter]
  );

  // Custom actions for the table header (e.g., Export Selected)
  const renderTableActions = React.useCallback(
    (table: ReturnType<typeof import("@tanstack/react-table").useReactTable<UpcomingSubmission>>) => {
      const selectedRows = table.getFilteredSelectedRowModel().rows;
      const handleExportSelected = () => {
        if (selectedRows.length === 0) return;

        const csvHeaders = ["PROULTIMA PM", "JOB #", "PROJECT NAME", "SUBMISSION TYPE", "WORK DESCRIPTION", "DRAWING #", "SUBMISSION DATE"];
        const csvRows = selectedRows.map((row) => [
          row.original.proultimaPm,
          row.original.jobNumber,
          row.original.projectName,
          row.original.submissionType,
          row.original.workDescription,
          row.original.drawingNumber,
          row.original.submissionDate,
        ]);

        const csvContent = [
          csvHeaders.join(","),
          ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `selected-upcoming-submissions-${format(new Date(), "yyyy-MM-dd")}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };

      return (
        <>
          {selectedRows.length > 0 && (
            <Button
              variant="outline"
              onClick={handleExportSelected}
              className="gap-2"
              title="Export selected submissions"
            >
              <Download className="h-4 w-4" />
              Export Selected ({selectedRows.length})
            </Button>
          )}
        </>
      );
    },
    []
  );

  return (
    <SectionTableCard
      title="Upcoming Submissions"
      data={dataWithSearch}
      columns={upcomingSubmissionsColumns}
      search={{
        columnId: "_search",
        placeholder: "Search by PROULTIMA PM, job number, project name, drawing, or description...",
      }}
      exportFilename={`upcoming-submissions-${format(new Date(), "yyyy-MM-dd")}.csv`}
      renderFilterMenu={renderTypeFilterMenu}
      renderActions={renderTableActions}
      headerClassName="bg-green-50 dark:bg-green-950/20"
      pageSizes={[10, 20, 30, 50, 100]}
    />
  );
}

