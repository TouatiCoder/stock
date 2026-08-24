"use client";

interface PrintHeaderProps {
  title: string;
  subtitle?: string;
  docNumber?: string;
  company?: string;
}

export function PrintHeader({ title, subtitle, docNumber, company }: PrintHeaderProps) {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="print-only hidden">
      {/* Brand + date row */}
      <div className="flex items-start justify-between pb-4 mb-5" style={{ borderBottom: "2px solid #1f2937" }}>
        <div>
          <p className="text-xl font-bold text-gray-900">BuildStock Pro</p>
          {company && <p className="text-sm text-gray-600 mt-0.5">{company}</p>}
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Generated: {today}</p>
          {docNumber && <p className="text-xs text-gray-400 mt-0.5">Ref: {docNumber}</p>}
        </div>
      </div>

      {/* Document title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
