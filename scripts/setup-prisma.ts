import { execSync } from "child_process"

async function setupPrisma() {
  try {
    console.log("🔄 Setting up Prisma...")

    // Generate Prisma client
    console.log("📦 Generating Prisma client...")
    execSync("npx prisma generate", { stdio: "inherit" })

    // Push schema to database
    console.log("🗄️ Pushing schema to database...")
    execSync("npx prisma db push", { stdio: "inherit" })

    console.log("✅ Prisma setup completed successfully!")
    console.log("💡 You can now run: npm run seed")
  } catch (error) {
    console.error("❌ Error setting up Prisma:", error)
    process.exit(1)
  }
}

setupPrisma()
