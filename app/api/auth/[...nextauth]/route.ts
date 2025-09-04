import NextAuth from "next-auth"
import { authOptions as nextAuthOptions } from "@/lib/auth"

const handler = NextAuth(nextAuthOptions)
export { handler as GET, handler as POST }

// Re-export so other modules importing from this route keep working
export { authOptions } from "@/lib/auth"
