import { seedInitialSpecifications } from './src/app/actions'

seedInitialSpecifications()
  .then(() => {
    console.log("Seeding complete.")
    process.exit(0)
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
