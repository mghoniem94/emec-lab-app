import { prisma } from '../src/lib/prisma'
import bcrypt from 'bcrypt'

async function main() {
  const email = "mohamed.ghoniem@emec.co"
  const password = await bcrypt.hash("EmecLab2026!", 10)

  console.log("Starting database seeding...")

  // Seed the admin user
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password,
    },
    create: {
      email,
      name: "Mohamed Ghoniem",
      password,
    },
  })

  console.log(`✅ Seeded administrative user: ${user.email}`)

  // Seed initial specifications
  const specs = [
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

  for (const spec of specs) {
    const existing = await prisma.productSpecification.findUnique({
      where: { materialName: spec.materialName }
    })
    
    if (!existing) {
      await prisma.productSpecification.create({
        data: {
          materialName: spec.materialName,
          parameters: {
            create: spec.parameters
          }
        }
      })
      console.log(`✅ Seeded product specification: ${spec.materialName}`)
    } else {
      console.log(`ℹ️ Product specification ${spec.materialName} already exists, skipping.`)
    }
  }

  console.log("Seeding process completed successfully!")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error("❌ Seeding failed with error:", e)
    await prisma.$disconnect()
    process.exit(1)
  })
