"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Printer, Download, Eye } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ReleaseStatusBadge, type ReleaseStatus } from "@/components/projects/release-status-selector";
import {
  billingInvoiceColumns,
  type BillingInvoiceRow,
} from "@/components/billing/invoice-columns";
import { getSubmissionTypeColor } from "@/lib/utils/submission-colors";
import { formatDate } from "@/lib/utils/date-format";
import { exportChangeOrderToPDF, exportChangeOrderToCSV } from "@/lib/utils/change-order-export";
import { rfiColumns, type RFIRow } from "@/components/rfi/rfi-columns";

// Normalize various release status values to the two standard options
function normalizeReleaseStatus(status: string): ReleaseStatus {
  const normalized = status.toLowerCase().trim();
  
  // Check for "Partially Released" indicators
  if (
    normalized.includes("partially") ||
    normalized.includes("partial") ||
    (normalized.includes("released") && (
      normalized.includes("completely") ||
      normalized === "released" ||
      normalized.includes("released completely")
    ))
  ) {
    return "Partially Released";
  }
  
  // Everything else is "Yet to Be Released"
  return "Yet to Be Released";
}

export type DrawingsRow = {
  id: string;
  dwgNo: string;
  status: string;
  description: string;
  elements?: string;
  totalWeightTons: number;
  latestSubmittedDate: string;
  releaseStatus: string;
  pdfPath?: string;
};

export type DrawingLogRow = {
  id: string;
  dwgNo: string;
  event: string;
  date: string;
  by: string;
  notes: string;
};

export type InvoiceRow = BillingInvoiceRow & {
  pdfPath?: string;
};

export type SubmissionRow = {
  id: string;
  proultimaPm: string;
  jobNo: string;
  projectName: string;
  submissionType: string;
  workDescription: string;
  drawingNo: string;
  submissionDate: string;
  pdfPath?: string;
};

export type ChangeOrderRow = {
  id: string;
  changeOrderId: string;
  description: string;
  hours: number;
  date: string;
  status: string;
  pdfPath?: string;
};

// Re-export RFI types and columns
export type { RFIRow } from "@/components/rfi/rfi-columns";
export { rfiColumns } from "@/components/rfi/rfi-columns";

function statusPill(label: string) {
  const normalized = label.toLowerCase();
  const upper = label.toUpperCase().trim();
  
  // RELEASED COMPLETELY - Green (Success/Completed)
  if (normalized.includes("released completely")) {
    return (
      <Badge className="bg-emerald-600 text-white border-transparent dark:bg-emerald-700 dark:text-white">
        {label}
      </Badge>
    );
  }
  
  // APP status - Yellow (Approval)
  if (upper === "APP" || normalized.includes("approval")) {
    return (
      <Badge className="bg-yellow-100 text-yellow-800 border-transparent dark:bg-yellow-900 dark:text-yellow-200">
        {label}
      </Badge>
    );
  }
  
  // RR status - Orange (Review & Return)
  if (upper === "RR" || upper.includes("R&R") || normalized.includes("review") || normalized.includes("return")) {
    return (
      <Badge className="bg-orange-100 text-orange-800 border-transparent dark:bg-orange-900 dark:text-orange-200">
        {label}
      </Badge>
    );
  }
  
  // FFU status - Green (For Field Use)
  if (upper === "FFU" || normalized.includes("field use") || normalized.includes("for field")) {
    return (
      <Badge className="bg-green-100 text-green-800 border-transparent dark:bg-green-900 dark:text-green-200">
        {label}
      </Badge>
    );
  }
  
  // Other statuses
  if (normalized.includes("paid") || normalized.includes("success")) {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 border-transparent dark:bg-emerald-900 dark:text-emerald-200">
        {label}
      </Badge>
    );
  }
  if (normalized.includes("open") || normalized.includes("due") || normalized.includes("pending")) {
    return (
      <Badge className="bg-amber-100 text-amber-800 border-transparent dark:bg-amber-900 dark:text-amber-200">
        {label}
      </Badge>
    );
  }
  if (normalized.includes("reject") || normalized.includes("fail")) {
    return (
      <Badge className="bg-red-100 text-red-700 border-transparent dark:bg-red-900 dark:text-red-200">
        {label}
      </Badge>
    );
  }
  return (
    <Badge className="bg-zinc-100 text-zinc-700 border-transparent dark:bg-zinc-900 dark:text-zinc-200">
      {label}
    </Badge>
  );
}

