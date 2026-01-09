import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parsePaginationParams, createPaginatedResponse } from "@/lib/api/pagination";
import { getInvoices, getProjects } from "@/lib/supabase/queries";
import { demoInvoices } from "@/public/assets";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page = 1, pageSize = 20 } = parsePaginationParams(searchParams);

    // Always use demo data for now (for testing/demo purposes)
    console.log("Using demo invoice data");
    const invoiceRows = demoInvoices.map((inv, index) => ({
      id: `demo-invoice-${index + 1}`,
      invoiceNo: inv.invoiceNo,
      projectNo: inv.jobNumber,
      contractor: "Demo Contractor",
      projectName: `Project ${inv.jobNumber}`,
      billedTonnage: inv.billedTonnage,
      unitPriceOrLumpSum: inv.unitPriceOrLumpSum,
      tonsBilledAmount: inv.tonsBilledAmount,
      billedHoursCo: inv.billedHoursCo,
      coPrice: inv.coPrice,
      coBilledAmount: inv.coBilledAmount,
      totalAmountBilled: inv.totalAmountBilled,
      status: "Paid",
    }));

    // Return paginated response
    const paginated = createPaginatedResponse(invoiceRows, page, pageSize);
    return NextResponse.json(paginated);
  } catch (error) {
    console.error("Error in invoices API:", error);
    
    // Return demo data on error as well
    const demoRows = demoInvoices.map((inv, index) => ({
      id: `demo-invoice-${index + 1}`,
      invoiceNo: inv.invoiceNo,
      projectNo: inv.jobNumber,
      contractor: "Demo Contractor",
      projectName: `Project ${inv.jobNumber}`,
      billedTonnage: inv.billedTonnage,
      unitPriceOrLumpSum: inv.unitPriceOrLumpSum,
      tonsBilledAmount: inv.tonsBilledAmount,
      billedHoursCo: inv.billedHoursCo,
      coPrice: inv.coPrice,
      coBilledAmount: inv.coBilledAmount,
      totalAmountBilled: inv.totalAmountBilled,
      status: "Paid",
    }));
    
    const { searchParams } = new URL(request.url);
    const { page = 1, pageSize = 20 } = parsePaginationParams(searchParams);
    const paginated = createPaginatedResponse(demoRows, page, pageSize);
    return NextResponse.json(paginated);
  }
}


