"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { fetchJson } from "@/lib/api/fetch-json";
import { queryKeys } from "@/lib/query/keys";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Project = {
  id: string;
  jobNumber: string;
  name: string;
};

type CreateRFIFormData = {
  projectId: string;
  workDescription: string;
  drawingNumber: string;
  sheets: string;
  submissionDate: string;
  submittedBy: string;
  status: string;
};

export function CreateRFIDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateRFIFormData>({
    projectId: "",
    workDescription: "",
    drawingNumber: "",
    sheets: "",
    submissionDate: new Date().toISOString().split("T")[0],
    submittedBy: "PROULTIMA PM",
    status: "PENDING",
  });

  // Fetch projects for the dropdown
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: queryKeys.projects(),
    queryFn: () => fetchJson<any[]>("/api/projects"),
    staleTime: 60_000,
  });

  // Create RFI mutation
  const createRFIMutation = useMutation({
    mutationFn: async (data: CreateRFIFormData) => {
      const response = await fetch("/api/rfi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: data.projectId,
          submission_type: "RFI",
          work_description: data.workDescription,
          drawing_number: data.drawingNumber,
          sheets: data.sheets,
          submission_date: data.submissionDate,
          submitted_by: data.submittedBy,
          status: data.status,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create RFI");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("RFI created successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.rfi() });
      onOpenChange(false);
      // Reset form
      setFormData({
        projectId: "",
        workDescription: "",
        drawingNumber: "",
        sheets: "",
        submissionDate: new Date().toISOString().split("T")[0],
        submittedBy: "PROULTIMA PM",
        status: "PENDING",
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create RFI");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.projectId) {
      toast.error("Please select a project");
      return;
    }
    if (!formData.workDescription.trim()) {
      toast.error("Please enter a work description");
      return;
    }

    createRFIMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New RFI</DialogTitle>
          <DialogDescription>
            Submit a new Request for Information for a project
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project">Project *</Label>
            <Select
              value={formData.projectId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, projectId: value }))
              }
              disabled={isLoadingProjects}
            >
              <SelectTrigger id="project">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.jobNumber} - {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workDescription">Work Description *</Label>
            <Textarea
              id="workDescription"
              value={formData.workDescription}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  workDescription: e.target.value,
                }))
              }
              placeholder="Describe the work or question..."
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="drawingNumber">Drawing Number</Label>
              <Input
                id="drawingNumber"
                value={formData.drawingNumber}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    drawingNumber: e.target.value,
                  }))
                }
                placeholder="e.g., DWG-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sheets">Sheets</Label>
              <Input
                id="sheets"
                value={formData.sheets}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, sheets: e.target.value }))
                }
                placeholder="e.g., 1-5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="submissionDate">Submission Date *</Label>
              <Input
                id="submissionDate"
                type="date"
                value={formData.submissionDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    submissionDate: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="submittedBy">Submitted By</Label>
              <Input
                id="submittedBy"
                value={formData.submittedBy}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    submittedBy: e.target.value,
                  }))
                }
                placeholder="Name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN PROGRESS">In Progress</SelectItem>
                <SelectItem value="UNDER REVIEW">Under Review</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createRFIMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createRFIMutation.isPending}>
              {createRFIMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create RFI
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

