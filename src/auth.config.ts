import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcrypt"
// We cannot use prisma here directly if we want to run in edge middleware.
// But we actually need to look up the user for credentials. Wait, `authorize` in Credentials provider CANNOT be run on edge if it imports Node.js libs (like bcrypt or prisma with better-sqlite3).
// NextAuth will run `authorize` in the Node environment during the POST request to /api/auth/callback/credentials.
// The issue is simply that the middleware cannot *import* the adapter/prisma.

// Therefore, we define the config here. We'll pass the adapter in auth.ts.
export default {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials")
        }
        
        const email = credentials.email as string
        const password = credentials.password as string

        // Strict Domain Whitelisting
        const allowedDomain = process.env.CORPORATE_DOMAIN || "@emec.co"
        if (!email.endsWith(allowedDomain)) {
          throw new Error("Unauthorized domain")
        }

        // We dynamically import prisma and bcrypt to avoid edge import issues in middleware
        const { prisma } = await import("@/lib/prisma")
        const bcryptModule = await import("bcrypt")

        const user = await prisma.user.findUnique({
          where: { email }
        })

        if (!user || !user.password) {
          throw new Error("User not found")
        }

        const isPasswordValid = await bcryptModule.compare(password, user.password)

        if (!isPasswordValid) {
          throw new Error("Invalid password")
        }

        return user
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    }
  }
} satisfies NextAuthConfig
