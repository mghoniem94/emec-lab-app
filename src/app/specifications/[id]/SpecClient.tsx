"use client"

import { useState } from "react"
import { ArrowLeft, Save, Plus, Trash2, BookOpen, ExternalLink, FileText, Upload, X, Settings2 } from "lucide-react"
import Link from "next/link"
import { saveProductSpecification } from "@/app/actions"
import { useRouter } from "next/navigation"
import { Modal } from "@/components/ui/Modal"
import { SidePanel } from "@/components/ui/SidePanel"

type SpecData = any 
type SOP = { id: number, methodName: string, description: string, documentUrl: string | null }

export default function SpecClient({ initialData, sops }: { initialData: SpecData, sops: SOP[] }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [parameters, setParameters] = useState(() => {
    return initialData.parameters.map((p: any) => ({
      parameterName: p.parameterName,
      requirement: p.requirement,
      testMethod: p.testMethod,
      order: p.order
    }))
  })

  const [masterSopPath, setMasterSopPath] = useState<string>(initialData.masterSopPath || "")
  const [isMasterUploading, setIsMasterUploading] = useState(false)

  // PDF Preview State
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null)
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false)
  const [isUploading, setIsUploading] = useState<number | null>(null)

  const handlePdfPreview = (url: string) => {
    setPreviewPdfUrl(url)
    setIsPdfModalOpen(true)
  }

  const handleMasterFileUpload = async (file: File) => {
    if (!file) return
    setIsMasterUploading(true)
    
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      })
      const data = await res.json()
      if (data.path) {
        setMasterSopPath(data.path)
      } else {
        alert("Upload failed")
      }
    } catch (e) {
      console.error(e)
      alert("Error uploading file")
    } finally {
      setIsMasterUploading(false)
    }
  }

  const [hazards, setHazards] = useState({
    hazardHealth: initialData.hazardHealth || 0,
    hazardFlammability: initialData.hazardFlammability || 0,
    hazardInstability: initialData.hazardInstability || 0,
  })

  // SOP Modal state
  const [selectedSop, setSelectedSop] = useState<SOP | null>(null)
  const [isSopModalOpen, setIsSopModalOpen] = useState(false)

  const handleOpenSop = (methodName: string) => {
    const sop = sops.find(s => s.methodName.toLowerCase() === methodName.toLowerCase().trim())
    if (sop) {
      setSelectedSop(sop)
      setIsSopModalOpen(true)
    }
  }

  const handleChange = (index: number, field: string, value: string) => {
    const newParams = [...parameters]
    newParams[index][field] = value
    setParameters(newParams)
  }

  const handleAdd = () => {
    setParameters([
      ...parameters,
      { parameterName: "", requirement: "", testMethod: "", order: parameters.length + 1 }
    ])
  }

  const handleRemove = (index: number) => {
    const newParams = [...parameters]
    newParams.splice(index, 1)
    // Re-order
    newParams.forEach((p, i) => p.order = i + 1)
    setParameters(newParams)
  }

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      const validParams = parameters.filter((p: any) => p.parameterName.trim() !== "")
      await saveProductSpecification(initialData.materialName, validParams, hazards, masterSopPath)
      alert("Specification saved successfully!")
      router.refresh()
    } catch (err) {
      console.error(err)
      alert("Failed to save specification.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full px-6 pb-24 relative">
      
      {/* Header Actions & Compact Info */}
      <div className="flex items-center justify-between bg-slate-800/20 backdrop-blur-md p-4 rounded-2xl border border-white/5 sticky top-0 z-30">
        <div className="flex items-center gap-6">
          <Link href="/specifications" className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight leading-none mb-1">{initialData.materialName}</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Master Specification</p>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={isSubmitting}
          className="px-5 py-2 bg-primary hover:bg-blue-600 text-primary-foreground rounded-xl font-medium shadow-lg shadow-primary/20 transition-colors flex items-center gap-2 disabled:opacity-50 text-sm"
        >
          <Save className="w-4 h-4" /> {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="glass-card rounded-2xl p-6 border border-white/5 bg-slate-800/20">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Left: Hazard Ratings */}
          <div className="xl:col-span-2 space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <Settings2 className="w-4 h-4 text-blue-400" />
              </div>
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Hazard Configuration</h2>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">Health</label>
                <input 
                  type="number" min="0" max="4"
                  title="Health Hazard"
                  placeholder="0"
                  value={hazards.hazardHealth}
                  onChange={e => setHazards({...hazards, hazardHealth: parseInt(e.target.value) || 0})}
                  className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 px-4 text-white font-black text-xl text-center focus:outline-none focus:border-blue-500/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-red-400 uppercase tracking-widest block">Flammability</label>
                <input 
                  type="number" min="0" max="4"
                  title="Flammability Hazard"
                  placeholder="0"
                  value={hazards.hazardFlammability}
                  onChange={e => setHazards({...hazards, hazardFlammability: parseInt(e.target.value) || 0})}
                  className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 px-4 text-white font-black text-xl text-center focus:outline-none focus:border-red-500/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-yellow-400 uppercase tracking-widest block">Instability</label>
                <input 
                  type="number" min="0" max="4"
                  title="Instability Hazard"
                  placeholder="0"
                  value={hazards.hazardInstability}
                  onChange={e => setHazards({...hazards, hazardInstability: parseInt(e.target.value) || 0})}
                  className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 px-4 text-white font-black text-xl text-center focus:outline-none focus:border-yellow-500/50 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Right: Master SOP */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <FileText className="w-4 h-4 text-emerald-400" />
              </div>
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Master SOP</h2>
            </div>

            <div className="h-[92px] flex flex-col justify-center">
              {masterSopPath ? (
                <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl px-5 py-4">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <FileText className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest leading-none mb-1">Attached PDF</p>
                    <p className="text-xs text-white truncate font-medium">{masterSopPath.split('-').pop()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handlePdfPreview(masterSopPath)}
                      className="p-2 text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-all"
                      title="Preview SOP"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setMasterSopPath("")}
                      className="p-2 text-slate-500 hover:text-red-400 transition-all"
                      title="Remove"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <input 
                    type="file"
                    accept=".pdf"
                    onChange={(e) => e.target.files?.[0] && handleMasterFileUpload(e.target.files[0])}
                    className="hidden"
                    id="master-sop-upload"
                  />
                  <label 
                    htmlFor="master-sop-upload"
                    className="flex flex-col items-center justify-center gap-2 py-4 px-6 bg-slate-900/50 border-2 border-white/5 border-dashed rounded-2xl text-xs font-bold text-slate-500 hover:text-slate-300 hover:border-white/10 cursor-pointer transition-all group"
                  >
                    <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    {isMasterUploading ? "UPLOADING..." : "UPLOAD MASTER SOP"}
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

        <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/80 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-300 w-[30%]">Parameter</th>
                <th className="px-4 py-3 font-semibold text-slate-300 w-[20%]">Requirement</th>
                <th className="px-4 py-3 font-semibold text-slate-300 w-[30%]">Test Method & SOP</th>
                <th className="px-4 py-3 font-semibold text-slate-300 w-[20%] text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {parameters.map((param: any, index: number) => (
                <tr key={index} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-2">
                    <input 
                      type="text"
                      value={param.parameterName}
                      onChange={(e) => handleChange(index, "parameterName", e.target.value)}
                      placeholder="e.g. Specific Gravity"
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:border-primary/50"
                    />
                  </td>
                  <td className="p-2">
                    <input 
                      type="text"
                      value={param.requirement}
                      onChange={(e) => handleChange(index, "requirement", e.target.value)}
                      placeholder="e.g. Min 4.20"
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:border-primary/50"
                    />
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-1">
                      <input 
                        type="text"
                        value={param.testMethod}
                        onChange={(e) => handleChange(index, "testMethod", e.target.value)}
                        placeholder="e.g. API 13A"
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:border-primary/50"
                      />
                      {masterSopPath && (
                        <button 
                          onClick={() => handlePdfPreview(masterSopPath)}
                          className="p-1.5 text-emerald-400 hover:bg-emerald-400/20 rounded-lg transition-colors flex-shrink-0 border border-emerald-500/30"
                          title="View Master SOP"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                      {param.testMethod && sops.some(s => s.methodName.toLowerCase() === param.testMethod.toLowerCase().trim()) && (
                        <button 
                          onClick={() => handleOpenSop(param.testMethod)}
                          className="p-1.5 text-purple-400 hover:bg-purple-400/20 rounded-lg transition-colors flex-shrink-0 border border-purple-500/30"
                          title="View Method SOP"
                        >
                          <BookOpen className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="p-2 text-center">
                    <button 
                      onClick={() => handleRemove(index)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="Remove Parameter"
                    >
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </td>
                </tr>
              ))}
              {parameters.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-500 italic">
                    No parameters defined. Click "Add Parameter" to start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="p-4 bg-slate-800/20 border-t border-slate-700/50 flex justify-center">
            <button 
              onClick={handleAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors border border-slate-700"
            >
              <Plus className="w-4 h-4" /> Add Parameter
            </button>
          </div>
        </div>

      {/* SOP Modal */}
      <Modal isOpen={isSopModalOpen} onClose={() => setIsSopModalOpen(false)} title="Standard Operating Procedure">
        {selectedSop && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-500" />
                {selectedSop?.methodName}
              </h3>
              <p className="text-slate-400 text-sm">Official Testing Procedure</p>
            </div>
            
            <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 max-h-[60vh] overflow-y-auto">
              <p className="text-slate-200 whitespace-pre-wrap leading-relaxed text-sm">
                {selectedSop?.description}
              </p>
            </div>

            {selectedSop?.documentUrl && (
              <div className="pt-4 border-t border-slate-700">
                <a 
                  href={selectedSop?.documentUrl || undefined} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg font-medium transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> Open Full Document
                </a>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button onClick={() => setIsSopModalOpen(false)} className="px-5 py-2 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-colors">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* PDF Viewer Side Panel */}
      <SidePanel isOpen={isPdfModalOpen} onClose={() => setIsPdfModalOpen(false)} title="Master SOP Viewer">
        <div className="h-full w-full bg-slate-900 flex flex-col">
          {previewPdfUrl ? (
            <iframe 
              src={`${previewPdfUrl}#toolbar=0&navpanes=0`} 
              className="w-full h-full border-none"
              title="Master SOP Viewer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500">
              No PDF loaded
            </div>
          )}
          <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex justify-end">
            <button 
              onClick={() => setIsPdfModalOpen(false)} 
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors border border-slate-700 text-sm"
            >
              Close Viewer
            </button>
          </div>
        </div>
      </SidePanel>
    </div>
  )
}
