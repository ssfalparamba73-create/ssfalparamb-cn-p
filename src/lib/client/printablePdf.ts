export interface PrintableTable {
  filename: string;
  title: string;
  description: string;
  headers: string[];
  rows: string[][];
  columnWidths?: number[];
  periodLabel: string;
}

function isNumericColumn(header: string): boolean {
  return /\b(amount|total|balance|paid|due|count|quantity|qty)\b/i.test(header);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeFilename(value: string): string {
  return value.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "") || "admin-export";
}

export function buildPrintableHtml(data: PrintableTable): string {
  const columnCount = Math.max(data.headers.length, 1);
  const rawWidths = data.columnWidths?.length === columnCount
    ? data.columnWidths
    : Array.from({ length: columnCount }, () => 100 / columnCount);
  const totalWidth = rawWidths.reduce((sum, width) => sum + (Number.isFinite(width) && width > 0 ? width : 0), 0) || columnCount;
  const widths = rawWidths.map((width) => `${Math.max(1, (Number.isFinite(width) && width > 0 ? width : 1) / totalWidth * 100)}%`);
  const colgroup = widths.map((width) => `<col style="width:${width}">`).join("");
  const head = data.headers.map((header) => `<th scope="col"${isNumericColumn(header) ? ' class="numeric"' : ""}>${escapeHtml(header)}</th>`).join("");
  const body = data.rows.map((row) => {
    const cells = data.headers.map((header, index) => `<td${isNumericColumn(header) ? ' class="numeric"' : ""}>${escapeHtml(row[index] ?? "")}</td>`).join("");
    return `<tr>${cells}</tr>`;
  }).join("");
  const title = escapeHtml(data.title);
  const description = escapeHtml(data.description);
  const recordCount = data.rows.length.toLocaleString("en-IN");
  const generatedAt = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date());

  return `<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${escapeHtml(safeFilename(data.filename))}</title>
        <style>
          :root { color-scheme: light; }
          * { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; background: #fff; color: #111; }
          body { font-family: Arial, "Nirmala UI", sans-serif; font-size: 9pt; line-height: 1.4; }
          .report { width: 100%; }
          .report-head { border-bottom: 1.5px solid #222; margin-bottom: 14px; padding: 0 0 10px; }
          .eyebrow { color: #333; font-size: 8pt; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; }
          h1 { margin: 5px 0; font-size: 18pt; line-height: 1.2; font-weight: 700; }
          .description { margin: 0; color: #333; font-size: 9pt; }
          .meta { display: grid; grid-template-columns: 1fr auto; align-items: end; gap: 4px 12px; margin-top: 10px; color: #333; font-size: 8pt; }
          .meta span:last-child { text-align: right; }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          thead { display: table-header-group; }
          th { background: #fff; color: #111; font-weight: 700; text-align: left; border-top: 1.5px solid #222; border-bottom: 1.5px solid #222; }
          th, td { border-bottom: 1px solid #999; padding: 6px 6px; vertical-align: top; overflow-wrap: anywhere; word-break: break-word; line-height: 1.35; }
          td { color: #222; }
          .numeric { text-align: right; font-variant-numeric: tabular-nums; }
          tr { break-inside: avoid; page-break-inside: avoid; }
          .empty { padding: 20px; color: #444; text-align: center; }
          @page { size: A4 portrait; margin: 14mm 12mm 18mm; @bottom-left { content: "SSF Alparamba | Admin export"; color: #444; font-size: 8pt; } @bottom-right { content: "Page " counter(page) " of " counter(pages); color: #444; font-size: 8pt; } }
          @media screen {
            body { min-height: 100vh; background: #e5e5e5; padding: 16px; }
            .report { width: min(100%, 210mm); min-height: 297mm; margin: 0 auto; padding: 14mm 12mm; background: #fff; border: 1px solid #aaa; }
          }
          @media print { html, body { background: #fff; } .report { width: auto; min-height: 0; max-width: none; margin: 0; border: 0; padding: 0; } }
        </style>
      </head>
      <body>
        <main class="report">
          <header class="report-head">
            <div class="eyebrow">SSF Alparamba · Admin export</div>
            <h1>${title}</h1>
            <p class="description">${description}</p>
            <div class="meta"><span>Period: ${escapeHtml(data.periodLabel)}</span><span>${recordCount} records · Generated ${escapeHtml(generatedAt)}</span></div>
          </header>
          <table>
            <colgroup>${colgroup}</colgroup>
            <thead><tr>${head}</tr></thead>
            <tbody>${body || `<tr><td class="empty" colspan="${columnCount}">No records match this date filter.</td></tr>`}</tbody>
          </table>
        </main>
      </body>
    </html>`;
}
