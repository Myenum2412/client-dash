import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createInfiniteResponse } from "@/lib/api/pagination";
import { demoChatMessages } from "@/public/assets";

export const dynamic = "force-dynamic";

type ChatMessageRow = {
  id: string;
  role: "me" | "system";
  text: string;
  created_at: string;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const cursor = searchParams.get("cursor");
    const limit = Math.min(20, parseInt(searchParams.get("limit") || "20", 10));

    const supabase = await createSupabaseServerClient();
    
    // Build query
    let query = supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true });

    // Filter by projectId if provided
    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    // Try to fetch from database, but always fallback to mock data
    const { data: messages, error } = await query;

    let chatMessages: ChatMessageRow[] = [];

    // Use mock data from assets.ts (always available for demo)
    // This ensures dummy chat data is always displayed
    const mockData = demoChatMessages
      .filter((msg) => {
        // Filter by projectId if provided
        if (projectId) {
          return msg.projectId === projectId;
        }
        // If no projectId filter, return messages without projectId or null
        return !msg.projectId || msg.projectId === null;
      })
      .map((msg) => ({
        id: msg.id,
        role: msg.role,
        text: msg.text,
        created_at: msg.created_at,
      }));

    // If database has messages, use them; otherwise use mock data
    if (!error && messages && messages.length > 0) {
      // Map database messages to expected format
      chatMessages = messages.map((msg) => ({
        id: msg.id,
        role: msg.role as "me" | "system",
        text: msg.text,
        created_at: msg.created_at,
      }));
    } else {
      // Use mock data when database is empty or has errors
      console.log("Using mock chat data from assets.ts");
      chatMessages = mockData;
    }

    // Return infinite query response
    const infiniteResponse = createInfiniteResponse<ChatMessageRow>(
      chatMessages,
      cursor ? parseInt(cursor, 10) : null,
      limit
    );

    return NextResponse.json(infiniteResponse);
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    // Fallback to mock data on error
    const mockMessages: ChatMessageRow[] = demoChatMessages
      .filter((msg) => !msg.projectId || msg.projectId === null)
      .map((msg) => ({
        id: msg.id,
        role: msg.role,
        text: msg.text,
        created_at: msg.created_at,
      }));
    return NextResponse.json(
      createInfiniteResponse<ChatMessageRow>(mockMessages, null, 20),
      { status: 200 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { text?: string; projectId?: string | null }
      | null;

    const text = String(body?.text ?? "").trim();
    if (!text) {
      return NextResponse.json({ message: "Missing text" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Insert message into Supabase
    const { data: newMessage, error } = await supabase
      .from('chat_messages')
      .insert({
        user_id: user.id,
        project_id: body?.projectId || null,
        role: "me",
        text: text,
      })
      .select()
      .single();

    if (error) throw error;

    const chatMessage: ChatMessageRow = {
      id: newMessage.id,
      role: "me",
      text: newMessage.text,
      created_at: newMessage.created_at,
    };

    return NextResponse.json(chatMessage);
  } catch (error) {
    console.error("Error saving chat message:", error);
    return NextResponse.json(
      { message: "Failed to save message" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const supabase = await createSupabaseServerClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Build delete query
    let query = supabase
      .from('chat_messages')
      .delete()
      .eq('user_id', user.id);

    // Filter by projectId if provided
    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { error } = await query;

    if (error) throw error;

    return NextResponse.json({ 
      message: "Chat messages deleted successfully",
      deleted: true 
    });
  } catch (error) {
    console.error("Error deleting chat messages:", error);
    return NextResponse.json(
      { message: "Failed to delete chat messages" },
      { status: 500 }
    );
  }
}


