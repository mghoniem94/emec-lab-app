"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Modal } from "@/components/ui/Modal"
import { useRouter } from "next/navigation"
import { saveProductSpecification } from "@/app/actions"

export function NewSpecModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    const materialName = formData.get("materialName") as string
    
    try {
      const newSpec = await saveProductSpecification(materialName, [])
      setIsOpen(false)
      router.push(`/specifications/${newSpec.id}`)
    } catch (err) {
      console.error(err)
      alert("Failed to create specification. It might already exist.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" /> New Product
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add Product Specification">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label htmlFor="materialName" className="text-sm text-slate-400 font-medium">Material Name *</label>
            <input 
              id="materialName" 
              required 
              name="materialName" 
              type="text" 
              placeholder="e.g. Barite, Bentonite, Soltex" 
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-primary" 
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsOpen(false)} className="px-5 py-2 text-slate-300 hover:text-white transition-colors font-medium">
              Cancel
            </button>
            <button disabled={isSubmitting} type="submit" className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-blue-600 transition-colors shadow-lg disabled:opacity-50">
              {isSubmitting ? "Creating..." : "Create Spec"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
