"use client";

import Link from "next/link";
import { Users, DollarSign, LayoutDashboard, FileText } from "lucide-react";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="flex items-center justify-center p-4">
              <LayoutDashboard className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900 group-data[collapsible=icon]:hidden">
                Panel
              </span>
            </div>

            <SidebarMenu>
              <SidebarMenuItem>
                {/* Facturas menu item */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/admin/facturas"}
                  >
                    <Link href="/admin/facturas">
                      <FileText className="h-4 w-4" />
                      <span>Facturas</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Transaction menu item */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/admin/transactions"}
                  >
                    <Link href="/admin/transactions">
                      <DollarSign className="h-4 w-4" />
                      <span>Actas</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* All users menu item */}
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/admin/users"}
                >
                  <Link href="/admin/users">
                    <Users className="h-4 w-4" />
                    <span>Clientes</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
