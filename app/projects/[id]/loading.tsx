
// app/projects/[id]/loading.tsx
export default function Loading() {
  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="space-y-6">
              {/* Header Skeleton */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                <div>
                  <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>

              {/* Content Skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Project Details Skeleton */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                    <div className="h-6 w-1/4 bg-gray-200 rounded mb-4"></div>
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="h-4 w-20 bg-gray-200 rounded"></div>
                          <div className="h-4 flex-1 bg-gray-200 rounded"></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Load Calculations Skeleton */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                    <div className="h-6 w-1/3 bg-gray-200 rounded mb-4"></div>
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-20 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Materials List Skeleton */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                  <div className="h-6 w-1/3 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-12 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}