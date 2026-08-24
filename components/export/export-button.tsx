"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonHTMLAttributes } from "react";

interface ExportButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  onExport: () => void;
  label?: string;
  disabled?: boolean;
}

export function ExportButton({ 
  onExport, 
  label = "Exporter CSV", 
  disabled = false,
  className,
  ...buttonProps 
}: ExportButtonProps) {
  const handleClick = () => {
    try {
      onExport();
    } catch (error) {
      console.error("Export error:", error);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled}
      variant="outline"
      className={`flex items-center gap-2 ${className || ''}`}
      {...buttonProps}
    >
      <Download className="h-4 w-4" />
      {label}
    </Button>
  );
}
