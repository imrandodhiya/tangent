import type React from "react"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "../globals.css"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full`}>
      <body className="h-full overflow-hidden font-sans antialiased">
        {/* main is the only scroll container */}
        <main className="h-full overflow-y-auto" style={{ scrollbarGutter: "stable both-edges" }}>
          {children}
        </main>
      </body>
    </html>
  )
}
