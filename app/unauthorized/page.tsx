"use client"

import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function UnauthorizedPage() {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Access Denied</CardTitle>
          <CardDescription className="text-gray-600">You don't have permission to access this page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {session && (
            <div className="bg-gray-100 p-3 rounded-lg text-sm space-y-2">
              <p>
                <strong>User:</strong> {session.user.email}
              </p>
              <p>
                <strong>Role:</strong> {session.user.role}
              </p>
              <p>
                <strong>Permissions:</strong> {session.user.permissions?.length || 0}
              </p>
              {session.user.permissions && session.user.permissions.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer font-medium">View All Permissions</summary>
                  <div className="mt-2 max-h-32 overflow-y-auto text-xs bg-white p-2 rounded border">
                    {session.user.permissions.map((permission, index) => (
                      <div key={index} className="py-1 border-b last:border-b-0">
                        {permission}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/auth/login">Sign In Again</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
