import type { Metadata } from "next";
import { TopHeader } from "@/components/app/top-header";
import { EnhancedOCRScanner } from "@/components/payers/enhanced-ocr-scanner";
import { QueryBoundary } from "@/components/query/query-boundary";

export const metadata: Metadata = {
  title: "Payers - Payers Management",
  description: "Manage payers and payment information",
};

export default async function PayersPage() {
  return (
    <>
      <TopHeader
        section="Payers"
        page="Payers Management"
        search={{ placeholder: "Search payers...", action: "/client/payers", name: "q" }}
      />
      <div className="min-h-0 flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <QueryBoundary
          loadingTitle="Loading scanner..."
          loadingSubtitle="Initializing drawing scanner"
        >
          <EnhancedOCRScanner />
        </QueryBoundary>
      </div>
    </>
  );
}
