import type { Metadata } from "next";
import { AppSidebar } from "@/components/app-sidebar";
import type { SidebarUser } from "@/components/app-sidebar";
import { TopHeader } from "@/components/app/top-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { requireUser } from "@/lib/auth/server";
import { VercelV0Chat } from "@/components/mvpblocks/v0-chat";

export const metadata: Metadata = {
  title: "AI Chat",
  description: "Chat with AI assistant for project-related questions and assistance",
};

export default async function AIChatPage() {
  const user = await requireUser();

  const displayName =
    (typeof user.user_metadata?.full_name === "string" &&
      user.user_metadata.full_name) ||
    (user.email ? user.email.split("@")[0] : "User");

  const avatar =
    (typeof user.user_metadata?.avatar_url === "string" &&
      user.user_metadata.avatar_url) ||
    "/image/profile.jpg";

  const sidebarUser: SidebarUser = {
    name: displayName,
    email: user.email ?? "",
    avatar,
  };

  return (
    <SidebarProvider>
      <AppSidebar user={sidebarUser} />
      <SidebarInset className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500">
        <TopHeader
          section="AI Chat"
          page="AI Assistant"
          search={{ placeholder: "Search conversations...", action: "/ai-chat", name: "q" }}
        />
        <div className="flex-1 min-h-0 p-4 pt-0">
          <VercelV0Chat />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

