"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getMaterialLogs() {
  return await prisma.materialLog.findMany({
    orderBy: { createdAt: "desc" }
  })
}

export async function getUniqueSuppliers() {
  const logs = await prisma.materialLog.findMany({
    select: { supplier: true },
    distinct: ['supplier'],
    where: { supplier: { not: "" } },
    orderBy: { supplier: 'asc' }
  })
  return logs.map(l => l.supplier)
}

export async function getEmecProductNames() {
  const specs = await prisma.productSpecification.findMany({
    select: { materialName: true },
    orderBy: { materialName: 'asc' }
  })
  return specs.map(s => s.materialName)
}

export async function createMaterialLog(formData: FormData) {
  const currentYear = new Date().getFullYear()
  
  // Find the highest reportNo for the current year
  const lastRecord = await prisma.materialLog.findFirst({
    where: {
      reportNo: {
        startsWith: `${currentYear}-`
      }
    },
    orderBy: {
      reportNo: 'desc'
    }
  })

  let nextSequence = 1
  if (lastRecord) {
    const parts = lastRecord.reportNo.split('-')
    if (parts.length === 2) {
      nextSequence = parseInt(parts[1], 10) + 1
    }
  }

  const reportNo = `${currentYear}-${nextSequence.toString().padStart(4, '0')}`

  const receivedDateStr = formData.get("receivedDate") as string
  const withdrawalDateStr = formData.get("withdrawalDate") as string
  const reportDateStr = formData.get("reportDate") as string

  const equiEmecProduct = formData.get("equiEmecProduct") as string

  // Fetch product specifications matching equiEmecProduct
  const specs = await prisma.productSpecification.findMany({
    include: {
      parameters: {
        orderBy: { order: "asc" }
      }
    }
  })
  const spec = specs.find(
    s => s.materialName.toLowerCase() === equiEmecProduct.toLowerCase().trim()
  )

  const hazardHealth = spec?.hazardHealth ?? 0
  const hazardFlammability = spec?.hazardFlammability ?? 0
  const hazardInstability = spec?.hazardInstability ?? 0

  const newLog = await prisma.materialLog.create({
    data: {
      reportNo,
      type: formData.get("type") as string,
      supplier: formData.get("supplier") as string,
      batchNoRef: formData.get("batchNoRef") as string,
      materialName: formData.get("materialName") as string,
      equiEmecProduct,
      
      receivedDate: new Date(receivedDateStr),
      withdrawalDate: withdrawalDateStr ? new Date(withdrawalDateStr) : null,
      reportDate: new Date(reportDateStr),
      
      testBy: formData.get("testBy") as string,
      mtrStrNo: formData.get("mtrStrNo") as string,
      testResult: formData.get("testResult") as string,
      
      hazardHealth,
      hazardFlammability,
      hazardInstability,

      // Nestedly create the MaterialReport and TestResult records if specifications exist
      ...(spec && spec.parameters.length > 0 ? {
        report: {
          create: {
            finalStatus: "Pending",
            comment: `${formData.get("materialName")}, Batch No. ${formData.get("batchNoRef")} received from ${formData.get("supplier")} meets EMEC Requirement.`,
            testResults: {
              create: spec.parameters.map((param) => ({
                testName: param.parameterName,
                requirement: param.requirement,
                testMethod: param.testMethod,
                result: "" // Left blank for the chemist to enter later
              }))
            }
          }
        }
      } : {})
    }
  })

  revalidatePath("/")
  return newLog
}

