import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export interface DrawingLogVersionHistory {
  id: string;
  drawing_log_id: string;
  version_number: number;
  old_data: Record<string, any> | null;
  new_data: Record<string, any> | null;
  changed_fields: string[];
  change_summary: string;
  change_type: "INSERT" | "UPDATE" | "DELETE";
  editor_id: string | null;
  editor_name: string | null;
  editor_email: string | null;
  created_at: string;
}

/**
 * GET /api/drawing-log/[drawingLogId]/version-history
 * Retrieve version history for a specific drawing log entry
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ drawingLogId: string }> }
) {
  try {
    const { drawingLogId } = await params;
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Fetch version history
    const { data, error } = await supabase
      .from("drawing_log_version_history")
      .select("*")
      .eq("drawing_log_id", drawingLogId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching version history:", error);
      return NextResponse.json(
        { message: "Failed to fetch version history" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      versionHistory: data as DrawingLogVersionHistory[],
    });
  } catch (error) {
    console.error("Error fetching version history:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

