"use client"

import { useState } from "react"
import { MaterialLog } from "@/generated/prisma"
import { format } from "date-fns"
import { Search, Plus, Printer, Trash2, FileText, Pencil } from "lucide-react"
import Link from "next/link"
import { Modal } from "@/components/ui/Modal"
import { SearchableSelect } from "@/components/ui/SearchableSelect"
import { TEST_BY_PERSONNEL, SUPPLIER_LIST } from "@/app/lists/config"
import { createMaterialLog, updateMaterialLog, deleteMaterialLogs, getProductSpecificationByMaterial } from "./actions"


export default function DashboardClient({ 
  initialData, 
  suppliers = [], 
  emecProducts = [] 
}: { 
  initialData: MaterialLog[], 
  suppliers?: string[], 
  emecProducts?: string[] 
}) {
  const [data, setData] = useState<MaterialLog[]>(initialData)
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isPrintMode, setIsPrintMode] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingLog, setEditingLog] = useState<MaterialLog | null>(null)
  const [formType, setFormType] = useState<"STR" | "MTR">("STR")

  // Form State for dynamic specifications loading
  const [materialName, setMaterialName] = useState("")
  const [equiEmecProduct, setEquiEmecProduct] = useState("")
  const [supplier, setSupplier] = useState("")
  const [testBy, setTestBy] = useState("")
  const [isFetchingSpec, setIsFetchingSpec] = useState(false)
  const [specStatus, setSpecStatus] = useState<"idle" | "loading" | "loaded" | "not_found">("idle")

  const handleProductChange = async (productName: string) => {
    setEquiEmecProduct(productName)
    if (!productName.trim()) {
      setSpecStatus("idle")
      return
    }
    setIsFetchingSpec(true)
    setSpecStatus("loading")
    try {
      const res = await fetch(`/api/product-specs?name=${encodeURIComponent(productName.trim())}`);
      if (res.ok) {
        await res.json()
        setSpecStatus("loaded")
      } else {
        setSpecStatus("not_found")
      }
    } catch (error) {
      console.error('Failed to fetch product specifications:', error);
      setSpecStatus("not_found")
    } finally {
      setIsFetchingSpec(false)
    }
  }

  // Filter logic
  const filteredData = data.filter(item => 
    item.materialName.toLowerCase().includes(search.toLowerCase()) ||
    item.reportNo.toLowerCase().includes(search.toLowerCase()) ||
    item.batchNoRef.toLowerCase().includes(search.toLowerCase())
  )

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      if (newSelected.size < 4) {
        newSelected.add(id)
      } else {
        alert("You can only select up to 4 items for a single A4 print page.")
      }
    }
    setSelectedIds(newSelected)
  }

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete selected items?")) {
      await deleteMaterialLogs(Array.from(selectedIds))
      setData(data.filter(d => !selectedIds.has(d.id)))
      setSelectedIds(new Set())
    }
  }

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    try {
      if (editingLog) {
        const updatedLog = await updateMaterialLog(editingLog.id, formData)
        setData(data.map(d => d.id === editingLog.id ? updatedLog : d))
      } else {
        const newLog = await createMaterialLog(formData)
        setData([newLog, ...data])
      }
      setIsAddModalOpen(false)
      setEditingLog(null)
    } catch (err) {
      console.error(err)
      alert("Failed to create log. Please check your inputs.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isPrintMode) {
    const selectedItems = data.filter(d => selectedIds.has(d.id))
    return (
      <div className="print-only bg-white text-black min-h-screen w-full p-4 box-border">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page {
              size: A4 portrait;
              margin: 10mm !important;
            }

            /* === GLOBAL RESETS FOR LABEL PRINT === */
            html, body {
              background: #ffffff !important;
              height: auto !important;
              max-height: none !important;
              overflow: visible !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            /* Override the aggressive global print rule that stretches all divs */
            .print-only div,
            .print-only table {
              width: auto !important;
              max-width: none !important;
            }

            /* Hide non-print UI elements */
            .no-print, nav, sidebar {
              display: none !important;
            }

            /* === 1. FORCE STRICT VERTICAL LAYOUT === */
            .labels-print-container,
            div[class*='grid'] {
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              gap: 8mm !important;
              width: 100% !important;
              max-width: 100% !important;
            }

            /* === 2. RIGID LABEL CARD DIMENSIONS === */
            .material-label-card {
              width: 120mm !important;
              min-width: 120mm !important;
              max-width: 120mm !important;
              height: 60mm !important;
              min-height: 60mm !important;
              max-height: 60mm !important;
              border: 2px solid #000000 !important;
              padding: 4mm !important;
              box-sizing: border-box !important;
              position: relative !important;
              background: #ffffff !important;
              page-break-inside: avoid !important;
              overflow: hidden !important;
              margin: 0 !important;
              flex-shrink: 0 !important;
              flex-grow: 0 !important;
            }

            /* === 3. LEFT SIDE METADATA COLUMN === */
            .label-meta-list {
              position: absolute !important;
              top: 4mm !important;
              left: 4mm !important;
              max-width: 70mm !important;
              width: auto !important;
              display: flex !important;
              flex-direction: column !important;
              gap: 1.8mm !important;
              text-align: left !important;
            }

            .label-meta-list span {
              font-size: 9pt !important;
              line-height: 1.3 !important;
              display: block !important;
              white-space: nowrap !important;
              width: auto !important;
            }

            .label-meta-list .material-title-row {
              font-size: 13pt !important;
              font-weight: bold !important;
              margin-bottom: 1mm !important;
            }

            /* === 4. TOP-RIGHT COMPACT HAZARD BOX === */
            .compact-hazard-box {
              position: absolute !important;
              top: 4mm !important;
              right: 4mm !important;
              left: auto !important;
              width: 32mm !important;
              min-width: 32mm !important;
              max-width: 32mm !important;
              height: 24mm !important;
              min-height: 24mm !important;
              max-height: 24mm !important;
              border: 1px solid #000000 !important;
              border-radius: 4px !important;
              padding: 3px !important;
              background: #ffffff !important;
              box-sizing: border-box !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              z-index: 20 !important;
            }

            .compact-hazard-box span {
              width: auto !important;
            }

            .compact-hazard-box div {
              font-size: 7.5pt !important;
              font-weight: bold !important;
              display: flex !important;
              justify-content: space-between !important;
              width: 100% !important;
              max-width: 100% !important;
            }

            /* === 5. BOTTOM CENTER EMEC FOOTER === */
            .label-internal-footer {
              position: absolute !important;
              bottom: 2.5mm !important;
              left: 4mm !important;
              right: 4mm !important;
              width: auto !important;
              text-align: center !important;
              font-size: 8.5pt !important;
              font-weight: bold !important;
              border-top: 1px dotted #000000 !important;
              padding-top: 1mm !important;
              text-transform: uppercase !important;
            }

            /* === 6. PREVENT GLOBAL CSS TABLE RULES BLEEDING IN === */
            .material-label-card th,
            .material-label-card td {
              border: none !important;
              padding: 0 !important;
            }

            /* === 7. COMPANY LOGO INSIDE EACH LABEL === */
            .label-company-logo {
              height: 6mm !important;
              width: auto !important;
              max-width: 30mm !important;
              margin-bottom: 2mm !important;
              display: block !important;
            }
          }
        ` }} />
        
        <div className="labels-print-container mx-auto">
          {selectedItems.map(item => (
            <div key={item.id} className="material-label-card">
              {/* Left-Side Metadata Column Flow */}
              <div className="label-meta-list">
                {/* Company Logo */}
                <img 
                  src="/company.logo - Label.png" 
                  alt="EMEC Logo" 
                  className="label-company-logo"
                />
                {/* Row 1: Material Name */}
                <span className="material-title-row uppercase tracking-tight text-gray-900 truncate">
                  {item.materialName}
                </span>
                {/* Row 2: Batch Number */}
                <span>
                  <strong className="font-bold text-gray-700">Batch No / Ref: </strong>
                  {item.batchNoRef}
                </span>
                {/* Row 3: Supplier */}
                <span>
                  <strong className="font-bold text-gray-700">Supplier: </strong>
                  {item.supplier}
                </span>
                {/* Row 5: STR/MTR No */}
                <span>
                  <strong className="font-bold text-gray-700">
                    {item.type === 'MTR' ? 'MTR No: ' : 'STR No: '}
                  </strong>
                  {item.mtrStrNo}
                </span>
                {/* Row 6: Received Date (standalone) */}
                <span>
                  <strong className="font-bold text-gray-700">Received Date: </strong>
                  {format(new Date(item.receivedDate), "MMM dd, yyyy")}
                </span>
              </div>
              
              {/* Absolute Top-Right Anchor for Hazard Ratings */}
              <div className="compact-hazard-box">
                <span className="text-[7.5px] font-black text-gray-500 uppercase tracking-wider text-center border-b border-gray-200 pb-0.5 mb-0.5 block">
                  HAZARD RATINGS
                </span>
                <div className="flex justify-between items-center text-blue-600 px-0.5">
                  <span>HEALTH:</span>
                  <span className="bg-blue-50 px-1 py-0.2 rounded border border-blue-200 font-extrabold">{item.hazardHealth}</span>
                </div>
                <div className="flex justify-between items-center text-red-600 px-0.5">
                  <span>FLAMMABILITY:</span>
                  <span className="bg-red-50 px-1 py-0.2 rounded border border-red-200 font-extrabold">{item.hazardFlammability}</span>
                </div>
                <div className="flex justify-between items-center text-amber-600 px-0.5">
                  <span>INSTABILITY:</span>
                  <span className="bg-amber-50 px-1 py-0.2 rounded border border-amber-200 font-extrabold">{item.hazardInstability}</span>
                </div>
              </div>
              
              {/* Absolute Bottom Center Anchor for EMEC CENTRAL LAB */}
              <div className="label-internal-footer">
                EMEC CENTRAL LAB
              </div>
            </div>
          ))}
        </div>
        
        {/* Print Controls - hidden when actually printing */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 no-print glass-card p-4 rounded-full flex gap-4 bg-slate-900/90 shadow-2xl border border-white/10">
          <button 
            onClick={() => window.print()}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-full font-medium hover:bg-blue-600 transition-colors shadow-lg flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print Labels
          </button>
          <button 
            onClick={() => setIsPrintMode(false)}
            className="px-6 py-2 bg-slate-700 text-white rounded-full font-medium hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 no-print">
      <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <label htmlFor="search" className="sr-only">Search</label>
          <input 
            id="search"
            type="text" 
            placeholder="Search materials..." 
            title="Search logs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="w-full md:w-auto px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> New Entry
        </button>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 border-b border-slate-700">
              <tr>
                <th className="px-6 py-4">Select</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Material</th>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4">Batch No</th>
                <th className="px-6 py-4">Result</th>
                <th className="px-6 py-4">Received</th>
                <th className="px-6 py-4 text-right w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                    No material logs found.
                  </td>
                </tr>
              ) : (
                filteredData.map(item => (
                  <tr key={item.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <label htmlFor={`select-${item.id}`} className="sr-only">Select row</label>
                        <input 
                          id={`select-${item.id}`}
                          type="checkbox" 
                          title="Select row"
                          checked={selectedIds.has(item.id)}
                          onChange={() => toggleSelect(item.id)}
                          className="w-4 h-4 text-primary bg-slate-700 border-slate-600 rounded focus:ring-primary focus:ring-2 cursor-pointer"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-400">{item.type}</td>
                    <td className="px-6 py-4 font-medium text-white">{item.materialName}</td>
                    <td className="px-6 py-4 text-slate-400">{item.supplier}</td>
                    <td className="px-6 py-4 text-slate-400">{item.batchNoRef}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${
                        item.testResult === 'Pass' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                        item.testResult === 'Fail' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {item.testResult}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{format(new Date(item.receivedDate), "dd MMM yyyy")}</td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingLog(item)
                          setFormType(item.type as "STR" | "MTR")
                          setMaterialName(item.materialName)
                          setEquiEmecProduct(item.equiEmecProduct)
                          setSupplier(item.supplier)
                          setTestBy(item.testBy)
                          setSpecStatus(item.equiEmecProduct ? "loaded" : "idle")
                          setIsAddModalOpen(true)
                        }}
                        className="inline-flex items-center justify-center w-8 h-8 bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white border border-slate-600 rounded-lg transition-colors"
                        title="Edit Entry"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <Link 
                        href={`/report/${item.id}`}
                        className="inline-flex items-center justify-center w-8 h-8 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 border border-blue-500/20 rounded-lg transition-colors"
                        title="Open Report"
                      >
                        <FileText className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 glass-card border border-primary/30 px-6 py-4 rounded-full flex items-center gap-6 shadow-2xl shadow-primary/20 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="text-white font-medium">
            <span className="text-primary font-bold">{selectedIds.size}</span> / 4 Selected
          </div>
          <div className="h-6 w-px bg-slate-700"></div>
          <button 
            onClick={() => setIsPrintMode(true)}
            className="flex items-center gap-2 text-primary font-medium hover:text-blue-400 transition-colors"
          >
            <Printer className="w-5 h-5" /> Generate Labels
          </button>
          <div className="h-6 w-px bg-slate-700"></div>
          <button 
            onClick={handleDelete}
            className="flex items-center gap-2 text-red-400 font-medium hover:text-red-300 transition-colors"
          >
            <Trash2 className="w-5 h-5" /> Delete
          </button>
        </div>
      )}

      {/* Add Modal Form */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => {
          setIsAddModalOpen(false)
          setEditingLog(null)
          setMaterialName("")
          setFormType("STR")
          setEquiEmecProduct("")
          setSupplier("")
          setTestBy("")
          setSpecStatus("idle")
        }} 
        title={editingLog ? "Edit Material Log" : "Add Material Log"}
      >
        <form onSubmit={handleAddSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="materialName" className="text-sm text-slate-400 font-medium">Material Name *</label>
              <input 
                id="materialName" 
                required 
                name="materialName" 
                type="text" 
                title="Material Name" 
                placeholder="Enter material name" 
                value={materialName}
                onChange={e => setMaterialName(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-primary" 
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label htmlFor="equiEmecProduct" className="text-sm text-slate-400 font-medium">Equi. EMEC Product *</label>
                {isFetchingSpec && <span className="text-xs text-blue-400 animate-pulse">Fetching specs...</span>}
                {!isFetchingSpec && specStatus === "loaded" && <span className="text-xs text-emerald-400">Specs loaded ✓</span>}
                {!isFetchingSpec && specStatus === "not_found" && <span className="text-xs text-amber-500">No specs found</span>}
              </div>
              <SearchableSelect 
                id="equiEmecProduct"
                name="equiEmecProduct"
                options={emecProducts}
                value={equiEmecProduct}
                onChange={(val) => {
                  setEquiEmecProduct(val)
                  if (!val.trim()) {
                    setSpecStatus("idle")
                  } else {
                    handleProductChange(val)
                  }
                }}
                placeholder="Search or enter product"
                required
                title="Equi. EMEC Product"
              />
            </div>
            
            <div className="space-y-1">
              <label htmlFor="type" className="text-sm text-slate-400 font-medium">Type *</label>
              <select id="type" required name="type" value={formType} onChange={e => setFormType(e.target.value as "STR" | "MTR")} title="Type" className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-primary appearance-none">
                <option value="STR">STR</option>
                <option value="MTR">MTR</option>
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="supplier" className="text-sm text-slate-400 font-medium">Supplier *</label>
              <SearchableSelect 
                id="supplier"
                name="supplier"
                options={SUPPLIER_LIST}
                value={supplier}
                onChange={setSupplier}
                placeholder="Search or enter supplier"
                required
                title="Supplier"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="batchNoRef" className="text-sm text-slate-400 font-medium">Batch No / Ref *</label>
              <input id="batchNoRef" required name="batchNoRef" type="text" defaultValue={editingLog?.batchNoRef || ""} title="Batch No" placeholder="Enter batch no" className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-primary" />
            </div>
            <div className="space-y-1">
              <label htmlFor="mtrStrNo" className="text-sm text-slate-400 font-medium">{formType === 'MTR' ? 'MTR No' : 'STR No'}</label>
              <input id="mtrStrNo" name="mtrStrNo" type="text" defaultValue={editingLog?.mtrStrNo || ""} title="MTR/STR No" placeholder={`Enter ${formType === 'MTR' ? 'MTR' : 'STR'} No`} className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-primary" />
            </div>

            <div className="space-y-1">
              <label htmlFor="receivedDate" className="text-sm text-slate-400 font-medium">Received Date *</label>
              <input id="receivedDate" required name="receivedDate" type="date" defaultValue={editingLog ? format(new Date(editingLog.receivedDate), "yyyy-MM-dd") : ""} title="Received Date" placeholder="YYYY-MM-DD" className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-primary [color-scheme:dark]" />
            </div>
            <div className="space-y-1">
              <label htmlFor="reportDate" className="text-sm text-slate-400 font-medium">Report Date *</label>
              <input id="reportDate" required name="reportDate" type="date" defaultValue={editingLog ? format(new Date(editingLog.reportDate), "yyyy-MM-dd") : ""} title="Report Date" placeholder="YYYY-MM-DD" className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-primary [color-scheme:dark]" />
            </div>
            
            <div className="space-y-1">
              <label htmlFor="testBy" className="text-sm text-slate-400 font-medium">Tested By *</label>
              <SearchableSelect 
                id="testBy"
                name="testBy"
                options={TEST_BY_PERSONNEL}
                value={testBy}
                onChange={setTestBy}
                placeholder="Search personnel"
                required
                title="Tested By"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="testResult" className="text-sm text-slate-400 font-medium">Test Result *</label>
              <select id="testResult" required name="testResult" defaultValue={editingLog?.testResult || "Under Testing"} title="Test Result" className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-primary appearance-none">
                <option value="Pass">Pass</option>
                <option value="Fail">Fail</option>
                <option value="Under Testing">Under Testing</option>
              </select>
            </div>
          </div>



          <div className="pt-6 flex justify-end gap-3">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2 text-slate-300 hover:text-white transition-colors font-medium">
              Cancel
            </button>
            <button disabled={isSubmitting} type="submit" className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-blue-600 transition-colors shadow-lg disabled:opacity-50 flex items-center gap-2">
              {isSubmitting ? "Saving..." : "Save Record"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
