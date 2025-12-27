"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateRFIDialog } from "./create-rfi-dialog";

export function CreateRFIButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Create New RFI
      </Button>
      <CreateRFIDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

