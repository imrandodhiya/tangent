import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { UserStatus } from "@prisma/client"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
            deletedAt: null,
            status: UserStatus.ACTIVE,
          },
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash)

        if (!isPasswordValid) {
          return null
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role.name,
          permissions: user.role.rolePermissions.map((rp) => rp.permission.code),
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Only enrich token when a user just authenticated
      if (user) {
        // user is the object returned from authorize()
        // It contains role and permissions per your code above
        ;(token as any).role = (user as any).role
        ;(token as any).permissions = (user as any).permissions
      }
      return token
    },
    async session({ session, token }) {
      // When logged out, session.user may be undefined; don't mutate in that case
      if (session?.user) {
        if (token?.sub) {
          ;(session.user as any).id = token.sub as string
        }
        if ((token as any)?.role) {
          ;(session.user as any).role = (token as any).role as string
        }
        if ((token as any)?.permissions) {
          ;(session.user as any).permissions = (token as any).permissions as string[]
        }
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
}
