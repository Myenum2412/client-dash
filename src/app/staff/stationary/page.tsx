'use client';

import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useStationaryItems, type StationaryItem } from '@/hooks/use-stationary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ShoppingBag, Search, Plus, Minus, Save, ArrowUpDown, ArrowUp, ArrowDown, Download } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
  type ColumnFiltersState,
  type PaginationState,
} from '@tanstack/react-table';

export default function StaffStationaryPage() {
  const { user } = useAuth();
  const branch = user?.branch || '';
  const [searchQuery, setSearchQuery] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  // Track pending quantity changes: Map<itemId, newQuantity>
  const [pendingChanges, setPendingChanges] = useState<Map<string, number>>(new Map());
  
  // Filter states
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [quantityFilter, setQuantityFilter] = useState<string>('all');
  const [staffFilter, setStaffFilter] = useState<string>('all');

  const {
    stationaryItems,
    isLoading,
    batchUpdateStationaryItems,
    isSaving,
  } = useStationaryItems(branch);

  // Get unique staff names for filter
  const uniqueStaffNames = useMemo(() => {
    const names = new Set(stationaryItems.map(item => item.added_by_staff_name).filter(Boolean));
    return Array.from(names).sort();
  }, [stationaryItems]);

  // Apply filters
  const filteredItems = useMemo(() => {
    let filtered = [...stationaryItems];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.item_name.toLowerCase().includes(query) ||
          item.added_by_staff_name.toLowerCase().includes(query)
      );
    }

    // Unit filter
    if (unitFilter !== 'all') {
      filtered = filtered.filter(item => item.unit === unitFilter);
    }

    // Quantity filter
    if (quantityFilter !== 'all') {
      if (quantityFilter === 'low') {
        filtered = filtered.filter(item => item.quantity <= 1);
      } else if (quantityFilter === 'medium') {
        filtered = filtered.filter(item => item.quantity > 1 && item.quantity <= 10);
      } else if (quantityFilter === 'high') {
        filtered = filtered.filter(item => item.quantity > 10);
      }
    }

    // Staff filter
    if (staffFilter !== 'all') {
      filtered = filtered.filter(item => item.added_by_staff_name === staffFilter);
    }

    return filtered;
  }, [stationaryItems, searchQuery, unitFilter, quantityFilter, staffFilter]);

  // Get current quantity for an item (pending change or original)
  const getCurrentQuantity = useCallback((item: StationaryItem): number => {
    return pendingChanges.get(item.id) ?? item.quantity;
  }, [pendingChanges]);

  // Handle quantity increment
  const handleIncrement = useCallback((item: StationaryItem) => {
    setPendingChanges((prev) => {
      const newMap = new Map(prev);
      const currentQty = newMap.get(item.id) ?? item.quantity;
      newMap.set(item.id, currentQty + 1);
      return newMap;
    });
  }, []);

  // Handle quantity decrement
  const handleDecrement = useCallback((item: StationaryItem) => {
    setPendingChanges((prev) => {
      const newMap = new Map(prev);
      const currentQty = newMap.get(item.id) ?? item.quantity;
      if (currentQty > 0) {
        newMap.set(item.id, currentQty - 1);
        return newMap;
      }
      return prev;
    });
  }, []);

  // Handle save changes
  const handleSaveChanges = () => {
    if (pendingChanges.size === 0) return;

    const updates = Array.from(pendingChanges.entries()).map(([itemId, newQuantity]) => ({
      itemId,
      newQuantity,
    }));

    batchUpdateStationaryItems(
      { updates, staffName: user?.name || '' },
      {
        onSuccess: () => {
          setPendingChanges(new Map()); // Clear pending changes after successful save
        },
      }
    );
  };

  // Check if there are pending changes
  const hasPendingChanges = pendingChanges.size > 0;

  // Define columns
  const columns: ColumnDef<StationaryItem>[] = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && 'indeterminate')
              }
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label="Select all"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'item_name',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2 lg:px-3"
            >
              Item Name
              {column.getIsSorted() === 'asc' ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === 'desc' ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="font-medium">{row.original.item_name}</div>
        ),
      },
      {
        accessorKey: 'quantity',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2 lg:px-3"
            >
              Quantity
              {column.getIsSorted() === 'asc' ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === 'desc' ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const item = row.original;
          const currentQty = getCurrentQuantity(item);
          const hasChange = pendingChanges.has(item.id);
          const originalQty = item.quantity;

          return (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 border rounded-md">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-muted"
                  onClick={() => handleDecrement(item)}
                  disabled={currentQty === 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="min-w-[3rem] text-center font-medium px-2">
                  {currentQty}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-muted"
                  onClick={() => handleIncrement(item)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Badge variant="outline" className="text-xs">
                {item.unit}
              </Badge>
              {hasChange && (
                <span className="text-xs text-muted-foreground">
                  ({originalQty} → {currentQty})
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'last_added_date',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2 lg:px-3"
            >
              Last Added Date
              {column.getIsSorted() === 'asc' ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === 'desc' ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {row.original.last_added_date
              ? format(new Date(row.original.last_added_date), 'MMM dd, yyyy')
              : 'N/A'}
          </div>
        ),
        sortingFn: (rowA, rowB) => {
          const dateA = rowA.original.last_added_date ? new Date(rowA.original.last_added_date).getTime() : 0;
          const dateB = rowB.original.last_added_date ? new Date(rowB.original.last_added_date).getTime() : 0;
          return dateA - dateB;
        },
      },
      {
        accessorKey: 'added_by_staff_name',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2 lg:px-3"
            >
              Added By
              {column.getIsSorted() === 'asc' ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === 'desc' ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="text-sm">{row.original.added_by_staff_name || 'N/A'}</div>
        ),
      },
    ],
    [getCurrentQuantity, handleIncrement, handleDecrement, pendingChanges]
  );

  // Initialize TanStack Table
  const table = useReactTable({
    data: filteredItems,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getRowId: (row) => row.id,
    state: {
      sorting,
      rowSelection,
      columnFilters,
      pagination,
    },
  });

  // Get selected rows
  const selectedRows = useMemo(() => {
    return table.getFilteredSelectedRowModel().rows.map(row => row.original);
  }, [table, rowSelection]);

  // Handle CSV download
  const handleDownloadCSV = useCallback(() => {
    const selected = selectedRows.length > 0 ? selectedRows : filteredItems;
    
    if (selected.length === 0) {
      toast.error('No items to download');
      return;
    }

    const csvContent = [
      ['Item Name', 'Quantity', 'Unit', 'Last Added Date', 'Added By'],
      ...selected.map(item => [
        item.item_name,
        String(getCurrentQuantity(item)),
        item.unit,
        item.last_added_date ? format(new Date(item.last_added_date), 'MMM dd, yyyy') : 'N/A',
        item.added_by_staff_name || 'N/A',
      ])
    ].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stationary-items-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success(`Exported ${selected.length} item(s) successfully`);
  }, [selectedRows, filteredItems, getCurrentQuantity]);


  if (!branch) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Branch information not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Stationary</h1>
        <p className="text-muted-foreground">
          View and purchase approved stationary items for your branch
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Stationary Items</CardTitle>
          <CardDescription>
            Browse and purchase stationary items. Items with quantity 1 or less will trigger low stock alerts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Action Bar */}
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                {hasPendingChanges && (
                  <Button
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                )}
                
                {(Object.keys(rowSelection).length > 0 || filteredItems.length > 0) && (
                  <Button
                    variant="outline"
                    onClick={handleDownloadCSV}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {Object.keys(rowSelection).length > 0
                      ? `Download Selected (${Object.keys(rowSelection).length})`
                      : 'Download All'}
                  </Button>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Select value={unitFilter} onValueChange={setUnitFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Filter by Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Units</SelectItem>
                  <SelectItem value="Box">Box</SelectItem>
                  <SelectItem value="Pcs">Pcs</SelectItem>
                  <SelectItem value="Rim">Rim</SelectItem>
                  <SelectItem value="Count">Count</SelectItem>
                </SelectContent>
              </Select>

              <Select value={quantityFilter} onValueChange={setQuantityFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Filter by Quantity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Quantities</SelectItem>
                  <SelectItem value="low">Low (≤1)</SelectItem>
                  <SelectItem value="medium">Medium (2-10)</SelectItem>
                  <SelectItem value="high">High (&gt;10)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={staffFilter} onValueChange={setStaffFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Filter by Staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  {uniqueStaffNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(unitFilter !== 'all' || quantityFilter !== 'all' || staffFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setUnitFilter('all');
                    setQuantityFilter('all');
                    setStaffFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No stationary items found</h3>
              <p className="text-muted-foreground text-sm">
                {searchQuery
                  ? 'No items match your search criteria.'
                  : 'No approved stationary items available for your branch.'}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-24 text-center">
                          No results found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && 'selected'}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
                    {Math.min(
                      (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                      table.getFilteredRowModel().rows.length
                    )}{' '}
                    of {table.getFilteredRowModel().rows.length} item(s)
                    {Object.keys(rowSelection).length > 0 && (
                      <span className="ml-2 text-primary">
                        ({Object.keys(rowSelection).length} selected)
                      </span>
                    )}
                  </div>
                  
                  <Select
                    value={String(table.getState().pagination.pageSize)}
                    onValueChange={(value) => {
                      table.setPageSize(Number(value));
                    }}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue placeholder={table.getState().pagination.pageSize} />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {[10, 25, 50, 100].map((pageSize) => (
                        <SelectItem key={pageSize} value={String(pageSize)}>
                          {pageSize}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    Previous
                  </Button>
                  <div className="text-sm text-muted-foreground px-2">
                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    Next
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                  >
                    Last
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


