import { getProductSpecifications } from "@/app/actions"
import { SpecificationsList } from "./SpecificationsList"

export default async function SpecificationsPage() {
  const specs = await getProductSpecifications()

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
      <SpecificationsList initialSpecs={specs} />
    </div>
  )
}
