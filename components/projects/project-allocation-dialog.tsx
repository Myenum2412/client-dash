"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { CalendarIcon, Upload, ChevronDown, X } from "lucide-react";
import { formatDate } from "@/lib/utils/date-format";
import { cn } from "@/lib/utils";
import type { DayButton } from "react-day-picker";
import { FilePreviewList } from "@/components/chat/file-preview";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

type ProjectAllocationFormData = {
  projectName: string;
  projectNumber: string;
  dueDate: Date | undefined;
  assignedTo: string[];
  description: string;
  files: File[];
};

interface ProjectAllocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: ProjectAllocationFormData) => Promise<void> | void;
  isSubmitting?: boolean;
}

const ASSIGNEE_OPTIONS = ["Vel", "Rajesh"];

const ACCEPTED_FILE_TYPES = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
};

export function ProjectAllocationDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: ProjectAllocationDialogProps) {
  const [projectNumber, setProjectNumber] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProjectAllocationFormData>({
    defaultValues: {
      projectName: "",
      projectNumber: "",
      dueDate: undefined,
      assignedTo: [],
      description: "",
      files: [],
    },
  });

  // Auto-generate project number on open
  useEffect(() => {
    if (open) {
      const generatedNumber = `PRJ-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
      setProjectNumber(generatedNumber);
      setValue("projectNumber", generatedNumber);
    } else {
      // Reset form when closed
      reset();
      setSelectedDate(undefined);
      setSelectedAssignees([]);
      setUploadedFiles([]);
      setProjectNumber("");
    }
  }, [open, setValue, reset]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setValue("dueDate", date);
  };

  const handleAssigneeToggle = (assignee: string) => {
    const newAssignees = selectedAssignees.includes(assignee)
      ? selectedAssignees.filter((a) => a !== assignee)
      : [...selectedAssignees, assignee];
    setSelectedAssignees(newAssignees);
    setValue("assignedTo", newAssignees);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter((file) => {
      const isValidType = Object.keys(ACCEPTED_FILE_TYPES).some(
        (type) => file.type === type
      );
      if (!isValidType) {
        alert(`File type not supported: ${file.name}. All Files Format are supported`);
        return false;
      }
      return true;
    });

    setUploadedFiles((prev) => [...prev, ...validFiles]);
    setValue("files", [...uploadedFiles, ...validFiles]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    setValue("files", newFiles);
  };

  const onFormSubmit = async (data: ProjectAllocationFormData) => {
    const formData = {
      ...data,
      projectNumber,
      dueDate: selectedDate,
      assignedTo: selectedAssignees,
      files: uploadedFiles,
    };

    if (onSubmit) {
      await onSubmit(formData);
    } else {
      console.log("Project Allocation Data:", formData);
      alert("Project allocated successfully!");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="text-2xl font-semibold">
            Project Allocation
          </DialogTitle>
          <DialogDescription>
            Create and allocate a new project with team assignments
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <form
            id="project-allocation-form"
            onSubmit={handleSubmit(onFormSubmit)}
            className="space-y-6 rounded-2xl"
          >
              {/* Row 1: Project Name & Project Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName" className="text-sm font-semibold">
                    Project Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="projectName"
                    placeholder="Enter project name"
                    {...register("projectName", {
                      required: "Project name is required",
                    })}
                    className={cn(
                      errors.projectName && "border-destructive"
                    )}
                  />
                  {errors.projectName && (
                    <p className="text-xs text-destructive">
                      {errors.projectName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectNumber" className="text-sm font-semibold">
                    Project Number
                  </Label>
                  <Input
                    id="projectNumber"
                    value={projectNumber}
                    readOnly
                    disabled
                    className="bg-muted cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Row 2: Expected Submission date & Assigned To */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate" className="text-sm font-semibold">
                    Expected Submission date
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? (
                          formatDate(selectedDate)
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        initialFocus
                        components={{
                          DayButton: ({ day, className, ...props }) => {
                            const dayOfWeek = day.date.getDay();
                            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday (0) or Saturday (6)
                            const dayColorClass = isWeekend
                              ? "text-red-600 hover:text-red-700"
                              : "text-green-600 hover:text-green-700";
                            
                            return (
                              <CalendarDayButton
                                day={day}
                                className={cn(dayColorClass, className)}
                                {...props}
                              />
                            );
                          },
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    Assigned To
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between text-left font-normal",
                          selectedAssignees.length === 0 && "text-muted-foreground"
                        )}
                      >
                        <span className="truncate">
                          {selectedAssignees.length === 0
                            ? "Select assignees..."
                            : selectedAssignees.length === 1
                            ? selectedAssignees[0]
                            : `${selectedAssignees.length} selected`}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="start">
                      <div className="p-2 space-y-2">
                        {ASSIGNEE_OPTIONS.map((assignee) => (
                          <div
                            key={assignee}
                            className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                            onClick={() => handleAssigneeToggle(assignee)}
                          >
                            <Checkbox
                              checked={selectedAssignees.includes(assignee)}
                              onCheckedChange={() => handleAssigneeToggle(assignee)}
                            />
                            <Label
                              className="text-sm font-normal cursor-pointer flex-1"
                            >
                              {assignee}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  {selectedAssignees.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedAssignees.map((assignee) => (
                        <Badge
                          key={assignee}
                          variant="secondary"
                          className="text-xs"
                        >
                          {assignee}
                          <button
                            type="button"
                            onClick={() => handleAssigneeToggle(assignee)}
                            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Row 3: Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Enter project description and notes..."
                  rows={4}
                  {...register("description")}
                  className="resize-none"
                />
              </div>

              {/* Row 4: File Upload */}
              <div className="space-y-2">
                <Label htmlFor="files" className="text-sm font-semibold">
                  File Upload
                </Label>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Files
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All Files Format are supported
                  </p>
                  {uploadedFiles.length > 0 && (
                    <div className="mt-2">
                      <FilePreviewList
                        files={uploadedFiles}
                        onRemove={handleRemoveFile}
                      />
                    </div>
                  )}
                </div>
              </div>
            </form>
        </ScrollArea>

        {/* Footer with Submit and Cancel buttons */}
        <DialogFooter className="px-6 py-4 border-t shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="project-allocation-form"
            className="bg-emerald-600 hover:bg-emerald-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

