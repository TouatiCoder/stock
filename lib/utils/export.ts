/**
 * Export Utility Functions for BuildStock Pro
 * 
 * Provides CSV, Excel, and PDF export capabilities
 */

/**
 * Convert array of objects to CSV format
 */
export function convertToCSV<T extends Record<string, any>>(data: T[], options?: {
  separator?: string;
  headers?: Partial<Record<keyof T, string>>;
  excludeKeys?: string[];
}): string {
  const separator = options?.separator || ',';
  const excludeKeys = options?.excludeKeys || [];
  
  if (!data || data.length === 0) {
    return '';
  }

  // Get all keys from first row, excluding specified keys
  const allKeys = Object.keys(data[0]).filter(key => !excludeKeys.includes(key));
  
  // Use custom headers if provided, otherwise use keys as-is
  const headers = options?.headers 
    ? allKeys.map(key => {
        const customHeader = options.headers![key as keyof T];
        return customHeader ? String(customHeader) : String(key);
      })
    : allKeys;

  // Create CSV rows
  const rows = [
    // Header row
    headers.map(header => `"${String(header).replace(/"/g, '""')}"`).join(separator),
    
    // Data rows
    ...data.map(row => 
      allKeys.map(key => {
        const value = row[key];
        
        // Handle null/undefined
        if (value === null || value === undefined) {
          return '""';
        }
        
        // Handle dates
        if (value instanceof Date) {
          return `"${value.toISOString().split('T')[0]}"`;
        }
        
        // Handle numbers
        if (typeof value === 'number') {
          return String(value);
        }
        
        // Handle strings - escape quotes and wrap in quotes
        const escaped = String(value).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(separator)
    )
  ];

  return rows.join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Add BOM for Excel UTF-8 compatibility
  const BOM = '\uFEFF';
  const csvWithBOM = BOM + csvContent;
  
  // Create blob
  const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
  
  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.href = url;
  link.setAttribute('download', filename);
  link.setAttribute('charset', 'utf-8');
  
  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Export table data to CSV
 */
export function exportTableToCSV<T extends Record<string, any>>(options: {
  data: T[];
  filename: string;
  headers?: Partial<Record<keyof T, string>>;
  excludeKeys?: string[];
}): void {
  const csv = convertToCSV(options.data, {
    headers: options.headers,
    excludeKeys: options.excludeKeys,
  });
  
  if (csv) {
    downloadCSV(csv, options.filename);
  }
}

/**
 * Format number for export (with thousand separators)
 */
export function formatNumberForExport(value: number | null | undefined, locale: string = 'fr-FR'): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format currency for export
 */
export function formatCurrencyForExport(
  value: number | null | undefined,
  currency: string = 'MAD',
  locale: string = 'fr-FR'
): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format date for export
 */
export function formatDateForExport(date: Date | string | null | undefined, locale: string = 'fr-FR'): string {
  if (!date) {
    return '';
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dateObj);
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(prefix: string, extension: string = 'csv'): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  // Sanitize prefix - remove spaces and special characters
  const sanitizedPrefix = prefix
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '_')
    .replace(/_+/g, '_');
  
  return `${sanitizedPrefix}_${year}${month}${day}_${hours}${minutes}.${extension}`;
}
