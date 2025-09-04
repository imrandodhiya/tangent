"use client"

import { useSession } from "next-auth/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff } from "lucide-react"

export function SessionDebug() {
  const { data: session, status } = useSession()
  const [isVisible, setIsVisible] = useState(false)

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button variant="outline" size="sm" onClick={() => setIsVisible(true)} className="bg-white/90 backdrop-blur-sm">
          <Eye className="h-4 w-4 mr-2" />
          Debug Session
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="bg-white/95 backdrop-blur-sm border shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Session Debug</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)} className="h-6 w-6 p-0">
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div>
            <span className="font-medium">Status:</span>{" "}
            <Badge variant={status === "authenticated" ? "default" : "secondary"}>{status}</Badge>
          </div>
          {session?.user && (
            <>
              <div>
                <span className="font-medium">Email:</span> {session.user.email}
              </div>
              <div>
                <span className="font-medium">Role:</span> {session.user.role}
              </div>
              <div>
                <span className="font-medium">Permissions:</span>
                <div className="mt-1 max-h-20 overflow-y-auto">
                  {session.user.permissions?.length ? (
                    session.user.permissions.map((permission) => (
                      <Badge key={permission} variant="outline" className="mr-1 mb-1 text-xs">
                        {permission}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-500">None</span>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
