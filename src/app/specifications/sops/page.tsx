import { getTestSops } from "@/app/actions"
import SopClient from "./SopClient"

export default async function SopsPage() {
  const sops = await getTestSops()

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24">
      <SopClient initialData={sops} />
    </div>
  )
}
