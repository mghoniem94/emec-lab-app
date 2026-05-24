import { prisma } from './src/lib/prisma'
import bcrypt from 'bcrypt'

async function main() {
  const email = "admin@company.com"
  const password = await bcrypt.hash("password123", 10)
  
  await prisma.user.upsert({
    where: { email },
    update: {
      password
    },
    create: {
      email,
      name: "Admin User",
      password
    }
  })
  
  console.log("Seeded user admin@company.com with password 'password123'")
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
