"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, ArrowRight, Settings2 } from "lucide-react"
import { NewSpecModal } from "./NewSpecModal"

interface SpecWithParameters {
  id: number
  materialName: string
  parameters: {
    id: number
    specificationId: number
    parameterName: string
    requirement: string
    testMethod: string
    order: number
  }[]
  masterSopPath?: string | null
  hazardHealth?: number
  hazardFlammability?: number
  hazardInstability?: number
  createdAt?: Date
  updatedAt?: Date
}

interface SpecificationsListProps {
  initialSpecs: SpecWithParameters[]
}

export function SpecificationsList({ initialSpecs }: SpecificationsListProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredSpecs = initialSpecs.filter(spec =>
    spec.materialName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
            <Settings2 className="w-8 h-8 text-blue-500" />
            Product Specifications
          </h1>
          <p className="text-slate-400">Master data for chemical testing parameters and requirements.</p>
        </div>
        
        {/* Search & Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search chemical specifications..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <NewSpecModal />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSpecs.map(spec => (
          <Link 
            key={spec.id} 
            href={`/specifications/${spec.id}`}
            className="glass-card rounded-2xl p-6 group hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10 flex flex-col justify-between min-h-[160px]"
          >
            <div>
              <h2 className="text-xl font-bold text-white uppercase tracking-tight mb-2 group-hover:text-blue-400 transition-colors">
                {spec.materialName}
              </h2>
              <p className="text-slate-400 text-sm">
                {spec.parameters.length} Test Parameter{spec.parameters.length !== 1 && 's'}
              </p>
            </div>
            <div className="flex items-center text-blue-500 text-sm font-medium mt-4 group-hover:translate-x-1 transition-transform">
              Edit Specification <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>
        ))}

        {filteredSpecs.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-700/50 rounded-2xl">
            <p className="text-slate-400">
              {searchQuery ? "No matching specifications found." : "No specifications defined yet. Click \"New Product\" to add one."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