export const drawingsColumns = (): ColumnDef<DrawingsRow>[] => {
  const baseColumns: ColumnDef<DrawingsRow>[] = [
  {
    accessorKey: "dwgNo",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="mx-auto"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        DWG #
        <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue("dwgNo")}</div>,
    meta: { align: "center" },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => statusPill(String(row.getValue("status"))),
    meta: { align: "center" },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => <div className="font-medium">{row.getValue("description")}</div>,
    meta: { align: "center" },
  },
  {
    accessorKey: "elements",
    header: "Elements",
    cell: ({ row }) => <div className="font-medium">{row.getValue("elements") || "-"}</div>,
    meta: { align: "center" },
    enableHiding: true,
  },
  {
    accessorKey: "totalWeightTons",
    header: "Total Weight (Tons)",
    cell: ({ row }) => (
      <div className="font-medium">
        {Number(row.getValue("totalWeightTons")).toFixed(1)}
      </div>
    ),
    meta: { align: "center" },
  },
  {
    accessorKey: "latestSubmittedDate",
    header: "Latest Submitted Date",
    cell: ({ row }) => <div>{formatDate(row.getValue("latestSubmittedDate"))}</div>,
    meta: { align: "center" },
  },
  {
    accessorKey: "releaseStatus",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="mx-auto"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Release Status
        <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const status = String(row.getValue("releaseStatus"));
      // Normalize existing statuses to new format
      const normalizedStatus = normalizeReleaseStatus(status);
      
      return (
        <div className="flex justify-center">
          <ReleaseStatusBadge status={normalizedStatus} />
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const status = String(row.getValue(id));
      const normalizedStatus = normalizeReleaseStatus(status);
      
      if (!value || value === "all") return true;
      return normalizedStatus === value;
    },
    sortingFn: (rowA, rowB, columnId) => {
      const statusA = normalizeReleaseStatus(String(rowA.getValue(columnId)));
      const statusB = normalizeReleaseStatus(String(rowB.getValue(columnId)));
      
      // Sort: "Partially Released" first, then "Yet to Be Released"
      if (statusA === statusB) return 0;
      if (statusA === "Partially Released") return -1;
      return 1;
    },
    meta: { 
      align: "center",
      filterVariant: "select",
      filterOptions: [
        { label: "All", value: "all" },
        { label: "Partially Released", value: "Partially Released" },
        { label: "Yet to Be Released", value: "Yet to Be Released" },
      ],
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }: { row: { original: DrawingsRow } }) => {
      const pdfPath = (row.original as any).pdfPath;
      
      const handlePrint = () => {
        if (pdfPath) {
          // Open PDF in new window for printing
          const printWindow = window.open(pdfPath, '_blank');
          if (printWindow) {
            printWindow.onload = () => {
              printWindow.print();
            };
          }
        } else {
          alert("No PDF file available for this drawing");
        }
      };

      const handleDownload = () => {
        if (!pdfPath) {
          alert("No PDF file available for this drawing");
          return;
        }
        
        try {
          if (typeof document === "undefined" || !document.body) return;
          
          // Create temporary link to download file
          const link = document.createElement('a');
          link.href = pdfPath;
          link.download = `${row.original.dwgNo}.pdf`;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          // Safely remove the link - check if it still has a parent
          if (link.parentNode) {
            document.body.removeChild(link);
          }
        } catch {
          // Silently handle errors
        }
      };

      return (
        <div className="flex items-center justify-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrint();
                  }}
                  className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                  disabled={!pdfPath}
                >
                  <Printer className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Print Drawing</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload();
                  }}
                  className="h-8 w-8 p-0 hover:bg-emerald-50 hover:text-emerald-600"
                  disabled={!pdfPath}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download Drawing</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    },
    meta: { align: "center" },
    enableSorting: false,
    enableHiding: false,
  },
  ];

  return baseColumns;
};

export const drawingLogColumns: ColumnDef<DrawingLogRow>[] = [
  { accessorKey: "dwgNo", header: "DWG #", cell: ({ row }) => <div className="font-medium">{row.getValue("dwgNo")}</div> },
  { accessorKey: "event", header: "Event" },
  { 
    accessorKey: "date", 
    header: "Date",
    cell: ({ row }) => <div>{formatDate(row.getValue("date"))}</div>,
  },
  { accessorKey: "by", header: "By" },
  { accessorKey: "notes", header: "Notes" },
];

