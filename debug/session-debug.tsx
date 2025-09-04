"use client"

import { useSession } from "next-auth/react"
import { usePermissions } from "@/hooks/use-permissions"

export function SessionDebug() {
  const { data: session, status } = useSession()
  const { permissions, userRole } = usePermissions()

  if (process.env.NODE_ENV !== "development") {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-md z-50">
      <h3 className="font-bold mb-2">Session Debug</h3>
      <div>Status: {status}</div>
      <div>User: {session?.user?.email}</div>
      <div>Role: {userRole}</div>
      <div>Permissions: {permissions.length}</div>
      <details className="mt-2">
        <summary>Full Session</summary>
        <pre className="mt-2 text-xs overflow-auto max-h-40">{JSON.stringify(session, null, 2)}</pre>
      </details>
    </div>
  )
}
