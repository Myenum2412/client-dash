"use client";

import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Spreadsheet from "react-spreadsheet";
import { motion } from "motion/react";

interface PanelRow {
  element: string;
  dwgNo: string;
  description: string;
  dos: string;
  weight: number;
}

interface EvaluationLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mock data matching the image structure
const panelData: PanelRow[] = [
  {
    element: "Wall Panel Type A",
    dwgNo: "R-71",
    description: "AREA-H STAIR-H2 SOG",
    dos: "2024-05-13",
    weight: 118214.11,
  },
  {
    element: "Wall Panel Type B",
    dwgNo: "R-45",
    description: "FOUNDATION BEAMS F9-F16",
    dos: "2024-04-20",
    weight: 44360.0,
  },
  {
    element: "Wall Panel Type C",
    dwgNo: "R-12",
    description: "NORTH AREA WALL PANEL",
    dos: "2025-03-01",
    weight: 82020.0,
  },
  {
    element: "Wall Panel Type D",
    dwgNo: "R-28",
    description: "LEVEL-2 BEAM CONNECTIONS",
    dos: "2025-03-14",
    weight: 145678.0,
  },
  {
    element: "Wall Panel Type E",
    dwgNo: "S-03",
    description: "STAIR TOWER BRACING",
    dos: "2024-12-03",
    weight: 24900.0,
  },
  {
    element: "Wall Panel Type F",
    dwgNo: "S-15",
    description: "ROOF TRUSS CONNECTIONS",
    dos: "2024-12-10",
    weight: 31560.0,
  },
  {
    element: "Wall Panel Type G",
    dwgNo: "S-08",
    description: "MEZZANINE FLOOR SYSTEM",
    dos: "2025-03-18",
    weight: 62500.0,
  },
  {
    element: "Wall Panel Type H",
    dwgNo: "R-16",
    description: "FOUNDATION PANELS F1 TO F8",
    dos: "2024-12-01",
    weight: 49280.0,
  },
  {
    element: "Wall Panel Type I",
    dwgNo: "R-22",
    description: "WALL PANELS EAST SIDE",
    dos: "2024-11-15",
    weight: 36640.0,
  },
  {
    element: "Wall Panel Type J",
    dwgNo: "R-35",
    description: "WEST WALL PANELS",
    dos: "2025-02-20",
    weight: 57820.0,
  },
];

// Custom DataViewer to style cells based on their content and position
function createCustomDataViewer(dataLength: number) {
  return function CustomDataViewer({ cell, row, column, ...props }: any) {
    const value = cell?.value || "";
    const rowIndex = row;
    const colIndex = column;
    
    // Header rows (rows 0 and 1)
    const isHeader = rowIndex < 2;
    // First column (PANELS column)
    const isFirstColumn = colIndex === 0;
    // PANELS cells
    const isPanels = value === "PANELS";
    // Total row (last row)
    const isTotalRow = rowIndex === dataLength - 1;

    return (
      <div
        {...props}
        className={`
          w-full h-full flex items-center px-1 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm
          ${isHeader ? "bg-green-100 dark:bg-green-900/30 font-semibold text-green-800 dark:text-green-200" : ""}
          ${isFirstColumn && !isHeader && isPanels ? "bg-yellow-100 dark:bg-yellow-900/30 font-semibold text-center" : ""}
          ${isFirstColumn && !isHeader && !isPanels ? "bg-yellow-50 dark:bg-yellow-900/20" : ""}
          ${isTotalRow ? "bg-gray-100 dark:bg-gray-800 font-bold" : ""}
        `}
      >
        {String(value)}
      </div>
    );
  };
}

