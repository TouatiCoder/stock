export default function StripeOperationsLoading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />
    </div>
  );
}
