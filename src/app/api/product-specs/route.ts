import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get("name")

  if (!name) {
    return NextResponse.json({ error: "Product name is required" }, { status: 400 })
  }

  try {
    // Fetch all product specifications and do a case-insensitive search
    const specs = await prisma.productSpecification.findMany({
      include: {
        parameters: {
          orderBy: { order: "asc" }
        }
      }
    })
    
    const foundSpec = specs.find(
      s => s.materialName.toLowerCase() === name.toLowerCase().trim()
    )

    if (!foundSpec) {
      return NextResponse.json({ error: "Product specification not found" }, { status: 404 })
    }

    return NextResponse.json({
      health: foundSpec.hazardHealth,
      flammability: foundSpec.hazardFlammability,
      instability: foundSpec.hazardInstability,
      requiredTests: foundSpec.parameters.map(p => ({
        parameter: p.parameterName,
        requirement: p.requirement,
        method: p.testMethod
      }))
    })
  } catch (error) {
    console.error("Error fetching product specification:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
