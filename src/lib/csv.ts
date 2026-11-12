import { NextResponse } from "next/server";

export type CsvCell = string | number | boolean | null | undefined;

const FORMULA_PREFIX = /^[=+\-@\t\r]/;

function escapeCell(value: CsvCell) {
  if (value === null || value === undefined) return "";
  let text = String(value);
  // Prevent spreadsheet formula injection while preserving readable output.
  if (FORMULA_PREFIX.test(text)) text = `'${text}`;
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildCsv(headers: string[], rows: CsvCell[][]) {
  const lines = [
    headers.map(escapeCell).join(","),
    ...rows.map((row) => row.map(escapeCell).join(",")),
  ];
  // UTF-8 BOM keeps Arabic text readable when opened directly in Excel.
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

export function csvResponse(
  filename: string,
  headers: string[],
  rows: CsvCell[][],
) {
  return new NextResponse(buildCsv(headers, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
