"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Sidebar, SidebarContent } from "@/components/Sidebar"
import { Menu, X, FlaskConical } from "lucide-react"

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/forgot-password') || pathname?.startsWith('/reset-password')

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  if (isAuthPage) {
    return (
      <main className="flex-1 flex flex-col min-h-screen w-full">
        {children}
      </main>
    )
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full bg-[#0f172a] text-slate-200">
      {/* Fixed Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Top Navigation Bar */}
      <header className="flex md:hidden items-center justify-between px-4 py-3 bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 no-print">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-white leading-tight text-sm">Lab Material</h1>
            <p className="text-[10px] text-slate-400 font-medium">Reporting System</p>
          </div>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors border border-slate-700/50"
          aria-label="Toggle navigation menu"
          title="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6 text-slate-200" /> : <Menu className="w-6 h-6 text-slate-200" />}
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex no-print">
          {/* Backdrop */}
          <div 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
          />
          {/* Sliding Content Drawer */}
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-300 border-r border-slate-700/50">
            <SidebarContent onItemClick={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 md:ml-72 ml-0 p-4 sm:p-6 md:p-8 w-full min-w-0 max-w-full overflow-x-hidden print:ml-0 print:p-0">
        {children}
      </main>
    </div>
  )
}
