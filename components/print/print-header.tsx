import React, { forwardRef } from 'react';

interface PrintHeaderProps {
  companyName: string;
  companyLogo?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  title: string;
  subtitle?: string;
  reference?: string;
  date?: Date;
}

export const PrintHeader = forwardRef<HTMLDivElement, PrintHeaderProps>(
  ({ companyName, companyLogo, companyAddress, companyPhone, companyEmail, title, subtitle, reference, date }, ref) => {
    return (
      <div ref={ref} className="print-header mb-8 border-b-2 border-gray-800 pb-6">
        {/* Company Info - Top Section */}
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-2">
            {companyLogo && (
              <img src={companyLogo} alt="Company Logo" className="h-12 w-auto mb-2" />
            )}
            <h1 className="text-2xl font-bold text-gray-900">{companyName}</h1>
            {companyAddress && (
              <p className="text-sm text-gray-600">{companyAddress}</p>
            )}
            {companyPhone && (
              <p className="text-sm text-gray-600">Tél: {companyPhone}</p>
            )}
            {companyEmail && (
              <p className="text-sm text-gray-600">Email: {companyEmail}</p>
            )}
          </div>
          
          {/* Document Info - Right Side */}
          <div className="text-right space-y-1">
            <h2 className="text-xl font-bold text-gray-900 uppercase">{title}</h2>
            {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
            {reference && (
              <p className="text-sm font-semibold">
                Réf: <span className="font-mono">{reference}</span>
              </p>
            )}
            {date && (
              <p className="text-sm text-gray-600">
                Date: {date.toLocaleDateString('fr-FR', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            )}
          </div>
        </div>
        
        {/* Print-specific styles */}
        <style jsx>{`
          @media print {
            .print-header {
              page-break-after: avoid;
            }
          }
        `}</style>
      </div>
    );
  }
);

PrintHeader.displayName = 'PrintHeader';
