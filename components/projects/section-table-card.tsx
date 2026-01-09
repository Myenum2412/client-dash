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
import { getGoogleDriveFileId } from "@/lib/utils/pdf-url";
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
  try {
    const blob = new Blob([text], { type: mime });
    if (typeof document === "undefined" || !document.body) return;
    
    const url = URL.createObjectURL(blob);
    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      // Safely remove the element - check if it still has a parent
      if (a.parentNode) {
        a.remove();
      }
    } catch {
      // Silently handle errors
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch {
    // Silently handle errors
  }
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
  hideTitle = false,
  data,
  columns,
  search,
  exportFilename = "export.csv",
  renderFilterMenu,
  headerClassName = "bg-emerald-50/70",
  pageSizes = [20, 40, 60, 80, 100, 200, 400, 500],
  onRowClick,
  onViewDetails,
  onEdit,
  isLoading,
  pagination,
  enablePdfExport = false,
  defaultColumnVisibility = {},
  headerAction,
  isExpanded = false,
  onToggle,
}: {
  title?: string;
  hideTitle?: boolean;
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  search?: { columnId: string; placeholder: string };
  exportFilename?: string;
  renderFilterMenu?: (table: ReturnType<typeof useReactTable<TData>>) => React.ReactNode;
  headerClassName?: string;
  pageSizes?: number[];
  onRowClick?: (row: TData) => void;
  onViewDetails?: (row: TData) => void;
  onEdit?: (row: TData) => void;
  isLoading?: boolean;
  pagination?: React.ReactNode;
  enablePdfExport?: boolean;
  defaultColumnVisibility?: VisibilityState;
  headerAction?: React.ReactNode;
  isExpanded?: boolean;
  onToggle?: () => void;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(defaultColumnVisibility);
  const [rowSelection, setRowSelection] = React.useState({});
  
  // Initialize global filter from URL search params
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const initialGlobalFilter = searchParams?.get("q") || "";
  const [globalFilter, setGlobalFilter] = React.useState(initialGlobalFilter);
  
  // Sync global filter with URL search params
  React.useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const urlQuery = params.get("q") || "";
      if (urlQuery !== globalFilter) {
        setGlobalFilter(urlQuery);
      }
    };
    
    // Update URL when globalFilter changes (debounced)
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (globalFilter.trim()) {
        params.set("q", globalFilter);
      } else {
        params.delete("q");
      }
      const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
      if (window.location.search !== `?${params.toString()}`) {
        window.history.replaceState({}, "", newUrl);
      }
    }, 300);
    
    window.addEventListener("popstate", handlePopState);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [globalFilter]);

  // Function to download PDF file
  const downloadPdf = React.useCallback((pdfPath: string, filename: string) => {
    try {
      // Handle Google Drive URLs - convert to download URL
      if (pdfPath.includes('drive.google.com')) {
        // Use our API route for downloading Google Drive files (more reliable)
        const fileId = getGoogleDriveFileId(pdfPath);
        if (fileId) {
          const downloadUrl = `/api/google-drive/download?fileId=${fileId}`;
          window.open(downloadUrl, '_blank');
          return;
        }
        // Fallback: open original URL in new tab
        window.open(pdfPath, '_blank');
        return;
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
      if (typeof document !== "undefined" && document.body) {
        document.body.appendChild(link);
        link.click();
        // Safely remove the link - check if it still has a parent
        if (link.parentNode) {
          document.body.removeChild(link);
        }
      }
    } catch (error) {
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

      // Search across all visible columns and nested values
      return Object.entries(row.original).some(([key, value]) => {
        if (value == null) return false;
        
        // Handle different value types
        if (typeof value === 'object' && value !== null) {
          // Search nested objects
          return Object.values(value).some(nestedValue => {
            if (nestedValue == null) return false;
            const stringValue = String(nestedValue).toLowerCase();
            return stringValue.includes(searchValue);
          });
        }
        
        // Handle primitive values
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
        pageSize: pagination ? 20 : 100000, // Show all data if no external pagination
      },
    },
    meta: {
      onViewDetails,
      onView: onViewDetails,
      onEdit,
    },
  });

  const total = table.getFilteredRowModel().rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  
  // Automatically show more rows when searching
  React.useEffect(() => {
    try {
      if (globalFilter && globalFilter.trim()) {
        // When searching, increase page size to show all results
        const filteredCount = table.getFilteredRowModel().rows.length;
        if (filteredCount > 0) {
          table.setPageSize(Math.max(filteredCount, 100));
          // Reset to first page when searching
          table.setPageIndex(0);
        }
      } else if (!pagination) {
        // Reset to showing all data when not searching
        table.setPageSize(100000);
      }
    } catch (error) {
      // Silently handle pagination errors
    }
  }, [globalFilter, table, pagination]);
  
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
      <CardHeader className={`border-b shrink-0 ${headerClassName} p-6`}>
        <div className="flex items-center justify-between gap-4 w-full">
          {/* Left Side - Title */}
          {!hideTitle && title && (
            <button
              onClick={onToggle}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onToggle?.();
                }
              }}
              className="flex items-center gap-2 shrink-0 group cursor-pointer hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md px-1 -ml-1"
              aria-expanded={isExpanded}
              aria-controls={`card-content-${(title || "").replace(/\s+/g, "-").toLowerCase()}`}
              aria-label={`${isExpanded ? "Collapse" : "Expand"} ${title || ""}`}
            >
              <CardTitle className="text-lg font-semibold text-emerald-900 group-hover:text-emerald-800 transition-colors whitespace-nowrap">
                {title}
              </CardTitle>
            </button>
          )}

          {/* Center - Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder={search?.placeholder || "Search across all columns..."}
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

          {/* Right Side - Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Filter by Date */}
            {headerAction && (
              <div className="shrink-0">
                {headerAction}
              </div>
            )}

            {/* Expand/Collapse Chevron */}
            <button
              onClick={onToggle}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onToggle?.();
                }
              }}
              className="p-1.5 hover:bg-emerald-100 rounded-md transition-all duration-200 shrink-0 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 group"
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Collapse card" : "Expand card"}
            >
              <ChevronDown
                className={`h-5 w-5 text-emerald-900 transition-transform duration-300 ease-in-out ${
                  isExpanded ? "rotate-180" : "rotate-0"
                } group-hover:scale-110`}
              />
            </button>

            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="shrink-0 relative">
                  <Download className="size-4 mr-2" />
                  <span className="hidden sm:inline">Export</span>
                  {Object.keys(rowSelection).length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center">
                      {Object.keys(rowSelection).length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground px-2 py-1">
                    All Records ({total})
                  </DropdownMenuLabel>
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
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent
          id={`card-content-${(title || "table").replace(/\s+/g, "-").toLowerCase()}`}
          className="overflow-hidden animate-in slide-in-from-top-2 fade-in duration-300"
          aria-hidden={!isExpanded}
        >
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
            <div className="mt-4 flex items-center justify-center text-sm text-muted-foreground">
              Showing all {total} records
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// Memoize component to prevent unnecessary re-renders
export const SectionTableCard = React.memo(SectionTableCardInner) as typeof SectionTableCardInner;

