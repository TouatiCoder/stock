"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PrintButtonProps {
  title?: string;
  className?: string;
  onClick?: () => void;
}

export function PrintButton({ title = "Imprimer", className, onClick }: PrintButtonProps) {
  const handlePrint = () => {
    if (onClick) {
      onClick();
    }
    // Trigger browser print dialog
    window.print();
  };

  return (
    <Button
      onClick={handlePrint}
      className={`flex items-center gap-2 ${className || ""}`}
      variant="outline"
    >
      <Printer className="h-4 w-4" />
      {title}
    </Button>
  );
}
