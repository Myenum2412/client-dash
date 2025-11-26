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
import { ShoppingBag, Search, Plus, Minus, Save } from 'lucide-react';
import { format } from 'date-fns';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';

export default function StaffStationaryPage() {
  const { user } = useAuth();
  const branch = user?.branch || '';
  const [searchQuery, setSearchQuery] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  // Track pending quantity changes: Map<itemId, newQuantity>
  const [pendingChanges, setPendingChanges] = useState<Map<string, number>>(new Map());

  const {
    stationaryItems,
    isLoading,
    batchUpdateStationaryItems,
    isSaving,
  } = useStationaryItems(branch);

  // Filter items by search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return stationaryItems;
    const query = searchQuery.toLowerCase();
    return stationaryItems.filter(
      (item) =>
        item.item_name.toLowerCase().includes(query) ||
        item.added_by_staff_name.toLowerCase().includes(query)
    );
  }, [stationaryItems, searchQuery]);

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
        accessorKey: 'item_name',
        header: 'Item Name',
        cell: ({ row }) => (
          <div className="font-medium">{row.original.item_name}</div>
        ),
      },
      {
        accessorKey: 'quantity',
        header: 'Quantity',
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
        header: 'Last Added Date',
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {row.original.last_added_date
              ? format(new Date(row.original.last_added_date), 'MMM dd, yyyy')
              : 'N/A'}
          </div>
        ),
      },
      {
        accessorKey: 'added_by_staff_name',
        header: 'Added By',
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
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });


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
          <div className="flex items-center justify-between py-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            {hasPendingChanges && (
              <Button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="ml-4"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
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
                              : typeof header.column.columnDef.header === 'string'
                              ? header.column.columnDef.header
                              : null}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {typeof cell.column.columnDef.cell === 'function'
                              ? cell.column.columnDef.cell(cell.getContext())
                              : null}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-muted-foreground">
                  Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                    filteredItems.length
                  )}{' '}
                  of {filteredItems.length} items
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    Next
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


