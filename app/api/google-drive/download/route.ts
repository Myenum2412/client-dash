import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DRIVE_API_KEY = process.env.GOOGLE_DRIVE_API_KEY;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    if (!DRIVE_API_KEY) {
      return NextResponse.json(
        { error: "Google Drive API key not configured" },
        { status: 500 }
      );
    }

    console.log("Downloading file from Google Drive:", fileId);

    // Use Google Drive API to get file content
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${DRIVE_API_KEY}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/pdf',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Drive download error:", errorText);
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const fileBuffer = await response.arrayBuffer();
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error("Error downloading file from Google Drive:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to download file" },
      { status: 500 }
    );
  }
}

