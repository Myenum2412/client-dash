"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, FileText, Download } from "lucide-react";
import { FileTree } from "./file-tree";
import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api/fetch-json";

type FileNode = {
  id: string;
  name: string;
  type: "file" | "folder";
  path: string;
  children?: FileNode[];
  extension?: string;
  size?: number;
};

type ProjectFilesResponse = {
  data: FileNode[];
  projectId: string;
  count?: number;
  timestamp?: string;
};

export function ProjectFilesClient({ projectId }: { projectId: string }) {
  const [selectedNode, setSelectedNode] = useState<FileNode | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const {
    data: response,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["project-files", projectId],
    queryFn: () => fetchJson<ProjectFilesResponse>(`/api/files/project/${encodeURIComponent(projectId)}`),
    staleTime: 30_000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  const fileTree = response?.data || [];
  const decodedProjectId = decodeURIComponent(projectId);

  // Auto-expand first folder on initial load
  useEffect(() => {
    if (!isLoading && fileTree.length > 0 && expandedIds.size === 0) {
      const firstFolder = fileTree.find((node) => node.type === "folder");
      if (firstFolder) {
        setSelectedNode(firstFolder);
        setExpandedIds(new Set([firstFolder.id]));
      }
    }
  }, [fileTree, isLoading, expandedIds.size]);

  const handleFileClick = (file: FileNode) => {
    if (file.type === "folder") {
      setSelectedNode(file);
      // Toggle expansion
      setExpandedIds((prev) => {
        const next = new Set(prev);
        if (next.has(file.id)) {
          next.delete(file.id);
        } else {
          next.add(file.id);
        }
        return next;
      });
    } else {
      setSelectedNode(file);
      // For files, open them in a new tab or download
      if (file.path) {
        window.open(file.path, "_blank");
      }
    }
  };

  const handleDownload = (file: FileNode) => {
    if (!file.path) return;
    
    try {
      if (typeof document === "undefined" || !document.body) return;
      
      const link = document.createElement("a");
      link.href = file.path;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      // Safely remove the link - check if it still has a parent
      if (link.parentNode) {
        document.body.removeChild(link);
      }
    } catch {
      // Silently handle errors
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <Card className="w-full shadow-lg">
        <CardHeader className="border-b shrink-0 bg-emerald-50/70 p-6 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-emerald-900">
            {decodedProjectId}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            {isRefetching ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-sm text-red-600 mb-2">Failed to load files</p>
              <p className="text-xs text-muted-foreground mb-4">
                {error instanceof Error ? error.message : "Unknown error"}
              </p>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : fileTree.length > 0 ? (
            <div className="border rounded-lg p-4 bg-background">
              <FileTree
                data={fileTree}
                onSelect={handleFileClick}
                selectedId={selectedNode?.id}
                expandedIds={expandedIds}
              />
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-2">No files found</p>
              <p className="text-xs text-muted-foreground">
                This project folder is empty
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Details Panel */}
      {selectedNode && (
        <Card className="w-full shadow-lg">
          <CardHeader className="border-b shrink-0 bg-emerald-50/70 p-6">
            <CardTitle className="text-lg font-semibold text-emerald-900 flex items-center gap-2">
              {selectedNode.type === "folder" ? (
                <FileText className="h-5 w-5 text-blue-500" />
              ) : (
                <FileText className="h-5 w-5 text-gray-500" />
              )}
              {selectedNode.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Type:</span>
                <span className="text-sm font-medium capitalize">{selectedNode.type}</span>
              </div>
              {selectedNode.extension && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Extension:</span>
                  <span className="text-sm font-medium">{selectedNode.extension}</span>
                </div>
              )}
              {selectedNode.size && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Size:</span>
                  <span className="text-sm font-medium">{formatFileSize(selectedNode.size)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Path:</span>
                <span className="text-sm font-mono text-xs truncate max-w-xs" title={selectedNode.path}>
                  {selectedNode.path}
                </span>
              </div>
              {selectedNode.type === "file" && (
                <div className="pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleDownload(selectedNode)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download File
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

