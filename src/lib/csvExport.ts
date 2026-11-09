function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function downloadCsv(filename: string, headers: string[], rows: string[][]): void {
  const lines = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(",")),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function fetchAllPages<T>(
  fetchPage: (page: number) => Promise<{ data: T[]; total: number }>,
  limit = 100,
): Promise<T[]> {
  const first = await fetchPage(1);
  const items = [...first.data];
  const pages = Math.ceil(first.total / limit);
  for (let page = 2; page <= pages; page += 1) {
    const next = await fetchPage(page);
    items.push(...next.data);
  }
  return items;
}
