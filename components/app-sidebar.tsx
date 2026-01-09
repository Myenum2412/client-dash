"use client"

import * as React from "react"
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer'
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import DriveFolderUploadIcon from '@mui/icons-material/DriveFolderUpload'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import PeopleIcon from '@mui/icons-material/People'
import SmartToyIcon from '@mui/icons-material/SmartToy'

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { AppSidebarClient } from "@/components/app-sidebar-client"
import { SidebarStandardFolders } from "@/components/sidebar-standard-folders"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import Image from "next/image"

export type SidebarUser = {
  name: string
  email: string
  avatar: string
}

// Navigation data
const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/client/dashboard",
      icon: SpaceDashboardIcon,
      isActive: true,
    },
    {
      title: "Projects",
      url: "/client/projects",
      icon: AccountTreeIcon,
    },
    {
      title: "Submissions",
      url: "/client/submissions",
      icon: CloudUploadIcon,
    },
    {
      title: "Billing",
      url: "/client/billing",
      icon: DriveFolderUploadIcon,
    },
    {
      title: "Chat",
      url: "/client/chat",
      icon: QuestionAnswerIcon,
    },
    {
      title: "Payers",
      url: "/client/payers",
      icon: PeopleIcon,
    },
    {
      title: "Ai chat",
      url: "/client/ai-chat",
      icon: SmartToyIcon,
    }
  ],
}

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: SidebarUser }) {
  return (
    <Sidebar collapsible="icon" {...props} >
      <SidebarHeader>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            <Image
              src="/image/logo.png"
              alt="Proultima"
              width={48}
              height={48}
              className="h-12 w-12 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 object-contain shrink-0 transition-all duration-200"
              priority
            />
            <span className="group-data-[collapsible=icon]:hidden font-semibold">Proultima</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />
        <SidebarStandardFolders />
        <AppSidebarClient />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
