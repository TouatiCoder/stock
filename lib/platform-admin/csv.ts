/**
 * CSV serialisation for the platform admin exports.
 *
 * Kept separate from the service so the escaping rules can be tested on their
 * own: a value containing a comma, a quote, a newline or a semicolon has to
 * survive the round trip into Excel / Google Sheets unchanged.
 */

export interface CsvColumn<T> {
  /** Column header, already translated by the caller. */
  header: string;
  value: (row: T) => string | number | null | undefined;
}

/** RFC 4180 quoting: wrap in quotes when needed, double the inner quotes. */
export function escapeCsvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (text === "") return "";
  // A leading =, +, - or @ makes Excel evaluate the cell as a formula.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  if (/[",;\r\n]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const lines = [columns.map((column) => escapeCsvValue(column.header)).join(",")];
  for (const row of rows) {
    lines.push(columns.map((column) => escapeCsvValue(column.value(row))).join(","));
  }
  return lines.join("\r\n");
}

/**
 * Excel only detects UTF-8 in a CSV when the file starts with a BOM; without it
 * "Société" arrives as "SociÃ©tÃ©".
 */
export const CSV_BOM = "﻿";

export function toCsvFile<T>(rows: T[], columns: CsvColumn<T>[]): string {
  return CSV_BOM + toCsv(rows, columns);
}

/** `companies-2026-09-28.csv` - stable, sortable, no spaces. */
export function csvFileName(prefix: string, date = new Date()): string {
  const iso = date.toISOString().slice(0, 10);
  return `${prefix}-${iso}.csv`;
}
