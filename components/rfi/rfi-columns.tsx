"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, FileText, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate as formatStandardDate } from "@/lib/utils/date-format";

export type RFIRow = {
  id: string;
  proultimaPm: string;
  jobNo: string;
  projectName: string;
  workDescription: string;
  drawingNo: string;
  submissionDate: string;
  status: string;
  evaluationDate: string | null;
  evaluatedBy: string | null;
  sheets: string | null;
  pdfPath: string | null;
};

function formatDate(dateString: string | null): string {
  if (!dateString) return "—";
  try {
    return formatStandardDate(dateString) || "—";
  } catch {
    return "—";
  }
}

function statusBadge(status: string) {
  const normalized = status.toLowerCase();
  
  if (normalized.includes("approved") || normalized.includes("closed")) {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 border-transparent">
        {status}
      </Badge>
    );
  }
  if (normalized.includes("pending") || normalized.includes("open")) {
    return (
      <Badge className="bg-amber-100 text-amber-800 border-transparent">
        {status}
      </Badge>
    );
  }
  if (normalized.includes("reject") || normalized.includes("cancelled")) {
    return (
      <Badge className="bg-red-100 text-red-700 border-transparent">
        {status}
      </Badge>
    );
  }
  if (normalized.includes("review") || normalized.includes("in progress")) {
    return (
      <Badge className="bg-blue-100 text-blue-700 border-transparent">
        {status}
      </Badge>
    );
  }
  return (
    <Badge className="bg-zinc-100 text-zinc-700 border-transparent">
      {status}
    </Badge>
  );
}

export const rfiColumns: ColumnDef<RFIRow>[] = [
  {
    accessorKey: "proultimaPm",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="mx-auto"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        PROULTIMA PM
        <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("proultimaPm")}</div>
    ),
    meta: { align: "center" },
  },
  {
    accessorKey: "jobNo",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="mx-auto"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        JOB #
        <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-semibold text-emerald-700">
        {row.getValue("jobNo")}
      </div>
    ),
    meta: { align: "center" },
  },
  {
    accessorKey: "projectName",
    header: "PROJECT NAME",
    cell: ({ row }) => (
      <div className="font-medium max-w-xs truncate" title={row.getValue("projectName")}>
        {row.getValue("projectName")}
      </div>
    ),
    meta: { align: "center" },
  },
  {
    accessorKey: "workDescription",
    header: "WORK DESCRIPTION",
    cell: ({ row }) => (
      <div className="max-w-md truncate" title={row.getValue("workDescription")}>
        {row.getValue("workDescription")}
      </div>
    ),
    meta: { align: "center" },
  },
  {
    accessorKey: "drawingNo",
    header: "DRAWING #",
    cell: ({ row }) => {
      const drawingNo = row.getValue("drawingNo") as string;
      return (
        <div className="font-medium flex items-center justify-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          {drawingNo || "—"}
        </div>
      );
    },
    meta: { align: "center" },
  },
  {
    accessorKey: "sheets",
    header: "SHEETS",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("sheets") || "—"}</div>
    ),
    meta: { align: "center" },
  },
  {
    accessorKey: "submissionDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="mx-auto"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        SUBMISSION DATE
        <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium">
        {formatDate(row.getValue("submissionDate"))}
      </div>
    ),
    meta: { align: "center" },
  },
  {
    accessorKey: "status",
    header: "STATUS",
    cell: ({ row }) => statusBadge(row.getValue("status")),
    meta: { align: "center" },
  },
  {
    accessorKey: "evaluationDate",
    header: "EVALUATION DATE",
    cell: ({ row }) => (
      <div className="font-medium">
        {formatDate(row.getValue("evaluationDate"))}
      </div>
    ),
    meta: { align: "center" },
  },
  {
    accessorKey: "evaluatedBy",
    header: "EVALUATED BY",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("evaluatedBy") || "—"}</div>
    ),
    meta: { align: "center" },
  },
  {
    id: "actions",
    header: "ACTIONS",
    cell: ({ row }) => {
      const pdfPath = row.original.pdfPath;
      
      if (!pdfPath) {
        return <div className="text-muted-foreground text-sm">No PDF</div>;
      }

      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Open PDF in new tab
            window.open(pdfPath, "_blank");
          }}
        >
          <Download className="h-4 w-4 mr-2" />
          View PDF
        </Button>
      );
    },
    meta: { align: "center" },
    enableSorting: false,
    enableHiding: false,
  },
];

