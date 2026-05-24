import { prisma } from "@/lib/prisma"
import { FlaskConical, CheckCircle, XCircle, Clock } from "lucide-react"

export default async function DashboardSummaryPage() {
  const totalLogs = await prisma.materialLog.count()

  // Fetch pending items for the new widget
  // Filter where status is NOT Pass and NOT Fail, effectively matching 'Pending' / 'Under Testing'
  const allPendingLogs = await prisma.materialLog.findMany({
    where: {
      NOT: [
        { testResult: "Pass" },
        { testResult: "Fail" }
      ]
    },
    select: {
      type: true,
      materialName: true,
      equiEmecProduct: true,
      supplier: true
    },
    orderBy: {
      receivedDate: 'desc'
    }
  })

  const strPending = allPendingLogs.filter(log => log.type === 'STR')
  const mtrPending = allPendingLogs.filter(log => log.type === 'MTR')

  // Yearly logs filtering
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(`${currentYear}-01-01T00:00:00.000Z`);
  const endOfYear = new Date(`${currentYear}-12-31T23:59:59.999Z`);

  const yearlyLogs = await prisma.materialLog.findMany({
    where: {
      receivedDate: {
        gte: startOfYear,
        lte: endOfYear
      }
    },
    select: { type: true }
  });

  const totalYearly = yearlyLogs.length;
  const strYearlyCount = yearlyLogs.filter(log => log.type === 'STR').length;
  const mtrYearlyCount = yearlyLogs.filter(log => log.type === 'MTR').length;

  const yearlyEvaluations = await prisma.materialLog.findMany({
    where: {
      receivedDate: {
        gte: startOfYear,
        lte: endOfYear
      },
      testResult: {
        in: ['Pass', 'Fail']
      }
    },
    select: {
      type: true,
      testResult: true
    }
  });

  const totalEvaluated = yearlyEvaluations.length;
  const passedLogs = yearlyEvaluations.filter(log => log.testResult === 'Pass');
  const totalPassed = passedLogs.length;
  const passedSTR = passedLogs.filter(log => log.type === 'STR').length;
  const passedMTR = passedLogs.filter(log => log.type === 'MTR').length;

  const failedLogs = yearlyEvaluations.filter(log => log.testResult === 'Fail');
  const totalFailed = failedLogs.length;
  const failedSTR = failedLogs.filter(log => log.type === 'STR').length;
  const failedMTR = failedLogs.filter(log => log.type === 'MTR').length;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Dashboard Overview</h1>
          <p className="text-slate-400">High-level summary of your laboratory testing operations.</p>
        </div>

        {/* Pending / Under Testing Summary Widget */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg flex flex-col gap-2 w-full max-w-sm">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-sm font-semibold text-amber-500 flex items-center gap-1">
              ⏳ Under Testing Status
            </span>
            <span className="bg-amber-500/10 text-amber-500 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {allPendingLogs.length} Total
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-1">
            {/* STR Widget Group */}
            <div className="group relative cursor-pointer bg-slate-950 p-2.5 rounded-lg border border-slate-800/50 hover:border-amber-500/40 transition">
              <p className="text-xs text-slate-400">STR Pending</p>
              <p className="text-xl font-bold text-slate-100">{strPending.length} Requests</p>
              {/* Popover List on Hover */}
              {strPending.length > 0 && (
                <div className="absolute hidden group-hover:block bg-slate-950 border border-slate-800 p-3 rounded-lg shadow-xl text-xs text-slate-300 w-56 z-50 mt-2 top-full left-0 max-h-64 overflow-y-auto">
                  <p className="font-semibold text-amber-500 mb-1">STR Items:</p>
                  {strPending.map((item, idx) => (
                    <p key={idx} className={idx !== strPending.length - 1 ? 'border-b border-slate-800/60 pb-1 mb-1' : ''}>
                      • {item.materialName || item.equiEmecProduct} <span className="text-slate-500">({item.supplier})</span>
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* MTR Widget Group */}
            <div className="group relative cursor-pointer bg-slate-950 p-2.5 rounded-lg border border-slate-800/50 hover:border-amber-500/40 transition">
              <p className="text-xs text-slate-400">MTR Pending</p>
              <p className="text-xl font-bold text-slate-100">{mtrPending.length} Requests</p>
              {/* Popover List on Hover */}
              {mtrPending.length > 0 && (
                <div className="absolute hidden group-hover:block bg-slate-950 border border-slate-800 p-3 rounded-lg shadow-xl text-xs text-slate-300 w-56 z-50 mt-2 top-full right-0 max-h-64 overflow-y-auto">
                  <p className="font-semibold text-amber-500 mb-1">MTR Items:</p>
                  {mtrPending.map((item, idx) => (
                    <p key={idx} className={idx !== mtrPending.length - 1 ? 'border-b border-slate-800/60 pb-1 mb-1' : ''}>
                      • {item.materialName || item.equiEmecProduct} <span className="text-slate-500">({item.supplier})</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg flex flex-col gap-2 w-full h-full justify-center">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-sm font-semibold text-emerald-500 flex items-center gap-1">
              📊 Total Material Logged ({currentYear})
            </span>
            <span className="bg-emerald-500/10 text-emerald-500 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {totalYearly} Total
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-1">
            {/* Yearly STR Tracker */}
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/50">
              <p className="text-xs text-slate-400">STR Logged</p>
              <p className="text-xl font-bold text-slate-100">{strYearlyCount} Units</p>
            </div>

            {/* Yearly MTR Tracker */}
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/50">
              <p className="text-xs text-slate-400">MTR Logged</p>
              <p className="text-xl font-bold text-slate-100">{mtrYearlyCount} Units</p>
            </div>
          </div>
        </div>

        {/* Passed & Failed Evaluations Widget */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg flex flex-col gap-2 w-full h-full justify-center col-span-1 lg:col-span-2">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-sm font-semibold text-sky-500 flex items-center gap-1">
              📋 Quality Evaluations ({currentYear})
            </span>
            <span className="bg-sky-500/10 text-sky-500 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {totalEvaluated} Reviewed
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-1">
            {/* Passed Section with STR/MTR Sub-counts */}
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/50 hover:border-emerald-500/20 transition flex flex-col gap-1">
              <div className="flex justify-between items-center mb-0.5">
                <p className="text-xs font-semibold text-emerald-500">Passed</p>
                <span className="text-xs font-bold text-slate-200">{totalPassed} Units</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 border-t border-slate-900 pt-1">
                <span>STR: <strong className="text-slate-200">{passedSTR}</strong></span>
                <span>MTR: <strong className="text-slate-200">{passedMTR}</strong></span>
              </div>
            </div>

            {/* Failed Section with STR/MTR Sub-counts */}
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/50 hover:border-rose-500/20 transition flex flex-col gap-1">
              <div className="flex justify-between items-center mb-0.5">
                <p className="text-xs font-semibold text-rose-500">Failed</p>
                <span className="text-xs font-bold text-slate-200">{totalFailed} Units</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 border-t border-slate-900 pt-1">
                <span>STR: <strong className="text-slate-200">{failedSTR}</strong></span>
                <span>MTR: <strong className="text-slate-200">{failedMTR}</strong></span>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 border-l-4 border-yellow-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 font-medium mb-1">Pending / Under Testing</p>
              <p className="text-4xl font-bold text-yellow-400">{allPendingLogs.length}</p>
            </div>
            <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-400">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-8 border border-slate-700/50 text-center">
        <h2 className="text-xl font-bold text-white mb-4">Ready to start?</h2>
        <p className="text-slate-400 max-w-lg mx-auto mb-6">
          Navigate to the Material Log to enter new material arrivals, or go to Product Specs to define your testing parameters.
        </p>
      </div>
    </div>
  )
}
