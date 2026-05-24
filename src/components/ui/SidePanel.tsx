"use client"

import { X } from "lucide-react"
import { useEffect } from "react"

export function SidePanel({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
  // We don't hide overflow because we want to allow typing in the main form
  
  if (!isOpen) return null

  return (
    <div className="fixed top-0 right-0 h-screen w-[40%] bg-slate-900 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] border-l border-slate-700 z-50 animate-in slide-in-from-right duration-300 no-print flex flex-col">
      <div className="flex items-center justify-between p-6 border-b border-white/10 bg-slate-800/50 backdrop-blur-md">
        <h2 className="text-xl font-semibold tracking-tight text-white">{title}</h2>
        <button title="Close panel" aria-label="Close panel" onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
