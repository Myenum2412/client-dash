"use client"

import * as React from "react"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import {
  ChevronDown,
  LayoutDashboard,
  FolderKanban,
  Users,
  Settings,
} from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export type NavItem = {
  title: string
  url: string
  icon?: LucideIcon | React.ComponentType<any>
  isActive?: boolean
  items?: {
    title: string
    url: string
  }[]
  customContent?: React.ReactNode
}

/* -------------------------------------------------------------------------- */
/*                              SIDEBAR ITEMS                                 */
/* -------------------------------------------------------------------------- */

export const navItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Projects",
    url: "/projects",
    icon: FolderKanban,
    items: [
      {
        title: "Active Projects",
        url: "/projects/active",
      },
      {
        title: "Completed Projects",
        url: "/projects/completed",
      },
    ],
  },
  {
    title: "Users",
    url: "/users",
    icon: Users,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export function NavMain({ items = navItems }: { items?: NavItem[] }) {
  const [openItems, setOpenItems] = React.useState<Record<string, boolean>>({})
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)

    // Open all collapsible menus by default (client-only)
    const initialState: Record<string, boolean> = {}
    items.forEach((item) => {
      if (item.items?.length || item.customContent) {
        initialState[item.title] = true
      }
    })
    setOpenItems(initialState)
  }, [items])

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>

      <SidebarMenu>
        {items.map((item) => {
          const hasChildren = Boolean(item.items?.length || item.customContent)
          const Icon = item.icon

          // Non-collapsible menu item
          if (!hasChildren) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <Link href={item.url}>
                    {Icon && (
                      <div suppressHydrationWarning className="h-4 w-4 flex items-center justify-center">
                        <Icon className="h-4 w-4" />
                      </div>
                    )}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          // Collapsible menu item
          const isOpen = mounted ? openItems[item.title] ?? true : false

          return (
            <SidebarMenuItem key={item.title}>
              <Collapsible
                open={isOpen}
                onOpenChange={(open) =>
                  setOpenItems((prev) => ({
                    ...prev,
                    [item.title]: open,
                  }))
                }
                className="group/collapsible"
              >
                <div className="flex items-center group/item">
                  <SidebarMenuButton asChild className="flex-1">
                    <Link href={item.url}>
                      {Icon && (
                        <div suppressHydrationWarning className="h-4 w-4 flex items-center justify-center">
                          <Icon className="h-4 w-4" />
                        </div>
                      )}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>

                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors opacity-0 group-hover/item:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </CollapsibleTrigger>
                </div>

                <CollapsibleContent>
                  {item.customContent ? (
                    item.customContent
                  ) : (
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <Link href={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
