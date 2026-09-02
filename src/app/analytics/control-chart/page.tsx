"use client"

import { useState, useEffect, useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { getMaterialsForChart, getParametersForMaterial, getCompaniesForMaterial, getControlChartData } from "./actions"
import { Activity, AlertCircle, Info, Download, Filter, Calendar, Building2, RotateCcw, FileSpreadsheet } from "lucide-react"
import * as XLSX from "xlsx"

export default function ControlChartPage() {
  const [materials, setMaterials] = useState<string[]>([])
  const [selectedMaterial, setSelectedMaterial] = useState<string>("")
  
  const [parameters, setParameters] = useState<string[]>([])
  const [selectedParameter, setSelectedParameter] = useState<string>("")
  
  const [companies, setCompanies] = useState<string[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string>("")
  
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")

  const [chartData, setChartData] = useState<any[]>([])
  const [limits, setLimits] = useState<{ min: number | null, max: number | null, originalText: string | null }>({ min: null, max: null, originalText: null })
  
  const [loading, setLoading] = useState(false)

  // 1. Fetch Materials on mount
  useEffect(() => {
    async function fetchMaterials() {
      const data = await getMaterialsForChart()
      setMaterials(data)
    }
    fetchMaterials()
  }, [])

  // 2. Fetch Parameters & Companies when Material changes
  useEffect(() => {
    // Reset company filter whenever material selection changes
    setSelectedCompany("")
    setCompanies([])
    
    if (!selectedMaterial) {
      setParameters([])
      setSelectedParameter("")
      setChartData([])
      return
    }
    
    async function fetchParametersAndCompanies() {
      const [paramData, companyData] = await Promise.all([
        getParametersForMaterial(selectedMaterial),
        getCompaniesForMaterial(selectedMaterial)
      ])
      
      setParameters(paramData)
      if (paramData.length > 0) {
        setSelectedParameter(paramData[0])
      } else {
        setSelectedParameter("")
      }
      
      setCompanies(companyData)
    }
    
    fetchParametersAndCompanies()
  }, [selectedMaterial])

  // 3. Fetch Chart Data when Material & Parameter are selected
  useEffect(() => {
    if (!selectedMaterial || !selectedParameter) {
      setChartData([])
      return
    }
    
    async function fetchData() {
      setLoading(true)
      const { data, limits: newLimits } = await getControlChartData(selectedMaterial, selectedParameter)
      setChartData(data)
      setLimits(newLimits)
      
      // Augment companies list if chartData contains suppliers not in companies state (e.g. mock suppliers)
      if (data && data.length > 0) {
        const suppliersFromData = Array.from(new Set(data.map((d: any) => d.supplier).filter(Boolean)))
        setCompanies(prev => Array.from(new Set([...prev, ...suppliersFromData])))
      }
      
      setLoading(false)
    }
    
    fetchData()
  }, [selectedMaterial, selectedParameter])

  // 4. Combine active multi-criteria filters dynamically
  const filteredChartData = useMemo(() => {
    if (!selectedMaterial || !selectedParameter) return []

    return chartData.filter((item) => {
      // Company Filter
      if (selectedCompany && item.supplier !== selectedCompany) {
        return false
      }

      // Date Range Filter (From Date)
      if (startDate) {
        if (item.displayDate < startDate) {
          return false
        }
      }

      // Date Range Filter (To Date)
      if (endDate) {
        if (item.displayDate > endDate) {
          return false
        }
      }

      return true
    })
  }, [chartData, selectedMaterial, selectedParameter, selectedCompany, startDate, endDate])

  // Reset secondary filters (Company & Date Range)
  const handleResetSecondaryFilters = () => {
    setSelectedCompany("")
    setStartDate("")
    setEndDate("")
  }

  // Excel Export Handler
  const handleExportExcel = () => {
    if (filteredChartData.length === 0) return

    const exportRows = filteredChartData.map(item => ({
      "Test Date": item.displayDate,
      "Material": selectedMaterial,
      "Company/Supplier": item.supplier || "N/A",
      "Parameter": selectedParameter,
      "Value": item.rawValue ?? item.value,
      "Batch No": item.batchNoRef || "N/A",
      "Report No": item.reportNo || "N/A",
      "Requirement": item.requirement || "N/A"
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportRows)

    // Set column widths
    worksheet['!cols'] = [
      { wch: 14 }, // Test Date
      { wch: 25 }, // Material
      { wch: 25 }, // Company/Supplier
      { wch: 25 }, // Parameter
      { wch: 12 }, // Value
      { wch: 16 }, // Batch No
      { wch: 16 }, // Report No
      { wch: 20 }, // Requirement
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "SPC Filtered Results")

    const safeMaterial = selectedMaterial.replace(/[^a-zA-Z0-9_-]/g, '_')
    const safeParam = selectedParameter.replace(/[^a-zA-Z0-9_-]/g, '_')
    const todayStr = new Date().toISOString().split('T')[0]
    const fileName = `SPC_Control_Chart_${safeMaterial}_${safeParam}_${todayStr}.xlsx`

    XLSX.writeFile(workbook, fileName)
  }

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="glass-card p-4 rounded-xl border border-slate-700/50 shadow-xl z-50">
          <p className="font-bold text-white mb-2 pb-2 border-b border-slate-700">{data.displayDate} - {data.reportNo}</p>
          <div className="space-y-1 text-sm text-slate-300">
            <p><span className="text-slate-400">Supplier:</span> {data.supplier || "N/A"}</p>
            <p><span className="text-slate-400">Batch No:</span> {data.batchNoRef || "N/A"}</p>
            <p className="pt-2"><span className="text-slate-400">Result:</span> <span className="text-blue-400 font-bold">{data.rawValue}</span></p>
            {data.requirement && <p className="text-xs text-slate-500">Spec: {data.requirement}</p>}
          </div>
        </div>
      )
    }
    return null
  }

  const isExportDisabled = filteredChartData.length === 0 || loading
  const hasActiveSecondaryFilters = Boolean(selectedCompany || startDate || endDate)

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight flex items-center gap-3">
            <Activity className="w-7 h-7 sm:w-8 sm:h-8 text-blue-500 shrink-0" />
            SPC Control Chart
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track material test result trends, apply multi-criteria filters, and export analysis data.
          </p>
        </div>

        {/* Excel Export Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleExportExcel}
            disabled={isExportDisabled}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed border border-emerald-500/30 shadow-lg transition-all cursor-pointer"
            title={isExportDisabled ? "No data available to export" : "Export filtered dataset to Excel"}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Filtered Excel
          </button>
        </div>
      </div>
      
      {/* Filters Panel */}
      <div className="bg-[#0f172a] glass-card rounded-2xl p-4 sm:p-6 border border-slate-800 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <h3 className="text-xs sm:text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-400" />
            Filter Controls
          </h3>
          {hasActiveSecondaryFilters && (
            <button
              onClick={handleResetSecondaryFilters}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
          {/* 1. Material Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Material</label>
            <select
              value={selectedMaterial}
              onChange={(e) => setSelectedMaterial(e.target.value)}
              className="w-full bg-[#1e293b] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
            >
              <option value="">-- Select Material --</option>
              {materials.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          
          {/* 2. Parameter Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Test Parameter</label>
            <select
              value={selectedParameter}
              onChange={(e) => setSelectedParameter(e.target.value)}
              disabled={!selectedMaterial || parameters.length === 0}
              className="w-full bg-[#1e293b] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">-- Select Parameter --</option>
              {parameters.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* 3. Company / Supplier Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              Company / Supplier
            </label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              disabled={!selectedMaterial}
              className="w-full bg-[#1e293b] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">All Companies</option>
              {companies.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* 4. From Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={!selectedMaterial}
              className="w-full bg-[#1e293b] border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed [color-scheme:dark]"
            />
          </div>

          {/* 5. To Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={!selectedMaterial}
              className="w-full bg-[#1e293b] border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed [color-scheme:dark]"
            />
          </div>
        </div>
      </div>
      
      {/* Chart Area */}
      <div className="bg-[#0f172a] glass-card rounded-2xl p-4 sm:p-6 border border-slate-800 min-h-[360px] sm:min-h-[480px] flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
              Trend Analysis
              {loading && <span className="text-xs text-blue-400 font-normal animate-pulse">Loading data...</span>}
            </h2>
            {selectedMaterial && selectedParameter && (
              <p className="text-xs text-slate-400 mt-1">
                Showing {filteredChartData.length} of {chartData.length} data points
              </p>
            )}
          </div>
          
          {limits.originalText && (
            <div className="flex items-center gap-2 text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 self-start sm:self-auto">
              <Info className="w-4 h-4 shrink-0" />
              Spec Limit: {limits.originalText}
            </div>
          )}
        </div>
        
        {!selectedMaterial || !selectedParameter ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-4 py-12 sm:py-16">
            <Activity className="w-12 h-12 sm:w-16 sm:h-16 opacity-20" />
            <p className="text-xs sm:text-sm text-slate-400 text-center">Select a material and test parameter to view the control chart</p>
          </div>
        ) : filteredChartData.length === 0 && !loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-4 py-12 sm:py-16">
            <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 opacity-20 text-amber-500" />
            <p className="text-xs sm:text-sm text-slate-400 text-center">No test results match the current filter criteria</p>
            {hasActiveSecondaryFilters && (
              <button
                onClick={handleResetSecondaryFilters}
                className="text-xs text-blue-400 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset secondary filters
              </button>
            )}
          </div>
        ) : (
          <div className="w-full h-[300px] sm:h-[400px] min-h-[300px] mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredChartData} margin={{ top: 20, right: 15, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="displayDate" 
                  stroke="#64748b" 
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickMargin={10}
                />
                <YAxis 
                  stroke="#64748b" 
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickMargin={10}
                  domain={['auto', 'auto']}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {limits.max !== null && (
                  <ReferenceLine y={limits.max} stroke="#ef4444" strokeDasharray="5 5" label={{ position: 'top', value: `Max (${limits.max})`, fill: '#ef4444', fontSize: 11 }} />
                )}
                {limits.min !== null && (
                  <ReferenceLine y={limits.min} stroke="#ef4444" strokeDasharray="5 5" label={{ position: 'bottom', value: `Min (${limits.min})`, fill: '#ef4444', fontSize: 11 }} />
                )}
                
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  activeDot={{ r: 7, fill: "#3b82f6", stroke: "#0f172a", strokeWidth: 2 }}
                  dot={{ r: 5, fill: "#3b82f6", stroke: "#1e293b", strokeWidth: 2 }}
                  name="Test Result"
                  animationDuration={500}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Filtered Data Preview Table */}
      {selectedMaterial && selectedParameter && filteredChartData.length > 0 && (
        <div className="bg-[#0f172a] glass-card rounded-2xl p-4 sm:p-6 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              Filtered Dataset ({filteredChartData.length})
            </h3>
            <button
              onClick={handleExportExcel}
              className="self-start sm:self-auto text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download Excel
            </button>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm text-slate-300 min-w-[600px]">
              <thead className="text-xs uppercase bg-[#1e293b]/70 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 whitespace-nowrap">Test Date</th>
                  <th className="py-3 px-4 whitespace-nowrap">Report No</th>
                  <th className="py-3 px-4 whitespace-nowrap">Batch No</th>
                  <th className="py-3 px-4 whitespace-nowrap">Supplier / Company</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Value</th>
                  <th className="py-3 px-4 whitespace-nowrap">Spec Requirement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredChartData.map((row) => {
                  const isMinOut = limits.min !== null && row.value !== null && row.value < limits.min
                  const isMaxOut = limits.max !== null && row.value !== null && row.value > limits.max
                  const isOutOfSpec = isMinOut || isMaxOut

                  return (
                    <tr key={`${row.id}-${row.reportNo}`} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-slate-200 font-medium whitespace-nowrap">{row.displayDate}</td>
                      <td className="py-3 px-4 text-slate-300 font-mono text-xs whitespace-nowrap">{row.reportNo}</td>
                      <td className="py-3 px-4 text-slate-300 whitespace-nowrap">{row.batchNoRef || "-"}</td>
                      <td className="py-3 px-4 text-slate-300 whitespace-nowrap">{row.supplier || "N/A"}</td>
                      <td className="py-3 px-4 text-right font-bold whitespace-nowrap">
                        <span className={isOutOfSpec ? "text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20" : "text-blue-400"}>
                          {row.rawValue}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-xs whitespace-nowrap">{row.requirement || "-"}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
