"use client"

import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/Sidebar"

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/forgot-password') || pathname?.startsWith('/reset-password')

  if (isAuthPage) {
    return (
      <main className="flex-1 flex flex-col min-h-screen w-full">
        {children}
      </main>
    )
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 print:ml-0 print:p-0">
        {children}
      </main>
    </div>
  )
}
