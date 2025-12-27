"use client";

import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, File } from "lucide-react";
import { cn } from "@/lib/utils";

type FileNode = {
  id: string;
  name: string;
  type: "file" | "folder";
  path: string;
  children?: FileNode[];
  extension?: string;
  size?: number;
};

type FileTreeItemProps = {
  node: FileNode;
  level?: number;
  onSelect?: (node: FileNode) => void;
  onHover?: (node: FileNode) => void;
  selectedId?: string;
  expandedIds?: Set<string>;
};

function FileTreeItem({ node, level = 0, onSelect, onHover, selectedId, expandedIds }: FileTreeItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;

  // Auto-expand if this node is in expandedIds
  useEffect(() => {
    if (expandedIds?.has(node.id)) {
      setIsOpen(true);
    }
  }, [expandedIds, node.id]);

  const handleClick = () => {
    if (node.type === "folder") {
      setIsOpen(!isOpen);
    }
    onSelect?.(node);
  };

  const handleMouseEnter = () => {
    if (node.type === "folder") {
      onHover?.(node);
    }
  };

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent transition-colors",
          isSelected && "bg-accent",
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
      >
        {node.type === "folder" && (
          <span className="flex-shrink-0">
            {hasChildren && (
              isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )
            )}
          </span>
        )}
        
        <span className="flex-shrink-0">
          {node.type === "folder" ? (
            isOpen ? (
              <FolderOpen className="h-4 w-4 text-blue-500" />
            ) : (
              <Folder className="h-4 w-4 text-blue-500" />
            )
          ) : (
            <FileText className="h-4 w-4 text-gray-500" />
          )}
        </span>

        <span className="text-sm truncate">{node.name}</span>
      </div>

      {node.type === "folder" && isOpen && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <FileTreeItem
              key={child.id}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              onHover={onHover}
              selectedId={selectedId}
              expandedIds={expandedIds}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type FileTreeProps = {
  data: FileNode[];
  onSelect?: (node: FileNode) => void;
  onHover?: (node: FileNode) => void;
  selectedId?: string;
  expandedIds?: Set<string>;
};

export function FileTree({ data, onSelect, onHover, selectedId, expandedIds }: FileTreeProps) {
  return (
    <div className="space-y-1">
      {data.map((node) => (
        <FileTreeItem
          key={node.id}
          node={node}
          onSelect={onSelect}
          onHover={onHover}
          selectedId={selectedId}
          expandedIds={expandedIds}
        />
      ))}
    </div>
  );
}

