"use client"

import { X } from "lucide-react"
import { useEffect } from "react"

export function Modal({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm transition-opacity no-print">
      <div className="glass-card w-full max-w-2xl max-h-[92vh] rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-700/80 overflow-hidden flex flex-col">
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 sm:p-6 border-b border-white/10 bg-[#1e293b]/95 backdrop-blur-md">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white truncate pr-2">{title}</h2>
          <button title="Close modal" aria-label="Close modal" onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(92vh-70px)]">
          {children}
        </div>
      </div>
    </div>
  )
}
