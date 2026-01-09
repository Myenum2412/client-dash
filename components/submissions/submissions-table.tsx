"use client";

import { useState, useCallback, useMemo } from "react";
import { useSubmissions } from "@/lib/hooks/use-api";
import { SectionTableCard } from "@/components/projects/section-table-card";
import {
  upcomingSubmissionColumns,
  type SubmissionRow,
} from "@/components/projects/sections";
import { SubmissionDetailsDialog } from "@/components/submissions/submission-details-dialog";
import { SubmissionsDateFilter } from "@/components/submissions/submissions-date-filter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SubmissionsTable() {
  const [page] = useState(1);
  const [pageSize] = useState(100000); // Very large page size to show all data
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [submissionDetailsDialog, setSubmissionDetailsDialog] = useState<{
    open: boolean;
    submission: SubmissionRow | null;
  }>({
    open: false,
    submission: null,
  });

  const { data: submissionsData, isLoading } = useSubmissions({
    page,
    pageSize,
    staleTime: 60_000,
    meta: { errorMessage: "Failed to load submissions." },
  });

  const allSubmissions = submissionsData?.data ?? [];

  // Filter submissions by selected date
  const submissions = useMemo(() => {
    if (!selectedDate) {
      return allSubmissions;
    }

    // Compare dates by year, month, and day (ignore time)
    const selectedYear = selectedDate.getFullYear();
    const selectedMonth = selectedDate.getMonth();
    const selectedDay = selectedDate.getDate();

    return allSubmissions.filter((submission) => {
      if (!submission.submissionDate) return false;
      
      const submissionDate = new Date(submission.submissionDate);
      return (
        submissionDate.getFullYear() === selectedYear &&
        submissionDate.getMonth() === selectedMonth &&
        submissionDate.getDate() === selectedDay
      );
    });
  }, [allSubmissions, selectedDate]);

  // Handler for viewing submission details
  const handleViewSubmissionDetails = useCallback((submission: SubmissionRow) => {
    setSubmissionDetailsDialog({ open: true, submission });
  }, []);

  // Add state for expand/collapse
  const [isExpanded, setIsExpanded] = useState(true);

  // Handler for toggling expand/collapse
  const handleToggle = useCallback(() => {
    console.log('[SubmissionsTable] Toggle clicked, current state:', isExpanded);
    setIsExpanded(prev => {
      console.log('[SubmissionsTable] New state:', !prev);
      return !prev;
    });
  }, [isExpanded]);

  return (
    <>
    <SectionTableCard
      title="All Submissions"
      data={submissions}
      columns={upcomingSubmissionColumns}
      exportFilename="submissions.csv"
      search={{ columnId: "workDescription", placeholder: "Search submissions..." }}
      isLoading={isLoading}
        onRowClick={handleViewSubmissionDetails}
        onViewDetails={handleViewSubmissionDetails}
        isExpanded={isExpanded}
        onToggle={handleToggle}
        headerAction={
          <SubmissionsDateFilter
            date={selectedDate}
            onDateChange={setSelectedDate}
          />
        }
      />

      <SubmissionDetailsDialog
        open={submissionDetailsDialog.open}
        onOpenChange={(open) =>
          setSubmissionDetailsDialog((prev) => ({ ...prev, open }))
        }
        submission={submissionDetailsDialog.submission}
    />
    </>
  );
}

