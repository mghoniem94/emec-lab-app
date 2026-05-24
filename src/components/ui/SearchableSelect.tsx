"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Search } from "lucide-react"

interface SearchableSelectProps {
  id: string
  name: string
  options: string[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  title?: string
}

export function SearchableSelect({ 
  id, 
  name, 
  options, 
  value, 
  onChange, 
  placeholder, 
  required,
  title
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Filtering options
  const filteredOptions = options.filter(option => 
    option.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handle outside clicks
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={wrapperRef} className="relative w-full">
      {/* Hidden input ensures native form submission captures the value */}
      <input type="hidden" id={id} name={name} value={value} required={required} />
      
      <div 
        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2 px-3 text-white focus-within:border-primary flex items-center cursor-pointer transition-colors"
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) setSearchTerm("") // Reset search on open to show all options
        }}
        title={title}
      >
        <div className="flex-1 truncate">
          {value ? value : <span className="text-slate-500">{placeholder || "Select..."}</span>}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-2 border-b border-slate-700 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
              placeholder="Search or type custom..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value)
                onChange(e.target.value) // Sync custom input to form value directly
              }}
              autoFocus
            />
          </div>
          <ul className="max-h-60 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-500 text-center italic">
                {searchTerm ? "Custom value active" : "No options found"}
              </li>
            ) : (
              filteredOptions.map((option, i) => (
                <li 
                  key={i}
                  className="px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 cursor-pointer"
                  onClick={() => {
                    onChange(option)
                    setIsOpen(false)
                  }}
                >
                  {option}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
