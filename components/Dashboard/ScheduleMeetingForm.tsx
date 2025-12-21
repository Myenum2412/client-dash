"use client";

import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { format } from "date-fns";
import {
  CalendarIcon,
  Clock,
  User,
  FolderKanban,
  FileText,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useProjects } from "@/hooks/use-projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Zod schema for form validation
const meetingSchema = z.object({
  meetingTitle: z.string().min(3, "Meeting title must be at least 3 characters"),
  date: z.date({ message: "Date is required" }),
  time: z.string().min(1, "Time is required"),
  member: z.string().min(1, "Member selection is required"),
  projectId: z.string().optional(),
  description: z.string().optional(),
});

type MeetingFormData = z.infer<typeof meetingSchema>;

interface Member {
  id: string;
  name: string;
  email: string;
}

const MEMBERS: Member[] = [
  { id: "vel", name: "Vel", email: "vel@proultima.com" },
  { id: "rajesh", name: "Rajesh", email: "rajesh@proultima.com" },
];

export default function ScheduleMeetingForm() {
  const [formData, setFormData] = useState<Partial<MeetingFormData>>({
    meetingTitle: "",
    date: undefined,
    time: "",
    member: "",
    projectId: "",
    description: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof MeetingFormData, string>>>({});
  const [loading, setLoading] = useState(false);
  
  const { data: projects = [], isLoading: isLoadingProjects } = useProjects();

  // Get selected project details
  const selectedProjectData = projects.find((p) => p.id === formData.projectId);

  // Trigger confetti celebration
  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: NodeJS.Timeout = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      // Launch confetti from left
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      
      // Launch confetti from right
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    // Stars confetti
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        shapes: ["star"],
        colors: ["#10b981", "#059669", "#34d399", "#6ee7b7"],
      });
    }, 500);
  };

  const handleInputChange = (field: keyof MeetingFormData, value: string | Date | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Validate that date is provided
      if (!formData.date) {
        setErrors({ date: "Date is required" });
        setLoading(false);
        toast.error("Please select a date.", {
          description: "Date is required to schedule the meeting.",
        });
        return;
      }

      // Validate form data first
      const validatedData = meetingSchema.parse(formData);

      // Combine date and time
      const [hours, minutes] = validatedData.time.split(":");
      const dateTime = new Date(validatedData.date);
      dateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));

      const payload = {
        title: validatedData.meetingTitle,
        dateTime: dateTime.toISOString(),
        description: validatedData.description || "No description provided",
        member: MEMBERS.find((m) => m.id === validatedData.member)?.name || validatedData.member,
        projectId: validatedData.projectId || undefined,
        projectNumber: selectedProjectData?.projectNumber || undefined,
        projectName: selectedProjectData?.projectName || undefined,
      };

      // Send email via API route
      const response = await fetch("/api/meetings/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to schedule meeting");
      }

      // Success!
      triggerConfetti();

      toast.success("Meeting Scheduled Successfully! 🎉", {
        description: `${validatedData.meetingTitle} on ${format(validatedData.date, "PPP")} at ${format(dateTime, "h:mm a")}`,
        duration: 5000,
      });

      // Reset form
      setFormData({
        meetingTitle: "",
        date: undefined,
        time: "",
        member: "",
        projectId: "",
        description: "",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Handle validation errors
        const fieldErrors: Partial<Record<keyof MeetingFormData, string>> = {};
        error.issues.forEach((issue) => {
          const field = issue.path[0] as keyof MeetingFormData;
          fieldErrors[field] = issue.message;
        });
        
        setErrors(fieldErrors);
        
        toast.error("Please fix the errors in the form.", {
          description: "Some fields have validation errors.",
        });
      } else {
        // Handle API or other errors
        console.error("Meeting scheduling error:", error);
        toast.error("Failed to schedule meeting. Please try again.", {
          description: error instanceof Error ? error.message : "An error occurred while scheduling the meeting.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <Card className="w-full shadow-lg overflow-hidden">
      <CardHeader className="border-b">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-600" />
          Schedule Meeting
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 overflow-x-hidden">
        <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-full">
          {/* Meeting Title */}
          <div>
            <Label htmlFor="meetingTitle" className="mb-2 block text-sm font-medium">
              Meeting Title <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="meetingTitle"
                type="text"
                value={formData.meetingTitle || ""}
                onChange={(e) => handleInputChange("meetingTitle", e.target.value)}
                className={cn(
                  "h-11",
                  errors.meetingTitle && "border-red-500 focus:border-red-500"
                )}
                placeholder="Enter meeting title"
              />
            </div>
            {errors.meetingTitle && (
              <p className="mt-1 text-sm text-red-500">{errors.meetingTitle}</p>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div>
              <Label className="mb-2 block text-sm font-medium">
                Date <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-11",
                      !formData.date && "text-muted-foreground",
                      errors.date && "border-red-500 focus:border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? (
                      format(formData.date, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => handleInputChange("date", date)}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.date && (
                <p className="mt-1 text-sm text-red-500">{errors.date}</p>
              )}
            </div>

            <div>
              <Label htmlFor="time" className="mb-2 block text-sm font-medium">
                Time <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="time"
                  type="time"
                  value={formData.time || ""}
                  onChange={(e) => handleInputChange("time", e.target.value)}
                  className={cn(
                    "h-11 pl-10",
                    errors.time && "border-red-500 focus:border-red-500"
                  )}
                />
              </div>
              {errors.time && (
                <p className="mt-1 text-sm text-red-500">{errors.time}</p>
              )}
            </div>
          </div>

          {/* Member and Project Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div>
              <Label htmlFor="member" className="mb-2 flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4" />
                Member <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.member || ""}
                onValueChange={(value) => handleInputChange("member", value)}
              >
                <SelectTrigger
                  id="member"
                  className={cn(
                    "h-11",
                    errors.member && "border-red-500 focus:border-red-500"
                  )}
                >
                  <SelectValue placeholder="Select a member" />
                </SelectTrigger>
                <SelectContent>
                  {MEMBERS.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{member.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({member.email})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.member && (
                <p className="mt-1 text-sm text-red-500">{errors.member}</p>
              )}
            </div>

            <div>
              <Label htmlFor="project" className="mb-2 flex items-center gap-2 text-sm font-medium">
                <FolderKanban className="h-4 w-4" />
                Select Project
              </Label>
              {isLoadingProjects ? (
                <Skeleton className="h-11 w-full" />
              ) : (
                <Select
                  value={formData.projectId || ""}
                  onValueChange={(value) => handleInputChange("projectId", value)}
                >
                  <SelectTrigger id="project" className="h-11">
                    <SelectValue placeholder="Select a project (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No projects available
                      </div>
                    ) : (
                      projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{project.projectName}</span>
                            {project.projectNumber && (
                              <span className="text-xs text-muted-foreground">
                                {project.projectNumber}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
              {selectedProjectData && (
                <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                  Selected: {selectedProjectData.projectName}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="mb-2 flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4" />
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={4}
              className="resize-none"
              placeholder="Enter meeting description (optional)"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData({
                  meetingTitle: "",
                  date: undefined,
                  time: "",
                  member: "",
                  projectId: "",
                  description: "",
                });
                setErrors({});
              }}
              disabled={loading}
              className="h-11 px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={cn(
                "h-11 px-8 bg-emerald-600 hover:bg-emerald-700 text-white",
                loading && "opacity-50 cursor-not-allowed"
              )}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling...
                </div>
              ) : (
                <div className="flex items-center">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Schedule Meeting
                </div>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
      </Card>
    </div>
  );
}
