"use client"

import { useState, useEffect, useRef } from "react"
import { format } from "date-fns"
import { ArrowLeft, Save, Printer, Plus, Trash2, ShieldCheck, AlertTriangle, FileText, BookOpen, ExternalLink, Shield, Camera, Image as ImageIcon, X, Eye, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { saveMaterialReport } from "@/app/actions"
import { NFPA704Diamond } from "@/components/NFPA704Diamond"
import { Modal } from "@/components/ui/Modal"
import { SidePanel } from "@/components/ui/SidePanel"

// Simple type mapping
type TestResultData = { id?: number, testName: string, requirement: string, testMethod: string, result: string }
type LogWithReport = any 
type SOP = { id: number, methodName: string, description: string, documentUrl: string | null }

export default function ReportClient({ initialData, spec, sops }: { initialData: LogWithReport, spec: any, sops: SOP[] }) {
  const router = useRouter()
  const [isPrintMode, setIsPrintMode] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // SOP Modal state
  const [selectedSop, setSelectedSop] = useState<SOP | null>(null)
  const [isSopModalOpen, setIsSopModalOpen] = useState(false)
  
  // PDF Preview State
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null)
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false)

  // Draft Photos state
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [draftUrls, setDraftUrls] = useState<string[]>(initialData.report?.draftUrls || [])
  const [isUploadingDraft, setIsUploadingDraft] = useState(false)
  const [previewDraftUrl, setPreviewDraftUrl] = useState<string | null>(null)
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false)

  const handleOpenSop = (methodName: string) => {
    const sop = sops.find(s => s.methodName.toLowerCase() === methodName.toLowerCase().trim())
    if (sop) {
      setSelectedSop(sop)
      setIsSopModalOpen(true)
    }
  }

  const handlePdfPreview = (url: string) => {
    setPreviewPdfUrl(url)
    setIsPdfModalOpen(true)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    if (draftUrls.length + files.length > 3) {
      alert(`Maximum 3 draft photos allowed per report. Currently attached: ${draftUrls.length}.`)
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    setIsUploadingDraft(true)
    const newUrls: string[] = []

    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("bucket", "result-drafts")

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        const data = await res.json()
        if (!res.ok || data.error) {
          throw new Error(data.error || "Failed to upload image")
        }
        if (data.url || data.path) {
          newUrls.push(data.url || data.path)
        }
      }

      setDraftUrls((prev) => [...prev, ...newUrls].slice(0, 3))
    } catch (err: any) {
      console.error("Draft upload error:", err)
      alert(`Failed to upload photo: ${err.message || "Unknown error"}`)
    } finally {
      setIsUploadingDraft(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleRemoveDraft = (index: number) => {
    setDraftUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const handleOpenDraftPreview = (url: string) => {
    setPreviewDraftUrl(url)
    setIsDraftModalOpen(true)
  }

  // Initialize tests
  const [tests, setTests] = useState<TestResultData[]>(() => {
    // If report already exists, use its saved test results
    if (initialData.report?.testResults?.length) {
      return initialData.report.testResults.map((tr: any) => ({ 
        testName: tr.testName, 
        requirement: tr.requirement || "", 
        testMethod: tr.testMethod || "", 
        sopFilePath: tr.sopFilePath || "",
        result: tr.result 
      }))
    }
    // If no report, but we have a specification master data, populate from there
    if (spec?.parameters?.length) {
      return spec.parameters.map((p: any) => ({
        testName: p.parameterName,
        requirement: p.requirement,
        testMethod: p.testMethod,
        result: ""
      }))
    }
    // Otherwise empty
    return []
  })

  const [finalStatus, setFinalStatus] = useState<string>(initialData.report?.finalStatus || "Pending")
  const [comment, setComment] = useState<string>(initialData.report?.comment || "")

  // Hazard States - initialized from Spec if available (to fulfill "automatically fetch"), else from Log
  const [reportHazards, setReportHazards] = useState({
    health: spec?.hazardHealth ?? initialData.hazardHealth,
    flammability: spec?.hazardFlammability ?? initialData.hazardFlammability,
    instability: spec?.hazardInstability ?? initialData.hazardInstability,
  })

  // Auto-generate comment when status changes
  useEffect(() => {
    if (finalStatus === "Pass" || finalStatus === "Fail") {
      const conditionStr = finalStatus === "Pass" ? "meets" : "doesn't meet"
      const generatedComment = `${initialData.materialName}, Batch No. ${initialData.batchNoRef} received from ${initialData.supplier} ${conditionStr} EMEC Requirement.`
      setComment(generatedComment)
    }
  }, [finalStatus, initialData.materialName, initialData.batchNoRef, initialData.supplier])

  // Dynamic document title for PDF file naming
  useEffect(() => {
    const originalTitle = document.title
    const updateTitle = () => {
      const refNo = initialData.mtrStrNo || 'N/A'
      const mat = (initialData.materialName || '').toUpperCase()
      const sup = (initialData.supplier || '').toUpperCase()
      const batch = initialData.batchNoRef || ''
      const type = initialData.type || ''
      document.title = `${refNo} - ${mat} - ${sup} - ${batch} - ${type}`
    }

    // Set title on mount/update
    updateTitle()

    // Force title on beforeprint event
    window.addEventListener('beforeprint', updateTitle)

    // Keep title synced in case client-side router/layout resets it
    const interval = setInterval(() => {
      const refNo = initialData.mtrStrNo || 'N/A'
      const mat = (initialData.materialName || '').toUpperCase()
      const sup = (initialData.supplier || '').toUpperCase()
      const batch = initialData.batchNoRef || ''
      const type = initialData.type || ''
      const expected = `${refNo} - ${mat} - ${sup} - ${batch} - ${type}`
      if (document.title !== expected) {
        document.title = expected
      }
    }, 250)

    return () => {
      window.removeEventListener('beforeprint', updateTitle)
      clearInterval(interval)
      document.title = originalTitle
    }
  }, [initialData.mtrStrNo, initialData.materialName, initialData.supplier, initialData.batchNoRef, initialData.type])

  const handleTestChange = (index: number, field: keyof TestResultData, value: string) => {
    const newTests = [...tests]
    newTests[index][field] = value as never
    setTests(newTests)
  }

  const handleAddTest = () => {
    setTests([...tests, { testName: "", requirement: "", testMethod: "", result: "" }])
  }

  const handleRemoveTest = (index: number) => {
    const newTests = [...tests]
    newTests.splice(index, 1)
    setTests(newTests)
  }

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      await saveMaterialReport(
        initialData.id,
        finalStatus,
        comment,
        tests.filter(t => t.testName.trim() !== ""),
        {
          hazardHealth: reportHazards.health,
          hazardFlammability: reportHazards.flammability,
          hazardInstability: reportHazards.instability,
        },
        draftUrls
      )
      alert("Report saved successfully!")
      router.refresh()
    } catch (error) {
      console.error(error)
      alert("Failed to save report.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isPrintMode) {
    const selectedTester = initialData.testBy || "Mohamed Kamel";
    // Supporting both the legacy format "Name, Title" and new format "Name"
    const [rawName] = selectedTester.split(",");
    const testerName = rawName.trim() || "Mohamed Kamel";

    const titleMapping: Record<string, string> = {
      "Mohamed Kamel": "Lab. Material Evaluation Section Head",
      "Wael Hassan": "Lab. Rig-Sites Support Section Head",
      "Ahmed Fattouh": "Lab. Senior Engineer",
      "Mohamed Salama": "Lab Senior Engineer",
      "Ayman Saied": "Lab. Engineer",
      "Alaa El-Sayed": "Lab. Chemist",
      "Mohamed Ghoniem": "Lab Chemist"
    };

    const testerTitle = titleMapping[testerName] || "Lab Chemist";

    return (
      <div className="print-preview-wrapper min-h-screen bg-slate-950 text-black leading-tight flex justify-center items-start py-10 no-print-bg">
        <div className="report-screen-card report-content-wrapper report-print-wrapper text-[11pt]">
          {/* Printed Header Image Integration */}
          <img src="/EMEC-enhanced.jpg" alt="EMEC Letterhead" className="printed-header-img" />
          
          {/* Top content wrapper containing Title and Areas 1, 2, and 3 */}
          <div>
            {/* Main Document Title Centered */}
            <div className="text-center mb-4">
              <h2 className="report-title text-[12pt] font-bold uppercase tracking-widest border-y border-black py-1">MATERIAL EVALUATION REPORT</h2>
            </div>

            {/* Main report sections container to reduce excessive margins and stretching */}
            <div className="report-sections-container">
              {/* Area 1 Card (Compressed) */}
              <div className="border border-black rounded-lg p-3 bg-white section-card area-card-container">
                <h3 className="text-[11pt] font-bold mb-2 uppercase border-b border-gray-200 pb-0.5 section-title">1. Material Information</h3>
                <div className="grid grid-cols-2 gap-y-1 gap-x-6 px-1 text-[10.5pt] material-info-grid">
                  <div><span className="font-bold w-28 inline-block">Material Name:</span> <span className="uppercase">{initialData.materialName}</span></div>
                  <div><span className="font-bold w-28 inline-block">Supplier:</span> <span>{initialData.supplier}</span></div>
                  <div><span className="font-bold w-28 inline-block">Batch No / Ref:</span> <span>{initialData.batchNoRef}</span></div>
                  <div><span className="font-bold w-28 inline-block">{initialData.type === 'MTR' ? 'MTR No.:' : 'STR No.:'}</span> <span>{initialData.mtrStrNo}</span></div>
                  <div><span className="font-bold w-28 inline-block">Received Date:</span> <span>{format(new Date(initialData.receivedDate), "dd MMM yyyy")}</span></div>
                </div>
              </div>

              {/* Area 2 Card (Compressed) */}
              <div className="border border-black rounded-lg p-3 bg-white section-card area-card-container">
                <h3 className="text-[11pt] font-bold mb-2 uppercase border-b border-gray-200 pb-0.5 section-title">2. Laboratory Test Results</h3>
                <table className="report-data-table" style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
                  <colgroup>
                    <col style={{ width: '45%' }} />
                    <col style={{ width: '25%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '15%' }} />
                  </colgroup>
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black py-1 px-2 font-bold uppercase">Parameter</th>
                      <th className="border border-black py-1 px-2 font-bold uppercase">Requirement</th>
                      <th className="border border-black py-1 px-2 font-bold uppercase">Test Method</th>
                      <th className="border border-black py-1 px-2 font-bold uppercase">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tests.filter(t => t.testName.trim() !== "").length === 0 ? (
                      <tr><td colSpan={4} className="py-1 px-2 text-center italic text-gray-500 border border-black">No test results recorded.</td></tr>
                    ) : (
                      tests.filter(t => t.testName.trim() !== "").map((test, index) => (
                        <tr key={index} className="break-inside-avoid">
                          <td className="border border-black py-1 px-2 font-medium">{test.testName}</td>
                          <td className="border border-black py-1 px-2">{test.requirement || "-"}</td>
                          <td className="border border-black py-1 px-2">{test.testMethod || "-"}</td>
                          <td className="border border-black py-1 px-2 font-bold">{test.result || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Area 3 Card (Compressed) */}
              <div className="border border-black rounded-lg p-3 bg-white break-inside-avoid section-card area-card-container">
                <h3 className="text-[11pt] font-bold mb-2 uppercase border-b border-gray-200 pb-0.5 section-title">3. Conclusion</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-4 border-b border-gray-100 pb-1">
                    <span className="font-bold text-[10.5pt]">Final Status:</span>
                    <span className={`font-bold uppercase px-3 py-0.5 rounded-full border text-[10pt] ${finalStatus === 'Pass' ? 'border-green-600 text-green-700 bg-green-50' : finalStatus === 'Fail' ? 'border-red-600 text-red-700 bg-red-50' : 'border-yellow-600 text-yellow-700 bg-yellow-50'}`}>
                      {finalStatus === 'Pass' ? 'PASSED' : finalStatus === 'Fail' ? 'FAILED' : 'PENDING'}
                    </span>
                  </div>
                  <p className="leading-tight whitespace-pre-wrap text-[10.5pt]">
                    {comment || `${initialData.materialName}, Batch No. ${initialData.batchNoRef} received from ${initialData.supplier} ${finalStatus === 'Pass' ? 'meets' : 'does not meet'} EMEC Requirement.`}
                  </p>
                </div>
              </div>

              {/* Attached Results Drafts in Print View */}
              {draftUrls.length > 0 && (
                <div className="border border-black rounded-lg p-3 bg-white break-inside-avoid section-card area-card-container">
                  <h3 className="text-[11pt] font-bold mb-2 uppercase border-b border-gray-200 pb-0.5 section-title">Attached Results Drafts</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {draftUrls.map((url, idx) => (
                      <div key={idx} className="border border-gray-300 rounded p-1 text-center bg-gray-50">
                        <img src={url} alt={`Draft ${idx + 1}`} className="max-h-36 w-full object-contain mx-auto rounded" />
                        <span className="text-[8pt] font-semibold text-gray-700 block mt-1">Results Draft #{idx + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom content wrapper containing Signatures & Footer */}
          <div className="w-full">

            {/* Signatures (Compressed) & Dynamic QA/QC Footer - Pushed to the bottom by justify-between */}
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '170mm', margin: '8mm auto 0 auto' }}>
              
              {/* Tested By Section */}
              <div style={{ textAlign: 'center', width: '75mm' }}>
                <span style={{ fontWeight: 'bold', fontSize: '10pt', display: 'block' }}>
                  Tested By: {testerName}
                </span>
                <div style={{ width: '60mm', borderBottom: '1px solid #000', margin: '8mm auto 2mm auto' }}></div>
                <span style={{ fontSize: '8.5pt', color: '#333', display: 'block', fontWeight: '500' }}>
                  {testerTitle}
                </span>
              </div>

              {/* Approved By Section */}
              <div style={{ textAlign: 'center', width: '75mm' }}>
                <span style={{ fontWeight: 'bold', fontSize: '10pt', display: 'block' }}>
                  Approved By: Mohamed Galal
                </span>
                <div style={{ width: '60mm', borderBottom: '1px solid #000', margin: '8mm auto 2mm auto' }}></div>
                <span style={{ fontSize: '8.5pt', color: '#333', display: 'block', fontWeight: '500' }}>
                  Lab Manager
                </span>
              </div>

            </div>
            
            {/* Document Footer Meta Section */}
            <div className="document-footer-meta text-[9pt] font-semibold">
              <div>EMEC CENTRAL LABORATORY</div>
              <div>PAGE 1 / 1</div>
              <div>{initialData.type === 'MTR' ? 'REDFH15 / REV. 4' : 'REDFH16 / REV. 4'}</div>
            </div>
          </div>

        </div>

        {/* Floating Print Controls */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 no-print glass-card p-4 rounded-full flex gap-4 bg-slate-900 text-white shadow-2xl z-50">
          <button 
            onClick={() => {
              const refNo = initialData.mtrStrNo || 'N/A'
              const mat = (initialData.materialName || '').toUpperCase()
              const sup = (initialData.supplier || '').toUpperCase()
              const batch = initialData.batchNoRef || ''
              const type = initialData.type || ''
              document.title = `${refNo} - ${mat} - ${sup} - ${batch} - ${type}`
              window.print()
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-500 transition-colors shadow-lg flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print PDF
          </button>
          <button 
            onClick={() => setIsPrintMode(false)}
            className="px-6 py-2 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-colors"
          >
            Close Print View
          </button>
        </div>
      </div>
    )
  }

  // --- STANDARD UI VIEW ---
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full px-2 sm:px-6 pb-24 relative">
      
      {/* Header Actions & Compact Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-800/30 backdrop-blur-md p-4 rounded-2xl border border-white/5 sticky top-0 z-30 shadow-lg">
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href="/log" className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight leading-none mb-1">{initialData.materialName}</h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] font-bold text-slate-500">
              <span className="text-blue-400">REPORT NO: {initialData.reportNo}</span>
              <span className="w-1 h-1 bg-slate-700 rounded-full hidden sm:inline-block"></span>
              <span>{format(new Date(initialData.receivedDate), "dd MMM yyyy")}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Tucked NFPA Diamond */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-900/50 rounded-xl border border-white/5 shadow-inner sm:mr-2 group hover:bg-slate-900 transition-all cursor-default">
            <NFPA704Diamond 
              health={reportHazards.health} 
              flammability={reportHazards.flammability} 
              instability={reportHazards.instability} 
              className="w-8 h-8 sm:w-10 sm:h-10"
            />
            <div className="hidden group-hover:flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-blue-400 leading-none">H: {reportHazards.health}</span>
                <span className="text-[8px] font-bold text-red-400 leading-none">F: {reportHazards.flammability}</span>
                <span className="text-[8px] font-bold text-yellow-400 leading-none">I: {reportHazards.instability}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsPrintMode(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-colors border border-slate-700 flex items-center gap-1.5 text-xs sm:text-sm"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button 
              onClick={handleSave}
              disabled={isSubmitting}
              className="px-4 sm:px-5 py-2 bg-primary hover:bg-blue-600 text-primary-foreground rounded-xl font-medium shadow-lg shadow-primary/20 transition-colors flex items-center gap-1.5 disabled:opacity-50 text-xs sm:text-sm"
            >
              <Save className="w-4 h-4" /> {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Left Column: Material Info & Status & Hazard Edit */}
        <div className="xl:col-span-1 space-y-6">
          
          {/* AREA 1: Material Data */}
          <div className="glass-card rounded-2xl p-5 border border-white/5 relative overflow-hidden bg-slate-800/20">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50"></div>
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Area 1: Material Info</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Batch No</p>
                  <p className="text-sm font-semibold text-slate-200">{initialData.batchNoRef}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Supplier</p>
                  <p className="text-sm font-semibold text-slate-200">{initialData.supplier}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Received</p>
                  <p className="text-sm font-semibold text-slate-200">{format(new Date(initialData.receivedDate), "dd MMM yy")}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">{initialData.type === 'MTR' ? 'MTR No' : 'STR No'}</p>
                  <p className="text-sm font-semibold text-slate-200">{initialData.mtrStrNo || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* AREA 3: Conclusion / Comments */}
          <div className="glass-card rounded-2xl p-5 border border-white/5 relative overflow-hidden bg-slate-800/20">
             <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/50"></div>
             <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Area 3: Conclusion</h2>
            
            <div className="space-y-5">
              <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setFinalStatus("Pass")}
                  className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all ${
                    finalStatus === "Pass" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-sm" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  PASS
                </button>
                <button
                  type="button"
                  onClick={() => setFinalStatus("Fail")}
                  className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all ${
                    finalStatus === "Fail" ? "bg-red-500/20 text-red-400 border border-red-500/50 shadow-sm" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  FAIL
                </button>
              </div>

              <textarea 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-2 px-3 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 transition-all resize-none"
                placeholder="Conclusion / Comment..."
              />

              {/* Hazard Edit (Small) */}
              <div className="pt-4 border-t border-white/5 grid grid-cols-3 gap-2">
                <div className="text-center">
                  <span className="text-[8px] font-bold text-blue-500 block mb-1">HEALTH</span>
                  <input type="number" min="0" max="4" value={reportHazards.health} onChange={e => setReportHazards({...reportHazards, health: parseInt(e.target.value)||0})} title="Health Hazard" placeholder="0" className="w-full bg-slate-900/50 border border-white/5 rounded-lg text-xs font-black text-white text-center py-1" />
                </div>
                <div className="text-center">
                  <span className="text-[8px] font-bold text-red-500 block mb-1">FLAMM</span>
                  <input type="number" min="0" max="4" value={reportHazards.flammability} onChange={e => setReportHazards({...reportHazards, flammability: parseInt(e.target.value)||0})} title="Flammability Hazard" placeholder="0" className="w-full bg-slate-900/50 border border-white/5 rounded-lg text-xs font-black text-white text-center py-1" />
                </div>
                <div className="text-center">
                  <span className="text-[8px] font-bold text-yellow-500 block mb-1">INSTAB</span>
                  <input type="number" min="0" max="4" value={reportHazards.instability} onChange={e => setReportHazards({...reportHazards, instability: parseInt(e.target.value)||0})} title="Instability Hazard" placeholder="0" className="w-full bg-slate-900/50 border border-white/5 rounded-lg text-xs font-black text-white text-center py-1" />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Dynamic Tests */}
        <div className="xl:col-span-3">
          <div className="glass-card rounded-2xl p-6 border border-slate-700/50 relative overflow-hidden min-h-full">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
            
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-semibold text-white">Area 2: Test Results</h2>
              <div className="flex items-center gap-3">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*" 
                  capture="environment" 
                  multiple 
                  className="hidden"
                />
                <button 
                  type="button"
                  onClick={() => {
                    if (draftUrls.length >= 3) {
                      alert("Maximum 3 draft photos allowed per report.")
                      return
                    }
                    fileInputRef.current?.click()
                  }}
                  disabled={isUploadingDraft || draftUrls.length >= 3}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 rounded-xl text-sm font-semibold transition-all border border-blue-500/30 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
                  title="Attach 1-3 handwritten test result draft photos"
                >
                  {isUploadingDraft ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  ) : (
                    <Camera className="w-4 h-4 text-blue-400" />
                  )}
                  <span>📷 Add Results Draft</span>
                  {draftUrls.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] font-extrabold bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30">
                      {draftUrls.length}/3
                    </span>
                  )}
                </button>

                <button 
                  onClick={handleAddTest}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors border border-slate-700"
                >
                  <Plus className="w-4 h-4" /> Add Custom Test
                </button>
              </div>
            </div>
            
            {/* Display attached draft thumbnails */}
            {draftUrls.length > 0 && (
              <div className="mb-6 p-4 bg-slate-900/60 rounded-xl border border-slate-700/60 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-blue-400" /> Attached Results Drafts ({draftUrls.length}/3)
                  </span>
                  <span className="text-[11px] text-slate-500">Click thumbnail to view full image</span>
                </div>
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  {draftUrls.map((url, idx) => (
                    <div 
                      key={idx} 
                      className="relative group w-24 h-24 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shadow-lg transition-all hover:border-blue-500/60"
                    >
                      <img 
                        src={url} 
                        alt={`Results Draft ${idx + 1}`} 
                        onClick={() => handleOpenDraftPreview(url)}
                        className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105" 
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <Eye className="w-5 h-5 text-white drop-shadow-md" />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveDraft(idx)
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-600/90 hover:bg-red-600 text-white rounded-full transition-all shadow-md hover:scale-110"
                        title="Delete photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[10px] text-center py-0.5 text-slate-300 font-bold tracking-tight">
                        Draft #{idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-x-auto w-full">
              <table className="w-full text-left text-sm min-w-[600px]">
                <thead className="bg-slate-800/80 border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-300 w-[30%]">Parameter</th>
                    <th className="px-4 py-3 font-semibold text-slate-300 w-[20%]">Requirement</th>
                    <th className="px-4 py-3 font-semibold text-slate-300 w-[20%]">Test Method</th>
                    <th className="px-4 py-3 font-semibold text-slate-300 w-[20%]">Result</th>
                    <th className="px-4 py-3 font-semibold text-slate-300 w-[10%] text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {tests.map((test, index) => (
                    <tr key={index} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-2">
                        <input 
                          type="text"
                          value={test.testName}
                          onChange={(e) => handleTestChange(index, "testName", e.target.value)}
                          placeholder="e.g. Density"
                          className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:border-primary/50"
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          type="text"
                          value={test.requirement}
                          onChange={(e) => handleTestChange(index, "requirement", e.target.value)}
                          placeholder="e.g. Min 4.20"
                          className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2 px-3 text-slate-400 focus:outline-none focus:border-primary/50"
                        />
                      </td>
                      <td className="p-2 relative group">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-1">
                            <input 
                              type="text"
                              value={test.testMethod}
                              onChange={(e) => handleTestChange(index, "testMethod", e.target.value)}
                              placeholder="e.g. API 13A"
                              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2 px-3 text-slate-400 focus:outline-none focus:border-primary/50"
                            />
                            {test.testMethod && sops.some(s => s.methodName.toLowerCase() === test.testMethod.toLowerCase().trim()) && (
                              <button 
                                onClick={() => handleOpenSop(test.testMethod)}
                                className="p-1.5 text-purple-400 hover:bg-purple-400/20 rounded-lg transition-colors flex-shrink-0 border border-purple-500/30"
                                title="View Global SOP"
                              >
                                <BookOpen className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          
                            {spec?.masterSopPath && (
                              <button 
                                onClick={() => handlePdfPreview(spec.masterSopPath)}
                                className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-[10px] font-bold text-emerald-400 transition-all uppercase"
                                title="View Product Master SOP"
                              >
                                <FileText className="w-3 h-3" /> PDF
                              </button>
                            )}
                        </div>
                      </td>
                      <td className="p-2">
                        <input 
                          type="text"
                          value={test.result}
                          onChange={(e) => handleTestChange(index, "result", e.target.value)}
                          placeholder="Result (e.g. 4.20)"
                          className="w-full bg-slate-900/50 border border-emerald-500/30 rounded-lg py-2 px-3 text-white font-bold tracking-wide focus:outline-none focus:border-emerald-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button 
                          onClick={() => handleRemoveTest(index)}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          title="Remove Test"
                        >
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {tests.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500 italic">
                        No tests defined. Click "Add Custom Test" to start.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-sm text-blue-200/80 leading-relaxed">
                <strong>Tip:</strong> The test parameters above are automatically loaded based on the Master Product Specification for <strong className="text-blue-300 uppercase">{initialData.materialName}</strong>. 
                You can freely edit the names, requirements, or test methods for this specific report if needed.
              </p>
            </div>

          </div>
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

            {selectedSop.documentUrl && (
              <div className="pt-4 border-t border-slate-700">
                <a 
                  href={selectedSop?.documentUrl || "#"} 
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

      {/* Draft Image Lightbox Modal */}
      <Modal isOpen={isDraftModalOpen} onClose={() => setIsDraftModalOpen(false)} title="Results Draft Photo">
        {previewDraftUrl && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-400" /> Handwritten Results Draft
              </h3>
              <a 
                href={previewDraftUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
              >
                Open original <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            
            <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-700 bg-slate-950 flex items-center justify-center p-2">
              <img 
                src={previewDraftUrl} 
                alt="Results Draft Full Preview" 
                className="max-w-full h-auto rounded-lg object-contain"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setIsDraftModalOpen(false)} 
                className="px-5 py-2 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-colors text-sm"
              >
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