export function EvaluationLogDialog({
  open,
  onOpenChange,
}: EvaluationLogDialogProps) {
  // Calculate total weight
  const totalWeight = useMemo(() => {
    return panelData.reduce((sum, row) => sum + row.weight, 0);
  }, []);

  // Convert panel data to spreadsheet format
  const spreadsheetData = useMemo(() => {
    const data: Array<Array<{ value: string | number }>> = [];

    // First header row (with Rev 0)
    data.push([
      { value: "Elements" },
      { value: "Elements" },
      { value: "Dwg No." },
      { value: "Description" },
      { value: "Rev 0" },
      { value: "" },
    ]);

    // Second header row
    data.push([
      { value: "Elements" },
      { value: "Elements" },
      { value: "Dwg No." },
      { value: "Description" },
      { value: "DOS" },
      { value: "Weight (Lbs.)" },
    ]);

    // Data rows with PANELS grouping
    panelData.forEach((row, index) => {
      // Add PANELS label for first row of each group (rows 0 and 5)
      const panelsLabel = index === 0 || index === 5 ? "PANELS" : "";
      
      data.push([
        { value: panelsLabel },
        { value: row.element },
        { value: row.dwgNo },
        { value: row.description },
        { value: row.dos },
        { value: row.weight.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
      ]);
    });

    // Total row
    data.push([
      { value: "" },
      { value: "TOTAL (lbs.)" },
      { value: "" },
      { value: "" },
      { value: "" },
      { value: totalWeight.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
    ]);

    return data;
  }, [totalWeight]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-screen-xl lg:min-w-[80vw] sm:max-w-[95vw] max-h-[70vh] sm:max-h-[98vh] max-sm:max-h-[100vh] max-sm:max-w-[100vw] max-sm:rounded-none max-sm:m-0 p-0 flex flex-col overflow-y-auto scroll-none sm:m-4 max-sm:overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col h-full"
        >
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 shrink-0 border-b">
            <DialogTitle className="text-xl sm:text-2xl font-semibold">
              Evaluation Log
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 px-2 sm:px-6 py-2 sm:py-4 overflow-y-auto">
            <div className="w-full overflow-x-auto -mx-2 sm:mx-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="min-w-full"
              >
                <div className="evaluation-spreadsheet-wrapper overflow-y-auto">
                  <style jsx global>{`
                    .evaluation-spreadsheet-wrapper {
                      width: 100%;
                      overflow-x: auto;
                    }
                    .evaluation-spreadsheet-wrapper .react-spreadsheet {
                      width: 100%;
                      min-width: 800px;
                    }
                    .evaluation-spreadsheet-wrapper table {
                      width: 100%;
                      border-collapse: collapse;
                      font-size: 14px;
                      min-width: 800px;
                    }
                    .evaluation-spreadsheet-wrapper td,
                    .evaluation-spreadsheet-wrapper th {
                      border: 1px solid #e5e7eb;
                      padding: 8px 12px;
                      text-align: left;
                      white-space: nowrap;
                    }
                    .evaluation-spreadsheet-wrapper th {
                      background-color: #d1fae5 !important;
                      font-weight: 600;
                      color: #065f46;
                      position: sticky;
                      top: 0;
                      z-index: 10;
                    }
                    .evaluation-spreadsheet-wrapper .cell-panels {
                      background-color: #fef3c7;
                      font-weight: 600;
                      text-align: center;
                      vertical-align: middle;
                    }
                    .evaluation-spreadsheet-wrapper .cell-total {
                      font-weight: 700;
                      background-color: #f3f4f6;
                    }
                    .evaluation-spreadsheet-wrapper input {
                      width: 100%;
                      border: none;
                      background: transparent;
                      outline: none;
                      font-size: 14px;
                    }
                    .evaluation-spreadsheet-wrapper tbody tr:hover {
                      background-color: #f9fafb;
                    }
                    @media (max-width: 768px) {
                      .evaluation-spreadsheet-wrapper table {
                        min-width: 600px;
                        font-size: 12px;
                      }
                      .evaluation-spreadsheet-wrapper td,
                      .evaluation-spreadsheet-wrapper th {
                        padding: 6px 8px;
                        font-size: 12px;
                      }
                    }
                    @media (max-width: 640px) {
                      .evaluation-spreadsheet-wrapper {
                        -webkit-overflow-scrolling: touch;
                      }
                      .evaluation-spreadsheet-wrapper table {
                        min-width: 500px;
                        font-size: 11px;
                      }
                      .evaluation-spreadsheet-wrapper td,
                      .evaluation-spreadsheet-wrapper th {
                        padding: 4px 6px;
                        font-size: 11px;
                      }
                      .evaluation-spreadsheet-wrapper input {
                        font-size: 11px;
                      }
                    }
                    @media (max-width: 480px) {
                      .evaluation-spreadsheet-wrapper table {
                        min-width: 450px;
                        font-size: 10px;
                      }
                      .evaluation-spreadsheet-wrapper td,
                      .evaluation-spreadsheet-wrapper th {
                        padding: 3px 4px;
                        font-size: 10px;
                      }
                      .evaluation-spreadsheet-wrapper input {
                        font-size: 10px;
                      }
                    }
                  `}</style>
                  <Spreadsheet
                    data={spreadsheetData}
                    DataViewer={createCustomDataViewer(spreadsheetData.length)}
                    
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

