"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SectionTableCard } from "@/components/projects/section-table-card";
import { rfiColumns, type RFIRow } from "./rfi-columns";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { fetchJson } from "@/lib/api/fetch-json";
import { queryKeys } from "@/lib/query/keys";
import type { PaginatedResponse } from "@/lib/api/pagination";
import { CreateRFIButton } from "./create-rfi-button";

export function RFITable() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data: rfiData, isLoading } = useQuery({
    queryKey: [...queryKeys.rfi(), page, pageSize],
    queryFn: () =>
      fetchJson<PaginatedResponse<RFIRow>>(
        `/api/rfi?page=${page}&pageSize=${pageSize}`
      ),
    staleTime: 60_000,
  });

  const rfis = rfiData?.data ?? [];
  const pagination = rfiData?.pagination;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CreateRFIButton />
      </div>
      <SectionTableCard
        title="RFI Submissions"
        data={rfis}
        columns={rfiColumns}
        exportFilename="rfi-submissions.csv"
        search={{ columnId: "workDescription", placeholder: "Search RFI..." }}
        isLoading={isLoading}
        pagination={
          pagination ? (
            <PaginationControls
              page={pagination.page}
              pageSize={pagination.pageSize}
              total={pagination.total}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setPage(1);
              }}
            />
          ) : undefined
        }
      />
    </div>
  );
}

