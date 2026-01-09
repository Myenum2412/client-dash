import type { Metadata } from "next";
import { TopHeader } from "@/components/app/top-header";
import { VercelV0Chat } from "@/components/mvpblocks/v0-chat";

export const metadata: Metadata = {
  title: "AI Chat",
  description: "Chat with AI assistant for project-related questions and assistance",
};

export default async function AIChatPage() {
  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500">
      <TopHeader
        section="AI Chat"
        page="AI Assistant"
        search={{ placeholder: "Search conversations...", action: "/client/ai-chat", name: "q" }}
      />
      <div className="flex-1 min-h-0 p-4 pt-0">
        <VercelV0Chat />
      </div>
    </div>
  );
}
