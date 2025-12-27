"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { RealtimeSearchBar } from "@/components/realtime-search-bar";
import { Button } from "@/components/ui/button";

export function FloatingSearchButton() {
  const [isOpen, setIsOpen] = useState(false);

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Floating Search Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-50 h-10 w-10 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 p-0"
        size="icon"
        aria-label="Open search"
      >
        <Search className="h-5 w-5" />
      </Button>

      {/* Search Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl p-6">
          <RealtimeSearchBar defaultOpen={true} />
        </DialogContent>
      </Dialog>
    </>
  );
}

