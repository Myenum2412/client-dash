import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

type FileNode = {
  id: string;
  name: string;
  type: "file" | "folder";
  path: string;
  children?: FileNode[];
  extension?: string;
  size?: number;
};

function buildFileTree(dirPath: string, basePath: string = ""): FileNode[] {
  const items: FileNode[] = [];
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      // Skip hidden files
      if (entry.name.startsWith(".")) {
        continue;
      }

      const fullPath = path.join(dirPath, entry.name);
      const relativePath = basePath ? path.join(basePath, entry.name) : entry.name;
      const id = relativePath.replace(/\\/g, "/");
      
      if (entry.isDirectory()) {
        const children = buildFileTree(fullPath, relativePath);
        items.push({
          id,
          name: entry.name,
          type: "folder",
          path: `/assets/files/${relativePath.replace(/\\/g, "/")}`,
          children,
        });
      } else {
        const stats = fs.statSync(fullPath);
        const ext = path.extname(entry.name).toLowerCase();
        items.push({
          id,
          name: entry.name,
          type: "file",
          path: `/assets/files/${relativePath.replace(/\\/g, "/")}`,
          extension: ext,
          size: stats.size,
        });
      }
    }
  } catch (error) {
    console.error("Error reading directory:", error);
  }
  
  return items.sort((a, b) => {
    // Folders first, then files
    if (a.type !== b.type) {
      return a.type === "folder" ? -1 : 1;
    }
    // Alphabetical within each type
    return a.name.localeCompare(b.name);
  });
}

/**
 * GET /api/files/project/[projectId]
 * 
 * Returns file tree for a specific project folder from /public/assets/files
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    
    // Decode the project ID (it might be URL encoded)
    const decodedProjectId = decodeURIComponent(projectId);
    
    const filesDir = path.join(process.cwd(), "public", "assets", "files");
    const projectDir = path.join(filesDir, decodedProjectId);
    
    // Check if project directory exists
    if (!fs.existsSync(projectDir)) {
      return NextResponse.json(
        { 
          data: [],
          error: "Project directory not found",
          message: `The project folder "${decodedProjectId}" does not exist.`
        },
        { status: 404 }
      );
    }
    
    // Check if it's actually a directory
    if (!fs.statSync(projectDir).isDirectory()) {
      return NextResponse.json(
        { 
          data: [],
          error: "Invalid project path",
          message: `"${decodedProjectId}" is not a directory.`
        },
        { status: 400 }
      );
    }
    
    const fileTree = buildFileTree(projectDir, decodedProjectId);
    
    return NextResponse.json({ 
      data: fileTree,
      projectId: decodedProjectId,
      count: fileTree.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching project files:", error);
    return NextResponse.json(
      { 
        data: [],
        error: "Failed to fetch project files",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

