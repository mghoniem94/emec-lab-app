import { TEST_BY_PERSONNEL, SUPPLIER_LIST } from "./config";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ListsPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200">
      <div className="container mx-auto px-4 py-8 max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="flex items-center gap-4 mb-8 bg-slate-800/30 p-4 rounded-2xl border border-white/5">
          <Link href="/" className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">System Lists Configuration</h1>
            <p className="text-slate-400 text-sm">Manage centralized dropdown options</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personnel Card */}
          <div className="glass-card rounded-2xl p-6 border border-slate-700/50 flex flex-col h-[70vh]">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              Test By Personnel
              <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full">{TEST_BY_PERSONNEL.length} items</span>
            </h2>
            <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-y-auto flex-1">
              <ul className="divide-y divide-slate-800/50">
                {TEST_BY_PERSONNEL.map((person, i) => (
                  <li key={i} className="px-4 py-3 text-sm text-slate-300 hover:bg-slate-800/30 transition-colors">
                    {person}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-slate-500 mt-4">
              * These static records are populated inside the material entry forms. To add new personnel, update the central config file.
            </p>
          </div>

          {/* Suppliers Card */}
          <div className="glass-card rounded-2xl p-6 border border-slate-700/50 flex flex-col h-[70vh]">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              Official Audited Suppliers
              <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full">{SUPPLIER_LIST.length} items</span>
            </h2>
            <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-y-auto flex-1">
              <ul className="divide-y divide-slate-800/50">
                {SUPPLIER_LIST.map((supplier, i) => (
                  <li key={i} className="px-4 py-3 text-sm text-slate-300 hover:bg-slate-800/30 transition-colors">
                    {supplier}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-slate-500 mt-4">
              * These audited suppliers are populated inside the material entry forms. To update, edit the central config file.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
