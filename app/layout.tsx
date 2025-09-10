import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { AuthSessionProvider } from "@/components/auth/session-provider"
import { Navigation } from "@/components/layout/navigation"
import { Toaster } from "@/components/ui/toaster"
import { SessionDebug } from "@/components/debug/session-debug"

export const metadata: Metadata = {
  title: "Bowling Tournament Management",
  description: "Complete tournament management system for bowling competitions",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full`}>
      <body className="h-full overflow-hidden font-sans antialiased">
        <AuthSessionProvider>
          <div className="flex h-full bg-gray-50 dark:bg-gray-900">
            <Navigation />
            {/* main scrolls; page itself doesn't create a second browser scrollbar */}
            <main className="flex-1 overflow-y-auto" style={{ scrollbarGutter: "stable both-edges" }}>
              <div className="min-h-full">{children}</div>
            </main>
          </div>
          <Toaster />
          <SessionDebug />
        </AuthSessionProvider>
      </body>
    </html>
  )
}
