import { getMaterialLogWithReport, getProductSpecificationByMaterial, getTestSops } from "@/app/actions"
import { notFound } from "next/navigation"
import ReportClient from "./ReportClient"

export default async function ReportPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const materialLogId = parseInt(id, 10)
  
  if (isNaN(materialLogId)) {
    notFound()
  }

  const log = await getMaterialLogWithReport(materialLogId)
  
  if (!log) {
    notFound()
  }

  const spec = await getProductSpecificationByMaterial(log.materialName)
  const sops = await getTestSops()

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200">
      <style dangerouslySetInnerHTML={{ __html: `
        .report-sections-container {
          display: flex !important;
          flex-direction: column !important;
          gap: 4mm !important;
        }
        .report-sections-container .section-card {
          margin-bottom: 0 !important;
        }
        @page {
          size: A4 portrait !important;
          margin: 12mm 15mm 12mm 15mm !important; /* Symmetrical margins for A4 */
        }
        @media print, screen {
          /* Force multi-line text wrapping and block cross-column drifting */
          .report-data-table {
            table-layout: fixed !important;
            width: 100% !important;
          }
          .report-data-table th, 
          .report-data-table td {
            font-size: 9.5pt !important;
            padding: 5px 8px !important;
            white-space: normal !important;       /* Forces long text to drop to the next line naturally */
            word-break: break-word !important;     /* Cuts long words safely to wrap down */
            overflow: hidden !important;          /* Keeps content entirely within cell limits */
            box-sizing: border-box !important;    /* Prevents horizontal padding expansion */
            vertical-align: middle !important;
          }
          .report-data-table col:nth-child(1),
          .report-data-table th:nth-child(1),
          .report-data-table td:nth-child(1) {
            width: 45% !important;
            max-width: 45% !important;
          }
          .report-data-table col:nth-child(2),
          .report-data-table th:nth-child(2),
          .report-data-table td:nth-child(2) {
            width: 25% !important;
            max-width: 25% !important;
          }
          .report-data-table col:nth-child(3),
          .report-data-table th:nth-child(3),
          .report-data-table td:nth-child(3) {
            width: 15% !important;
            max-width: 15% !important;
          }
          .report-data-table col:nth-child(4),
          .report-data-table th:nth-child(4),
          .report-data-table td:nth-child(4) {
            width: 15% !important;
            max-width: 15% !important;
          }
        }
        @media screen {
          /* Expand the main page report frame to maximum width */
          .report-print-wrapper, 
          div[class*='max-w-'], 
          table {
            width: 100% !important;
            max-width: 100% !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
        }
        @media print {
          /* Force components to occupy 100% of the printable A4 width */
          .report-print-wrapper,
          main,
          .area-card-container {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 100% !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
            margin: 0 !important;
          }

          .report-data-table,
          table {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 100% !important;
            margin: 0 !important;
            table-layout: fixed !important;
          }
        }
      `}} />
      <div className="container mx-auto px-4 py-8 print:p-0 print:max-w-none">
        <ReportClient initialData={log} spec={spec} sops={sops} />
      </div>
    </div>
  )
}
