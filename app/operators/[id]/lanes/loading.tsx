import { AuthGuard } from "@/components/auth/auth-guard"

export default function OperatorLanesLoading() {
  return (
    <AuthGuard requiredPermissions={["user.view"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="h-8 bg-gray-200 rounded w-32"></div>
              <div>
                <div className="h-8 bg-gray-200 rounded w-96 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-64"></div>
              </div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>

          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    </AuthGuard>
  )
}
