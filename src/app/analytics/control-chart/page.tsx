"use client"

import { useState, useEffect } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts"
import { getMaterialsForChart, getParametersForMaterial, getControlChartData } from "./actions"
import { Activity, AlertTriangle, AlertCircle, Info } from "lucide-react"

export default function ControlChartPage() {
  const [materials, setMaterials] = useState<string[]>([])
  const [selectedMaterial, setSelectedMaterial] = useState<string>("")
  
  const [parameters, setParameters] = useState<string[]>([])
  const [selectedParameter, setSelectedParameter] = useState<string>("")
  
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

  // 2. Fetch Parameters when Material changes
  useEffect(() => {
    if (!selectedMaterial) {
      setParameters([])
      setSelectedParameter("")
      setChartData([])
      return
    }
    
    async function fetchParameters() {
      const data = await getParametersForMaterial(selectedMaterial)
      setParameters(data)
      if (data.length > 0) {
        setSelectedParameter(data[0])
      } else {
        setSelectedParameter("")
      }
    }
    
    fetchParameters()
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
      setLoading(false)
    }
    
    fetchData()
  }, [selectedMaterial, selectedParameter])

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="glass-card p-4 rounded-xl border border-slate-700/50 shadow-xl z-50">
          <p className="font-bold text-white mb-2 pb-2 border-b border-slate-700">{data.displayDate} - {data.reportNo}</p>
          <div className="space-y-1 text-sm text-slate-300">
            <p><span className="text-slate-400">Supplier:</span> {data.supplier}</p>
            <p><span className="text-slate-400">Batch No:</span> {data.batchNoRef}</p>
            <p className="pt-2"><span className="text-slate-400">Result:</span> <span className="text-blue-400 font-bold">{data.rawValue}</span></p>
            {data.requirement && <p className="text-xs text-slate-500">Spec: {data.requirement}</p>}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-700/50">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-500" />
            SPC Control Chart
          </h1>
          <p className="text-slate-400 mt-2">
            Track material test result trends and monitor batch stability over time.
          </p>
        </div>
      </div>
      
      {/* Filters */}
      <div className="glass-card rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Select Material</label>
            <select
              value={selectedMaterial}
              onChange={(e) => setSelectedMaterial(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
            >
              <option value="">-- Select Material --</option>
              {materials.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Select Test Parameter</label>
            <select
              value={selectedParameter}
              onChange={(e) => setSelectedParameter(e.target.value)}
              disabled={!selectedMaterial || parameters.length === 0}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none disabled:opacity-50"
            >
              <option value="">-- Select Parameter --</option>
              {parameters.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Chart Area */}
      <div className="glass-card rounded-2xl p-6 min-h-[500px] flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Trend Analysis
            {loading && <span className="text-sm text-blue-400 font-normal animate-pulse">Loading data...</span>}
          </h2>
          
          {limits.originalText && (
            <div className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Info className="w-4 h-4" />
              Spec: {limits.originalText}
            </div>
          )}
        </div>
        
        {!selectedMaterial || !selectedParameter ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-4">
            <Activity className="w-16 h-16 opacity-20" />
            <p>Select a material and test parameter to view the control chart</p>
          </div>
        ) : chartData.length === 0 && !loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-4">
            <AlertCircle className="w-16 h-16 opacity-20" />
            <p>No numeric historical data found for this parameter</p>
          </div>
        ) : (
          <div style={{ width: '100%', height: '400px', minHeight: '400px', marginTop: '16px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="displayDate" 
                  stroke="#64748b" 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickMargin={10}
                />
                <YAxis 
                  stroke="#64748b" 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickMargin={10}
                  domain={['auto', 'auto']}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {limits.max !== null && (
                  <ReferenceLine y={limits.max} stroke="#ef4444" strokeDasharray="5 5" label={{ position: 'top', value: 'Max Limit', fill: '#ef4444', fontSize: 12 }} />
                )}
                {limits.min !== null && (
                  <ReferenceLine y={limits.min} stroke="#ef4444" strokeDasharray="5 5" label={{ position: 'bottom', value: 'Min Limit', fill: '#ef4444', fontSize: 12 }} />
                )}
                
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  activeDot={{ r: 8, fill: "#3b82f6", stroke: "#0f172a", strokeWidth: 2 }}
                  dot={{ r: 6, fill: "#3b82f6", stroke: "#1e293b", strokeWidth: 2 }}
                  name="Test Result"
                  animationDuration={500}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
