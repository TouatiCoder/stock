// app/dashboard/loading.tsx
export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse"></div>
        <div className="h-4 w-64 bg-slate-200 rounded animate-pulse"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-6 space-y-2 bg-white rounded-lg shadow">
            <div className="h-4 w-24 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-8 w-16 bg-slate-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 bg-white rounded-lg shadow">
          <div className="h-6 w-32 bg-slate-200 rounded animate-pulse mb-4"></div>
          <div className="h-64 bg-slate-200 rounded animate-pulse"></div>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="h-6 w-32 bg-slate-200 rounded animate-pulse mb-4"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}