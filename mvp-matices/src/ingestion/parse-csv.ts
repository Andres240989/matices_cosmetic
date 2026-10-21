const DELIMITERS = [";", ",", "\t"] as const;

/** Picks the delimiter that appears most often in the first line, outside quotes. */
function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0]?.replace(/"[^"]*"/g, "") ?? "";
  let best: string = ",";
  let bestCount = 0;
  for (const delimiter of DELIMITERS) {
    const count = firstLine.split(delimiter).length - 1;
    if (count > bestCount) [best, bestCount] = [delimiter, count];
  }
  return best;
}

/** RFC 4180 CSV: quoted fields, doubled quotes, newlines inside quotes. Empty cells become `null`. */
export function parseCsv(text: string): (string | null)[][] {
  const source = text.replace(/^﻿/, "");
  const delimiter = detectDelimiter(source);
  const rows: (string | null)[][] = [];
  let row: (string | null)[] = [];
  let field = "";
  let inQuotes = false;

  const endField = () => {
    row.push(field.trim() === "" ? null : field);
    field = "";
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (inQuotes) {
      if (char === '"' && source[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') inQuotes = false;
      else field += char;
    } else if (char === '"') inQuotes = true;
    else if (char === delimiter) endField();
    else if (char === "\n") endRow();
    else if (char !== "\r") field += char;
  }
  if (field !== "" || row.length > 0) endRow();
  return rows;
}
