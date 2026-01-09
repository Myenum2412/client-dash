"use client";

import { useState, useMemo, useCallback } from "react";
import { useBillingInvoices } from "@/lib/hooks/use-api";
import { SectionTableCard } from "@/components/projects/section-table-card";
import {
  billingInvoiceColumns,
  type BillingInvoiceRow,
} from "@/components/billing/invoice-columns";
import { InvoiceDetailsDialog } from "@/components/billing/invoice-details-dialog";

export function BillingInvoicesTable() {
  const [page] = useState(1);
  const [pageSize] = useState(10000); // Large page size to show all data
  const [invoiceDetailsDialog, setInvoiceDetailsDialog] = useState<{
    open: boolean;
    invoice: BillingInvoiceRow | null;
  }>({
    open: false,
    invoice: null,
  });

  const { data: invoicesData, isLoading } = useBillingInvoices({
    page,
    pageSize,
    staleTime: 60_000,
    meta: { errorMessage: "Failed to load invoices." },
  });

  const invoices = invoicesData?.data ?? [];
  const pagination = invoicesData?.pagination;

  // Create columns
  const columnsWithActions = billingInvoiceColumns();

  // Set default column visibility - only show specified columns by default
  const defaultColumnVisibility = useMemo(() => ({
    // Hidden by default
    projectNo: false,
    contractor: false,
    tonsBilledAmount: false,
    coPrice: false,
    coBilledAmount: false,
    // Visible by default (these have enableHiding: false or are explicitly shown)
    // invoiceNo, projectName, billedTonnage, unitPriceOrLumpSum, billedHoursCo, totalAmountBilled, actions
  }), []);

  // Handler for viewing invoice details
  const handleViewInvoiceDetails = useCallback((invoice: BillingInvoiceRow) => {
    setInvoiceDetailsDialog({ open: true, invoice });
  }, []);

  return (
    <>
      <SectionTableCard
        title="Invoice History"
        data={invoices}
        columns={columnsWithActions}
        exportFilename="billing-invoices.csv"
        isLoading={isLoading}
        defaultColumnVisibility={defaultColumnVisibility}
        onRowClick={handleViewInvoiceDetails} // Click anywhere on row to view details
        onViewDetails={handleViewInvoiceDetails} // Also keep for the View Details button
      />

      <InvoiceDetailsDialog
        open={invoiceDetailsDialog.open}
        onOpenChange={(open) =>
          setInvoiceDetailsDialog((prev) => ({ ...prev, open }))
        }
        invoice={invoiceDetailsDialog.invoice}
      />
    </>
  );
}