export const invoiceColumns: ColumnDef<InvoiceRow>[] = [
  // Reuse the exact Billing page invoice table columns/heading layout
  // Note: billingInvoiceColumns is now a function that takes no arguments
  ...(billingInvoiceColumns() as ColumnDef<InvoiceRow>[]),
];

export const upcomingSubmissionColumns: ColumnDef<SubmissionRow>[] = [
  {
    accessorKey: "proultimaPm",
    header: "PROULTIMA PM",
    cell: ({ row }) => <div className="font-medium">{row.getValue("proultimaPm")}</div>,
    meta: { align: "center" },
  },
  {
    accessorKey: "jobNo",
    header: "JOB #",
    cell: ({ row }) => <div className="font-medium">{row.getValue("jobNo")}</div>,
    meta: { align: "center" },
  },
  {
    accessorKey: "projectName",
    header: "PROJECT NAME",
    cell: ({ row }) => <div className="font-medium">{row.getValue("projectName")}</div>,
    meta: { align: "center" },
  },
  {
    accessorKey: "submissionType",
    header: "SUBMISSION TYPE",
    cell: ({ row }) => {
      const type = row.getValue("submissionType") as string;
      return (
        <Badge className={getSubmissionTypeColor(type)}>
          {type}
        </Badge>
      );
    },
    meta: { align: "center" },
  },
  {
    accessorKey: "workDescription",
    header: "WORK DESCRIPTION",
    cell: ({ row }) => <div className="font-medium">{row.getValue("workDescription")}</div>,
    meta: { align: "center" },
  },
  {
    accessorKey: "drawingNo",
    header: "DRAWING #",
    cell: ({ row }) => <div className="font-medium">{row.getValue("drawingNo")}</div>,
    meta: { align: "center" },
  },
  {
    accessorKey: "submissionDate",
    header: "SUBMISSION DATE",
    cell: ({ row }) => <div className="font-medium">{formatDate(row.getValue("submissionDate"))}</div>,
    meta: { align: "center" },
  },
  {
    id: "actions",
    header: () => <div className="text-center font-semibold">Actions</div>,
    cell: ({ row, table }) => {
      const submission = row.original;
      const onViewDetails = (table.options.meta as any)?.onViewDetails;

      return (
        <div className="flex justify-center items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewDetails?.(submission)}
                  className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Details</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    },
    meta: { align: "center" },
    enableSorting: false,
    enableHiding: false,
  },
];

// Handler functions for change order actions
const handlePrintChangeOrder = async (changeOrder: ChangeOrderRow) => {
  try {
    await exportChangeOrderToPDF(changeOrder, '/image/logo.png');
  } catch (error) {
    alert('Failed to generate PDF. Please try again.');
  }
};

const handleDownloadChangeOrder = (changeOrder: ChangeOrderRow) => {
  try {
    exportChangeOrderToCSV(changeOrder);
  } catch (error) {
    alert('Failed to download CSV. Please try again.');
  }
};

export const changeOrderColumns: ColumnDef<ChangeOrderRow>[] = [
  {
    accessorKey: "changeOrderId",
    header: "CO #",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("changeOrderId")}</div>
    ),
    meta: { align: "center" },
  },
  { 
    accessorKey: "date", 
    header: "Submission Date",
    cell: ({ row }) => <div>{formatDate(row.getValue("date"))}</div>,
    meta: { align: "center" },
  },
  { 
    accessorKey: "description", 
    header: "Drawing No",
    cell: ({ row }) => <div className="font-medium">{row.getValue("description")}</div>,
    meta: { align: "center" },
  },
  {
    accessorKey: "hours",
    header: "Hours",
    cell: ({ row }) => (
      <div className="font-medium">{Number(row.getValue("hours")).toFixed(1)}</div>
    ),
    meta: { align: "center" },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => statusPill(String(row.getValue("status"))),
    meta: { align: "center" },
  },
  {
    id: "actions",
    header: "Action",
    cell: ({ row }) => (
      <div className="flex items-center justify-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
            size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrintChangeOrder(row.original);
                }}
                className="h-8 w-8"
              >
                <Printer className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Print Change Order</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
            size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadChangeOrder(row.original);
                }}
                className="h-8 w-8"
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download as CSV</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    ),
    meta: { align: "center" },
    enableSorting: false,
    enableHiding: false,
  },
];


