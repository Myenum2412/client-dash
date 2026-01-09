import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export type ScanHistoryItem = {
  id: string;
  extracted_text: string;
  detected_drawing_number: string | null;
  ocr_confidence: number | null;
  processing_time_ms: number | null;
  language_detected: string | null;
  device_type: string | null;
  created_at: string;
  drawing_data: any | null;
};

// GET /api/scans/history - Get user's scan history
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const supabase = await createSupabaseServerClient();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const { data, error } = await supabase
      .from("scan_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching scan history:", error);
      return NextResponse.json(
        { error: "Failed to fetch scan history" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error("Error in scan history GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/scans/history - Save a new scan
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const supabase = await createSupabaseServerClient();

    const body = await request.json();
    const {
      extracted_text,
      detected_drawing_number,
      image_data_url,
      ocr_confidence,
      processing_time_ms,
      language_detected,
      device_type,
      camera_facing,
      image_width,
      image_height,
      drawing_data,
    } = body;

    if (!extracted_text) {
      return NextResponse.json(
        { error: "extracted_text is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("scan_history")
      .insert({
        user_id: user.id,
        extracted_text,
        detected_drawing_number: detected_drawing_number || null,
        image_data_url: image_data_url || null, // Optional for privacy
        ocr_confidence: ocr_confidence || null,
        processing_time_ms: processing_time_ms || null,
        language_detected: language_detected || null,
        device_type: device_type || null,
        camera_facing: camera_facing || null,
        image_width: image_width || null,
        image_height: image_height || null,
        drawing_data: drawing_data || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving scan history:", error);
      return NextResponse.json(
        { error: "Failed to save scan history" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error in scan history POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/scans/history/[id] - Delete a scan
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUser();
    const supabase = await createSupabaseServerClient();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Scan ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("scan_history")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id); // Ensure user can only delete their own scans

    if (error) {
      console.error("Error deleting scan:", error);
      return NextResponse.json(
        { error: "Failed to delete scan" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in scan history DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

