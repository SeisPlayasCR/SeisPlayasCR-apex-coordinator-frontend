import type React from "react"
import type { Metadata } from "next/types"
import { Inter } from "next/font/google"
import { cookies } from "next/headers"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"


import { AppSidebar } from "./_components/sidebar"
import { Header } from "./_components/header"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: "User Management Dashboard",
    description: "A comprehensive user management system.",
}

export default async function AdminLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const cookieStore = await cookies()
    const defaultOpen = cookieStore.get("sidebar:state")?.value === "true"

    return (
        <html lang="en">
            <body className={inter.className}>
                <SidebarProvider defaultOpen={defaultOpen}>
                    <AppSidebar />
                    <SidebarInset>
                        <Header />
                        <main className="flex-1 overflow-auto">{children}</main>
                    </SidebarInset>
                </SidebarProvider>
            </body>
        </html >
    )
}
