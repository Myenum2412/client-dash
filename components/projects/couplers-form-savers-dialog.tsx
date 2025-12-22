"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

export const demoCouplersFormSavers = [
  {
    sNo: 1,
    dwgNo: "R-71",
    description: "Mechanical Coupler Type A",
    type: "Coupler",
    code: "CPL-A",
    qtyPerBarSize: {
      bar4: 12,
      bar5: 8,
      bar6: 15,
      bar7: 0,
      bar8: 20,
      bar9: 0,
      bar10: 10,
      bar11: 0,
      bar14: 5,
      bar18: 0,
    },
    remarks: "Standard installation",
  },
  {
    sNo: 2,
    dwgNo: "R-45",
    description: "Form Saver Type B",
    type: "Form Saver",
    code: "FS-B",
    qtyPerBarSize: {
      bar4: 0,
      bar5: 6,
      bar6: 10,
      bar7: 8,
      bar8: 12,
      bar9: 0,
      bar10: 0,
      bar11: 4,
      bar14: 0,
      bar18: 2,
    },
    remarks: "Pre-fabricated",
  },
  {
    sNo: 3,
    dwgNo: "R-28",
    description: "Threaded Coupler Type C",
    type: "Coupler",
    code: "CPL-C",
    qtyPerBarSize: {
      bar4: 5,
      bar5: 0,
      bar6: 8,
      bar7: 12,
      bar8: 15,
      bar9: 10,
      bar10: 8,
      bar11: 0,
      bar14: 6,
      bar18: 4,
    },
    remarks: "As per drawing",
  },
  {
    sNo: 4,
    dwgNo: "S-12",
    description: "Form Saver Type D",
    type: "Form Saver",
    code: "FS-D",
    qtyPerBarSize: {
      bar4: 8,
      bar5: 10,
      bar6: 0,
      bar7: 6,
      bar8: 8,
      bar9: 12,
      bar10: 0,
      bar11: 5,
      bar14: 0,
      bar18: 0,
    },
    remarks: "Hot-dip galvanized",
  },
  {
    sNo: 5,
    dwgNo: "R-88",
    description: "Mechanical Coupler Type E",
    type: "Coupler",
    code: "CPL-E",
    qtyPerBarSize: {
      bar4: 0,
      bar5: 4,
      bar6: 6,
      bar7: 8,
      bar8: 10,
      bar9: 0,
      bar10: 12,
      bar11: 8,
      bar14: 6,
      bar18: 3,
    },
    remarks: "Grade A36",
  },
] as const;

interface CouplersFormSaversDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CouplersFormSaversDialog({ open, onOpenChange }: CouplersFormSaversDialogProps) {
  const data = demoCouplersFormSavers;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-screen-xl w-full min-w-[95vw] max-h-[75vh] h-[70vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0 w-full">
          <DialogTitle>Couplers/Form Savers</DialogTitle>
          <DialogDescription>
            Couplers and form savers details for the project
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 px-6 pb-6 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-emerald-50/70">
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900">
                      S.No
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900">
                      Dwg. No.
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900">
                      Description
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900">
                      Type
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900">
                      Code
                    </TableHead>
                    <TableHead
                      colSpan={10}
                      className="px-4 py-4 text-center font-semibold text-emerald-900 border-x"
                    >
                      Qty per Bar size
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900">
                      REMARKS
                    </TableHead>
                  </TableRow>
                  <TableRow className="bg-emerald-50/70">
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900"></TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900"></TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900"></TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900"></TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900"></TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900 border-x">
                      #4
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900">
                      #5
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900">
                      #6
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900">
                      #7
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900">
                      #8
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900">
                      #9
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900">
                      #10
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900">
                      #11
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900">
                      #14
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900 border-x">
                      #18
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row) => (
                    <TableRow key={row.sNo}>
                      <TableCell className="px-4 py-4 text-center font-medium">
                        {row.sNo}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center font-medium">
                        {row.dwgNo}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        {row.description}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        {row.type}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        {row.code}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center border-x">
                        {row.qtyPerBarSize.bar4 ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        {row.qtyPerBarSize.bar5 ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        {row.qtyPerBarSize.bar6 ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        {row.qtyPerBarSize.bar7 ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        {row.qtyPerBarSize.bar8 ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        {row.qtyPerBarSize.bar9 ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        {row.qtyPerBarSize.bar10 ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        {row.qtyPerBarSize.bar11 ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        {row.qtyPerBarSize.bar14 ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center border-x">
                        {row.qtyPerBarSize.bar18 ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center font-medium">
                        {row.remarks}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