export async function updateMaterialLog(id: number, formData: FormData) {
  const receivedDateStr = formData.get("receivedDate") as string
  const withdrawalDateStr = formData.get("withdrawalDate") as string
  const reportDateStr = formData.get("reportDate") as string

  const equiEmecProduct = formData.get("equiEmecProduct") as string

  // Fetch product specifications matching equiEmecProduct
  const specs = await prisma.productSpecification.findMany({
    include: {
      parameters: {
        orderBy: { order: "asc" }
      }
    }
  })
  const spec = specs.find(
    s => s.materialName.toLowerCase() === equiEmecProduct.toLowerCase().trim()
  )

  const hazardHealth = spec?.hazardHealth ?? 0
  const hazardFlammability = spec?.hazardFlammability ?? 0
  const hazardInstability = spec?.hazardInstability ?? 0

  const updatedLog = await prisma.materialLog.update({
    where: { id },
    data: {
      type: formData.get("type") as string,
      supplier: formData.get("supplier") as string,
      batchNoRef: formData.get("batchNoRef") as string,
      materialName: formData.get("materialName") as string,
      equiEmecProduct,
      
      receivedDate: new Date(receivedDateStr),
      withdrawalDate: withdrawalDateStr ? new Date(withdrawalDateStr) : null,
      reportDate: new Date(reportDateStr),
      
      testBy: formData.get("testBy") as string,
      mtrStrNo: formData.get("mtrStrNo") as string,
      testResult: formData.get("testResult") as string,
      
      hazardHealth,
      hazardFlammability,
      hazardInstability,
    }
  })

  revalidatePath("/")
  return updatedLog
}

export async function deleteMaterialLogs(ids: number[]) {
  await prisma.materialLog.deleteMany({
    where: {
      id: { in: ids }
    }
  })
  revalidatePath("/")
}

export async function getMaterialLogWithReport(id: number) {
  return await prisma.materialLog.findUnique({
    where: { id },
    include: {
      report: {
        include: {
          testResults: true
        }
      }
    }
  })
}

export async function saveMaterialReport(
  materialLogId: number, 
  finalStatus: string, 
  comment: string, 
  testResults: { testName: string, requirement: string, testMethod: string, result: string }[],
  hazards?: { hazardHealth: number, hazardFlammability: number, hazardInstability: number }
) {
  // Use a transaction to recreate the report to easily sync test results
  const report = await prisma.$transaction(async (tx) => {
    await tx.materialReport.deleteMany({
      where: { materialLogId }
    })
    
    if (hazards) {
      await tx.materialLog.update({
        where: { id: materialLogId },
        data: {
          hazardHealth: hazards.hazardHealth,
          hazardFlammability: hazards.hazardFlammability,
          hazardInstability: hazards.hazardInstability,
        }
      })
    }

    // Sync status to Material Log
    let logStatus = 'Under Testing'
    if (finalStatus === 'Pass' || finalStatus === 'Fail') {
      logStatus = finalStatus
    }

    await tx.materialLog.update({
      where: { id: materialLogId },
      data: { testResult: logStatus }
    })

    return await tx.materialReport.create({
      data: {
        materialLogId,
        finalStatus,
        comment,
        testResults: {
          create: testResults.map((test) => ({
            testName: test.testName,
            requirement: test.requirement,
            testMethod: test.testMethod,
            result: test.result,
          }))
        }
      }
    })
  })
  
  revalidatePath(`/report/${materialLogId}`)
  revalidatePath("/")
  return report
}

// --- Product Specification Actions ---

export async function getProductSpecifications() {
  return await prisma.productSpecification.findMany({
    include: {
      parameters: {
        orderBy: { order: 'asc' }
      }
    },
    orderBy: { materialName: 'asc' }
  })
}

export async function getProductSpecificationByMaterial(materialName: string) {
  // Case-insensitive search requires some careful querying in SQLite
  // We'll fetch all and find the closest match, or exact match
  const specs = await prisma.productSpecification.findMany({
    include: { parameters: { orderBy: { order: 'asc' } } }
  })
  
  return specs.find(s => s.materialName.toLowerCase() === materialName.toLowerCase()) || null
}

