import { getMaterialLogs, getUniqueSuppliers, getEmecProductNames } from "@/app/actions"
import DashboardClient from "@/app/DashboardClient"

export default async function LogPage() {
  const data = await getMaterialLogs()
  const suppliers = await getUniqueSuppliers()
  const emecProducts = await getEmecProductNames()
  
  return (
    <div className="w-full px-6">
      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Material Log</h1>
          <p className="text-slate-400">Manage and generate labels for lab materials</p>
        </div>
      </div>
      
      <DashboardClient initialData={data} suppliers={suppliers} emecProducts={emecProducts} />
    </div>
  )
}
