import type { Metadata } from "next";
import { AppSidebar } from "@/components/app-sidebar";
import type { SidebarUser } from "@/components/app-sidebar";
import { TopHeader } from "@/components/app/top-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { requireUser } from "@/lib/auth/server";
import { RFITable } from "@/components/rfi/rfi-table";
import { RfiCard } from "@/components/rfi/rfi-card";
import { QueryBoundary } from "@/components/query/query-boundary";

export const metadata: Metadata = {
  title: "RFI - Request for Information",
  description: "View and manage Request for Information (RFI) submissions",
};

export default async function RFIPage() {
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
      <SidebarInset>
        <TopHeader
          section="RFI"
          page="Request for Information"
          search={{ placeholder: "Search RFI...", action: "/rfi", name: "q" }}
        />
        <div className="min-h-0 flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <QueryBoundary
            loadingTitle="Loading RFI data..."
            loadingSubtitle="Fetching RFI information"
          >
            <RfiCard />
            <RFITable />
          </QueryBoundary>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

