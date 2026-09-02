"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ClipboardList, Settings2, FlaskConical, LineChart, LogOut } from "lucide-react"
import { signOut } from "next-auth/react"

export function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname()

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Material Log", href: "/log", icon: ClipboardList },
    { name: "Product Specs", href: "/specifications", icon: Settings2 },
    { name: "Control Chart", href: "/analytics/control-chart", icon: LineChart },
  ]

  return (
    <div className="flex flex-col h-full bg-[#0f172a]/95 backdrop-blur-xl">
      <div className="p-6 border-b border-slate-700/50 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30 shadow-md">
          <FlaskConical className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-white leading-tight tracking-tight text-lg">Lab Material</h1>
          <p className="text-xs text-slate-400 font-medium">Reporting System</p>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onItemClick}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                isActive 
                  ? "bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-sm" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-700/50 mt-auto">
        <button 
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all font-medium text-sm"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
        <div className="text-xs text-slate-500 text-center mt-4">
          &copy; {new Date().getFullYear()} EMEC
        </div>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <div className="hidden md:flex w-72 h-screen glass-card rounded-none border-t-0 border-b-0 border-l-0 flex-col no-print fixed left-0 top-0 z-40">
      <SidebarContent />
    </div>
  )
}
