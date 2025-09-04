import { AuthGuard } from "@/components/auth/auth-guard"

export default function EditTournamentLoading() {
  return (
    <AuthGuard requiredPermissions={["tournament.edit"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-8 bg-gray-200 rounded w-32"></div>
            <div>
              <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-64"></div>
            </div>
          </div>

          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>

          <div className="flex justify-end gap-4">
            <div className="h-10 bg-gray-200 rounded w-20"></div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
