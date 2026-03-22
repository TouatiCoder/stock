"use client";

import type { ReactNode } from "react";

type Props = {
  title: string;
  controls?: ReactNode;
  loading: boolean;
  error: string | null;
  headers: string[];
  colSpan: number;
  emptyLabel?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function StripeOpsTable({
  title,
  controls,
  loading,
  error,
  headers,
  colSpan,
  emptyLabel = "No records found",
  children,
  footer,
}: Props) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-gray-100 p-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {controls}
      </div>

      {loading && <div className="p-6 text-sm text-gray-500">Loading...</div>}
      {error && <div className="p-6 text-sm text-red-600">{error}</div>}

      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                {headers.map((header) => (
                  <th key={header} className="px-4 py-3">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {children || (
                <tr>
                  <td colSpan={colSpan} className="px-4 py-6 text-center text-gray-500">
                    {emptyLabel}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {footer && <div className="border-t border-gray-100 p-4">{footer}</div>}
    </section>
  );
}
