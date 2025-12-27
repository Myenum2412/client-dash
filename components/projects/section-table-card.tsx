"use client";

import * as React from "react";
import type {
  ColumnDef,
  ColumnFiltersState,
  Column,
  FilterFn,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Filter,
  Search,
  X,
  FileSpreadsheet,
  FileText,
  CheckSquare,
} from "@/lib/utils/icon-imports";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { exportTableData, type ExportFormat } from "@/lib/utils/export-utils";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";

type Align = "left" | "center" | "right";
type ColumnMeta = {
  align?: Align;
  headerClassName?: string;
  cellClassName?: string;
};

function alignClass(align: Align | undefined) {
  if (align === "center") return "text-center";
  if (align === "right") return "text-right";
  return "text-left";
}

function downloadText(filename: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    const needsQuotes = /[",\n]/.test(s);
    const escaped = s.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  };
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ];
  return lines.join("\n");
}

function columnLabel<TData>(col: Column<TData, unknown>) {
  const header = col.columnDef.header;
  if (typeof header === "string") return header;
  const accessorKey = (col.columnDef as { accessorKey?: unknown }).accessorKey;
  if (typeof accessorKey === "string") return accessorKey;
  return col.id;
}

function SectionTableCardInner<TData extends Record<string, unknown>, TValue>({
  title,
  data,
  columns,
  search,
  exportFilename = "export.csv",
  renderFilterMenu,
  headerClassName = "bg-emerald-50/70",
  pageSizes = [20, 40, 60, 80, 100, 200, 400, 500],
  onRowClick,
  onViewDetails,
  isLoading,
  pagination,
  enablePdfExport = false,
  defaultColumnVisibility = {},
}: {
  title: string;
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  search?: { columnId: string; placeholder: string };
  exportFilename?: string;
  renderFilterMenu?: (table: ReturnType<typeof useReactTable<TData>>) => React.ReactNode;
  headerClassName?: string;
  pageSizes?: number[];
  onRowClick?: (row: TData) => void;
  onViewDetails?: (row: TData) => void;
  isLoading?: boolean;
  pagination?: React.ReactNode;
  enablePdfExport?: boolean;
  defaultColumnVisibility?: VisibilityState;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(defaultColumnVisibility);
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  // Function to download PDF file
  const downloadPdf = React.useCallback((pdfPath: string, filename: string) => {
    try {
      // Handle Google Drive URLs - convert to download URL
      if (pdfPath.includes('drive.google.com')) {
        const fileIdMatch = pdfPath.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (fileIdMatch) {
          const fileId = fileIdMatch[1];
          // Use Google Drive's direct download URL
          const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
          
          // Open in new tab for Google Drive (they handle the download)
          window.open(downloadUrl, '_blank');
          return;
        }
      }

      // For relative paths, construct full URL
      let url = pdfPath;
      if (!pdfPath.startsWith('http')) {
        // Relative path - make it absolute
        url = pdfPath.startsWith('/') 
          ? `${window.location.origin}${pdfPath}`
          : `${window.location.origin}/${pdfPath}`;
      }

      // Create a temporary link element to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'document.pdf';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Append to body, click, then remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      // Final fallback: open in new tab
      let fallbackUrl = pdfPath;
      if (!pdfPath.startsWith('http') && !pdfPath.startsWith('/')) {
        fallbackUrl = '/' + pdfPath;
      }
      window.open(fallbackUrl, '_blank');
    }
  }, []);

  // Handle checkbox change - export PDF if enabled
  const handleCheckboxChange = React.useCallback((row: TData, checked: boolean) => {
    if (checked && enablePdfExport) {
      const pdfPath = (row as any).pdfPath;
      const dwgNo = (row as any).dwgNo || 'document';
      
      if (pdfPath) {
        const filename = `${dwgNo}.pdf`;
        downloadPdf(pdfPath, filename);
      }
    }
  }, [enablePdfExport, downloadPdf]);

  const stringIncludes: FilterFn<TData> = React.useCallback(
    (row, columnId, filterValue) => {
      const needle = String(filterValue ?? "").toLowerCase().trim();
      if (!needle) return true;
      const raw = row.getValue(columnId);
      const hay = raw == null ? "" : String(raw).toLowerCase();
      return hay.includes(needle);
    },
    []
  );

  const selectionColumn = React.useMemo<ColumnDef<TData>>(
    () => ({
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => {
            table.toggleAllPageRowsSelected(!!value);
            // If PDF export is enabled and selecting all, export all PDFs
            if (value && enablePdfExport) {
              const selectedRows = table.getFilteredRowModel().rows;
              selectedRows.forEach((r) => {
                const pdfPath = (r.original as any).pdfPath;
                const dwgNo = (r.original as any).dwgNo || 'document';
                if (pdfPath) {
                  downloadPdf(pdfPath, `${dwgNo}.pdf`);
                }
              });
            }
          }}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => {
            row.toggleSelected(!!value);
            handleCheckboxChange(row.original, !!value);
          }}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      meta: { align: "center", headerClassName: "w-10", cellClassName: "w-10" },
    }),
    [enablePdfExport, downloadPdf, handleCheckboxChange]
  );

  const columnsWithSelection = React.useMemo(
    () => [selectionColumn, ...(columns as ColumnDef<TData, unknown>[])],
    [selectionColumn, columns]
  );

  // Global filter function that searches across all columns
  const globalFilterFn: FilterFn<TData> = React.useCallback(
    (row, columnId, filterValue) => {
      const searchValue = String(filterValue ?? "").toLowerCase().trim();
      if (!searchValue) return true;

      // Search across all visible columns
      return Object.entries(row.original).some(([key, value]) => {
        if (value == null) return false;
        const stringValue = String(value).toLowerCase();
        return stringValue.includes(searchValue);
      });
    },
    []
  );

  const table = useReactTable({
    data,
    columns: columnsWithSelection,
    state: { sorting, columnFilters, columnVisibility, rowSelection, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: globalFilterFn,
    enableRowSelection: true,
    defaultColumn: { filterFn: stringIncludes },
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
    meta: {
      onViewDetails,
    },
  });

  const total = table.getFilteredRowModel().rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  
  const paginationInfo = React.useMemo(() => {
    const start = total === 0 ? 0 : pageIndex * pageSize + 1;
    const end = total === 0 ? 0 : Math.min(start + pageSize - 1, total);
    return { start, end };
  }, [total, pageIndex, pageSize]);
  
  const handleExport = React.useCallback(async (format: ExportFormat, selectedOnly: boolean = false) => {
    const rows = selectedOnly
      ? table.getSelectedRowModel().rows.map((r) => r.original)
      : table.getFilteredRowModel().rows.map((r) => r.original);

    if (rows.length === 0) {
      alert(selectedOnly ? "No rows selected" : "No data to export");
      return;
    }

    // Remove internal columns (select, actions)
    const cleanedRows = rows.map((row) => {
      const { select, actions, ...rest } = row as any;
      return rest;
    });

    // Get base filename without extension
    const baseFilename = exportFilename.replace(/\.[^/.]+$/, "");
    const selectionSuffix = selectedOnly ? "_selected" : "_all";

    await exportTableData(cleanedRows, {
      filename: `${baseFilename}${selectionSuffix}`,
      format,
      title,
      projectName: undefined, // Can be passed as prop if needed
    });
  }, [table, exportFilename, title]);

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-4 w-full">
          {/* Title */}
          <CardTitle className="text-base shrink-0">{title}</CardTitle>
          
          {/* Centered Search Box */}
          <div className="relative flex-1 max-w-sm mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search across all columns..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-9 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <CardAction className="flex items-center gap-2 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="shrink-0">
                  <Download className="size-4 sm:mr-2" />
                  <span className="hidden sm:inline">Export</span>
                  <ChevronDown className="ml-1 size-4 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground px-2 py-1">
                    All Records ({total})
                  </DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleExport("csv", false)}>
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Export All as CSV</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("excel", false)}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    <span>Export All as Excel</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("pdf", false)}>
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Export All as PDF</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                {Object.keys(rowSelection).length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="text-xs font-normal text-muted-foreground px-2 py-1">
                        Selected Records ({Object.keys(rowSelection).length})
                      </DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleExport("csv", true)}>
                        <CheckSquare className="mr-2 h-4 w-4" />
                        <span>Export Selected as CSV</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport("excel", true)}>
                        <CheckSquare className="mr-2 h-4 w-4" />
                        <span>Export Selected as Excel</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport("pdf", true)}>
                        <CheckSquare className="mr-2 h-4 w-4" />
                        <span>Export Selected as PDF</span>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="shrink-0">
                  <Filter className="size-4 sm:mr-2" />
                  <span className="hidden sm:inline">Filter</span>
                <ChevronDown className="ml-1 size-4 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm font-semibold">Show Columns</div>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-auto">
                {table
                  .getAllColumns()
                  .filter((column) => {
                    // Always show select and actions columns
                    if (column.id === "select" || column.id === "actions") {
                      return false;
                    }
                    return column.getCanHide();
                  })
                  .map((column) => {
                    const label = columnLabel(column);
                    const isVisible = column.getIsVisible();
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={isVisible}
                        onCheckedChange={(value) => {
                          if (value) {
                            // If selecting a column, hide all others first, then show selected
                            const allColumns = table.getAllColumns().filter(
                              (c) => c.id !== "select" && c.id !== "actions" && c.getCanHide()
                            );
                            // Hide all columns first
                            allColumns.forEach((c) => {
                              c.toggleVisibility(c.id === column.id);
                            });
                          } else {
                            // If unchecking, just hide this column
                            column.toggleVisibility(false);
                          }
                        }}
                      >
                        {label}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </div>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    // Show all columns
                    table.getAllColumns().forEach((column) => {
                      if (column.getCanHide()) {
                        column.toggleVisibility(true);
                      }
                    });
                  }}
                >
                  Show All
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          </CardAction>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className={headerClassName}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "px-4 py-4",
                        alignClass((header.column.columnDef.meta as ColumnMeta)?.align),
                        (header.column.columnDef.meta as ColumnMeta)?.headerClassName
                      )}
                    >
                      {header.isPlaceholder ? null : (
                        <div className="w-full">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </div>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={() => onRowClick?.(row.original)}
                    className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          "px-4 py-4",
                          alignClass((cell.column.columnDef.meta as ColumnMeta)?.align),
                          (cell.column.columnDef.meta as ColumnMeta)?.cellClassName
                        )}
                      >
                        <div className="w-full">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columnsWithSelection.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {pagination ? (
          <div className="mt-4">{pagination}</div>
        ) : (
          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">Rows per page</div>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => table.setPageSize(Number(v))}
              >
                <SelectTrigger className="w-20" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizes.map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div>
                {paginationInfo.start}-{paginationInfo.end} of {total} records
              </div>
              <div>
                Page {total === 0 ? 0 : pageIndex + 1} of {table.getPageCount() || 1}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronsLeft className="size-4" />
                  <span className="sr-only">First page</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft className="size-4" />
                  <span className="sr-only">Previous page</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronRight className="size-4" />
                  <span className="sr-only">Next page</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronsRight className="size-4" />
                  <span className="sr-only">Last page</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Memoize component to prevent unnecessary re-renders
export const SectionTableCard = React.memo(SectionTableCardInner) as typeof SectionTableCardInner;