export async function saveProductSpecification(
  materialName: string,
  parameters: { parameterName: string, requirement: string, testMethod: string, order: number }[],
  hazards?: { hazardHealth: number, hazardFlammability: number, hazardInstability: number },
  masterSopPath?: string
) {
  // Check if exists
  const existing = await prisma.productSpecification.findUnique({
    where: { materialName }
  })

  let spec;
  if (existing) {
    spec = await prisma.$transaction(async (tx) => {
      await tx.specificationParameter.deleteMany({
        where: { specificationId: existing.id }
      })
      return await tx.productSpecification.update({
        where: { id: existing.id },
        data: {
          hazardHealth: hazards?.hazardHealth ?? 0,
          hazardFlammability: hazards?.hazardFlammability ?? 0,
          hazardInstability: hazards?.hazardInstability ?? 0,
          masterSopPath: masterSopPath || null,
          parameters: {
            create: parameters
          }
        }
      })
    })
  } else {
    spec = await prisma.productSpecification.create({
      data: {
        materialName,
        hazardHealth: hazards?.hazardHealth ?? 0,
        hazardFlammability: hazards?.hazardFlammability ?? 0,
        hazardInstability: hazards?.hazardInstability ?? 0,
        masterSopPath: masterSopPath || null,
        parameters: {
          create: parameters
        }
      }
    })
  }
  
  revalidatePath("/specifications")
  return spec
}

// --- SOP Actions ---
export async function getTestSops() {
  return await prisma.testMethodSop.findMany({
    orderBy: { methodName: 'asc' }
  })
}

export async function saveTestSop(methodName: string, description: string, documentUrl?: string) {
  const existing = await prisma.testMethodSop.findUnique({ where: { methodName } })
  if (existing) {
    await prisma.testMethodSop.update({
      where: { id: existing.id },
      data: { description, documentUrl }
    })
  } else {
    await prisma.testMethodSop.create({
      data: { methodName, description, documentUrl }
    })
  }
  revalidatePath("/specifications/sops")
}

export async function deleteTestSop(id: number) {
  await prisma.testMethodSop.delete({ where: { id } })
  revalidatePath("/specifications/sops")
}

export async function deleteProductSpecification(id: number) {
  await prisma.productSpecification.delete({
    where: { id }
  })
  revalidatePath("/specifications")
}

// Initial seed helper
export async function seedInitialSpecifications() {
  const seeds = [
    {
      materialName: "Barite",
      parameters: [
        { parameterName: "Specific Gravity", requirement: "Min 4.20", testMethod: "API 13A", order: 1 },
        { parameterName: "Wet Screen Analysis (325 Mesh)", requirement: "Max 3.0%", testMethod: "API 13A", order: 2 },
      ]
    },
    {
      materialName: "Bentonite",
      parameters: [
        { parameterName: "Suspension Properties (600 RPM)", requirement: "Min 30", testMethod: "API 13A", order: 1 },
        { parameterName: "Suspension Properties (300 RPM)", requirement: "Report", testMethod: "API 13A", order: 2 },
        { parameterName: "Suspension Properties (200 RPM)", requirement: "Report", testMethod: "API 13A", order: 3 },
        { parameterName: "Suspension Properties (100 RPM)", requirement: "Report", testMethod: "API 13A", order: 4 },
        { parameterName: "Suspension Properties (6 RPM)", requirement: "Report", testMethod: "API 13A", order: 5 },
        { parameterName: "Suspension Properties (3 RPM)", requirement: "Report", testMethod: "API 13A", order: 6 },
        { parameterName: "Plastic Viscosity (PV)", requirement: "Report", testMethod: "API 13A", order: 7 },
        { parameterName: "Yield Point (YP)", requirement: "Max 3 * PV", testMethod: "API 13A", order: 8 },
        { parameterName: "Gel Strength (10 sec / 10 min)", requirement: "Report", testMethod: "API 13A", order: 9 },
        { parameterName: "Filtrate (FL)", requirement: "Max 15.0 ml", testMethod: "API 13A", order: 10 },
      ]
    },
    {
      materialName: "Soltex",
      parameters: [
        { parameterName: "Solubility in Water", requirement: "Min 85%", testMethod: "EMEC Method", order: 1 },
        { parameterName: "Solubility in Oil", requirement: "Min 80%", testMethod: "EMEC Method", order: 2 },
      ]
    }
  ]

  for (const seed of seeds) {
    const exists = await prisma.productSpecification.findUnique({ where: { materialName: seed.materialName } })
    if (!exists) {
      await prisma.productSpecification.create({
        data: {
          materialName: seed.materialName,
          parameters: { create: seed.parameters }
        }
      })
    }
  }
  revalidatePath("/specifications")
}
