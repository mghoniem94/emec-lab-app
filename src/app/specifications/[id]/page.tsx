import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import SpecClient from "./SpecClient"
import { getTestSops } from "@/app/actions"

export default async function SpecPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const specId = parseInt(id, 10)
  
  if (isNaN(specId)) {
    notFound()
  }

  const spec = await prisma.productSpecification.findUnique({
    where: { id: specId },
    include: {
      parameters: {
        orderBy: { order: 'asc' }
      }
    }
  })
  
  if (!spec) {
    notFound()
  }

  const sops = await getTestSops()

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24">
      <SpecClient initialData={spec} sops={sops} />
    </div>
  )
}
