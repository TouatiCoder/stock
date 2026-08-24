"use client";

import { Printer } from "lucide-react";

interface PrintButtonProps {
  label?: string;
  className?: string;
}

export function PrintButton({ label = "Print / Export PDF", className = "" }: PrintButtonProps) {
  return (
    <button
      onClick={() => window.print()}
      className={`no-print flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors ${className}`}
    >
      <Printer size={15} />
      {label}
    </button>
  );
}
