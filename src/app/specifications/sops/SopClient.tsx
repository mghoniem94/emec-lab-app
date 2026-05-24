"use client"

import { useState } from "react"
import { BookOpen, Plus, Save, Trash2, ExternalLink } from "lucide-react"
import { saveTestSop, deleteTestSop } from "@/app/actions"
import { Modal } from "@/components/ui/Modal"

type SOP = { id: number, methodName: string, description: string, documentUrl: string | null }

export default function SopClient({ initialData }: { initialData: SOP[] }) {
  const [sops, setSops] = useState<SOP[]>(initialData)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [methodName, setMethodName] = useState("")
  const [description, setDescription] = useState("")
  const [documentUrl, setDocumentUrl] = useState("")

  const openNewModal = () => {
    setMethodName("")
    setDescription("")
    setDocumentUrl("")
    setIsModalOpen(true)
  }

  const openEditModal = (sop: SOP) => {
    setMethodName(sop.methodName)
    setDescription(sop.description)
    setDocumentUrl(sop.documentUrl || "")
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this SOP?")) {
      await deleteTestSop(id)
      setSops(sops.filter(s => s.id !== id))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await saveTestSop(methodName, description, documentUrl)
      // Optimistic or simple reload since it's an admin screen
      window.location.reload()
    } catch (err) {
      console.error(err)
      alert("Failed to save SOP.")
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-purple-500" />
            Standard Operating Procedures
          </h1>
          <p className="text-slate-400">Manage definitions and documents for Test Methods.</p>
        </div>
        <button 
          onClick={openNewModal}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> Add SOP
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 mt-8">
        {sops.map(sop => (
          <div key={sop.id} className="glass-card rounded-2xl p-6 border border-slate-700/50 hover:border-purple-500/30 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-white tracking-tight">{sop.methodName}</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => openEditModal(sop)}
                  className="px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(sop.id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  title="Delete SOP"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <p className="text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-900/50 p-4 rounded-xl border border-slate-800">
              {sop.description}
            </p>

            {sop.documentUrl && (
              <div className="mt-4">
                <a 
                  href={sop.documentUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-medium text-sm transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> View Linked Document
                </a>
              </div>
            )}
          </div>
        ))}

        {sops.length === 0 && (
          <div className="py-12 text-center border-2 border-dashed border-slate-700/50 rounded-2xl">
            <p className="text-slate-400">No Standard Operating Procedures defined yet.</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Manage SOP">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-sm text-slate-400 font-medium">Test Method Name *</label>
            <input 
              required 
              value={methodName}
              onChange={e => setMethodName(e.target.value)}
              type="text" 
              placeholder="e.g. API 13A" 
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-purple-500" 
            />
            <p className="text-xs text-slate-500 pt-1">This must exactly match the text used in the Specification parameters.</p>
          </div>
          
          <div className="space-y-1">
            <label className="text-sm text-slate-400 font-medium">Description / Instructions *</label>
            <textarea 
              required 
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={6}
              placeholder="Enter standard procedure..." 
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-purple-500 resize-none" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-slate-400 font-medium">Document URL Link (Optional)</label>
            <input 
              value={documentUrl}
              onChange={e => setDocumentUrl(e.target.value)}
              type="url" 
              placeholder="https://intranet.emec.com/docs/api13a.pdf" 
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-purple-500" 
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-slate-300 hover:text-white transition-colors font-medium">
              Cancel
            </button>
            <button disabled={isSubmitting} type="submit" className="px-6 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-500 transition-colors shadow-lg disabled:opacity-50">
              {isSubmitting ? "Saving..." : "Save SOP"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
