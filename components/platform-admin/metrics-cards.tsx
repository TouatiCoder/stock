"use client";

type MetricItem = {
  label: string;
  value: string | number;
};

export function MetricsCards({ items }: { items: MetricItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">{item.label}</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

