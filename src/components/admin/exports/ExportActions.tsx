"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Download, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { requestBackend } from "@/lib/api/backendClient";
import { downloadCsv } from "@/lib/client/downloadCsv";
import { buildPrintableHtml, type PrintableTable } from "@/lib/client/printablePdf";
import { cn } from "@/lib/utils";

export interface ExportRow {
  values: string[];
  /** ISO date used for filtering. It is intentionally separate from display values. */
  date?: string | null;
}

export interface ExportTableData {
  headers: string[];
  rows: ExportRow[];
}

export interface ExportDateRange {
  from?: string;
  to?: string;
  label: string;
  mode: DateMode;
}

type DateMode = "all" | "month" | "range";
type ExportFilterKind = "payment-date" | "dues-month";

interface ExportActionsProps {
  filename: string;
  title: string;
  description: string;
  getData: (range: ExportDateRange) => Promise<ExportTableData>;
  columnWidths?: number[];
  className?: string;
  disabled?: boolean;
  showDateFilters?: boolean;
  filtersInPreview?: boolean;
  filterKind?: ExportFilterKind;
  initialDateMode?: DateMode;
}

function localDateBounds(start: Date, end: Date): Pick<ExportDateRange, "from" | "to"> {
  return { from: start.toISOString(), to: end.toISOString() };
}

function resolveRange(
  mode: DateMode,
  month: string,
  startDate: string,
  endDate: string,
  filterKind: ExportFilterKind,
): ExportDateRange {
  if (mode === "all") return { label: "All dates", mode };
  if (mode === "month") {
    if (!/^\d{4}-\d{2}$/.test(month)) throw new Error("Choose a month to filter the export.");
    const [year, monthNumber] = month.split("-").map(Number);
    if (monthNumber < 1 || monthNumber > 12) throw new Error("Choose a valid month.");
    const start = new Date(year, monthNumber - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, monthNumber, 0, 23, 59, 59, 999);
    return { ...localDateBounds(start, end), label: start.toLocaleDateString("en-IN", { month: "long", year: "numeric" }), mode };
  }

  if (filterKind === "dues-month") {
    if (!startDate || !endDate) throw new Error("Choose both the first and last dues months.");
    if ((startDate && !/^\d{4}-\d{2}$/.test(startDate)) || (endDate && !/^\d{4}-\d{2}$/.test(endDate))) {
      throw new Error("Choose a valid dues month.");
    }
    if (startDate && endDate && startDate > endDate) throw new Error("First month must be on or before the last month.");
    const [startYear, startMonth] = startDate.split("-").map(Number);
    const [endYear, endMonth] = endDate.split("-").map(Number);
    const start = new Date(startYear, startMonth - 1, 1, 0, 0, 0, 0);
    const end = new Date(endYear, endMonth, 0, 23, 59, 59, 999);
    return { from: start.toISOString(), to: end.toISOString(), label: `${startDate} – ${endDate}`, mode };
  }

  if (!startDate && !endDate) throw new Error("Choose a start date, an end date, or both.");
  if (startDate && endDate && startDate > endDate) throw new Error("Start date must be on or before the end date.");
  const [startYear, startMonth, startDay] = (startDate || endDate).split("-").map(Number);
  const [endYear, endMonth, endDay] = (endDate || startDate).split("-").map(Number);
  const start = startDate ? new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0) : new Date(0);
  const end = endDate ? new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999) : new Date(8_640_000_000_000_000);
  const from = startDate ? start.toISOString() : undefined;
  const to = endDate ? end.toISOString() : undefined;
  const label = startDate && endDate ? `${startDate} – ${endDate}` : startDate ? `From ${startDate}` : `Through ${endDate}`;
  return { from, to, label, mode };
}

function periodFilename(filename: string, range: ExportDateRange): string {
  const suffix = range.from || range.to
    ? range.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    : "all-dates";
  return `${filename}-${suffix}`;
}

export function ExportActions({
  filename,
  title,
  description,
  getData,
  columnWidths,
  className,
  disabled = false,
  showDateFilters = true,
  filtersInPreview = false,
  filterKind = "payment-date",
  initialDateMode = filterKind === "dues-month" ? "month" : showDateFilters ? "range" : "all",
}: ExportActionsProps) {
  const [dateMode, setDateMode] = useState<DateMode>(initialDateMode);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);
  const [preview, setPreview] = useState<{ html: string; title: string } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [printFrame, setPrintFrame] = useState<HTMLIFrameElement | null>(null);
  // Keep date inputs visible for payment exports even if an already-mounted tab
  // retained the previous "all dates" state during hot reload.
  const showRangeDates = dateMode === "range" || (dateMode === "all" && filterKind === "payment-date");

  function changeDateMode(value: DateMode) {
    setDateMode(value);
    if (value === "all") {
      setStartDate("");
      setEndDate("");
    }
    setPreview(null);
  }

  useEffect(() => {
    if (!previewOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPreviewOpen(false);
        setPreview(null);
        setPrintFrame(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewOpen]);

  async function prepare(format: "csv" | "pdf", useDateFilter = true) {
    if (exporting) return null;
    setExporting(format);
    try {
      const range = useDateFilter ? resolveRange(dateMode, month, startDate, endDate, filterKind) : { label: "All dates", mode: "all" as const };
      // Pin the query's upper bound so new rows cannot shift offset pagination mid-export.
      const queryRange = { ...range, to: range.to ?? new Date().toISOString() };
      await requestBackend<boolean>("/api/v1/admin/exports/audit", {
        method: "POST",
        body: JSON.stringify({ phase: "authorize" }),
      });
      const data = await getData(queryRange);
      const rows = filterKind === "payment-date" && (range.from || range.to)
        ? data.rows.filter((row) => {
          if (!row.date) return false;
          const timestamp = Date.parse(row.date);
          if (!Number.isFinite(timestamp)) return false;
          return (!queryRange.from || timestamp >= Date.parse(queryRange.from)) && timestamp <= Date.parse(queryRange.to);
        })
        : data.rows;

      if (format === "csv") {
        const csvRows = [data.headers, ...rows.map((row) => row.values)];
        const audit = await requestBackend<boolean>("/api/v1/admin/exports/audit", {
          method: "POST",
          body: JSON.stringify({ phase: "complete", format, title, rowCount: rows.length, from: range.from, to: queryRange.to }),
        });
        void audit;
        downloadCsv(`${periodFilename(filename, range)}.csv`, csvRows);
        toast.success(`${title} CSV downloaded (${rows.length.toLocaleString("en-IN")} rows).`);
        return;
      }

      const printable: PrintableTable = {
        filename: periodFilename(filename, range),
        title,
        description,
        headers: data.headers,
        rows: rows.map((row) => row.values),
        columnWidths,
        periodLabel: range.label,
      };
      const html = buildPrintableHtml(printable);
      const audit = await requestBackend<boolean>("/api/v1/admin/exports/audit", {
        method: "POST",
        body: JSON.stringify({ phase: "complete", format, title, rowCount: rows.length, from: range.from, to: queryRange.to }),
      });
      void audit;
      setPreviewOpen(true);
      setPreview({ html, title });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Unable to export ${title.toLowerCase()}.`);
    } finally {
      setExporting(null);
    }
  }

  function closePreview() {
    setPreviewOpen(false);
    setPreview(null);
    setPrintFrame(null);
  }

  return <>
    <div className={cn("flex flex-col gap-2", className)}>
      {showDateFilters && !filtersInPreview && <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center">
        <label className="sr-only" htmlFor={`${filename}-date-mode`}>{filterKind === "dues-month" ? "Filter dues by month" : "Filter export by date"}</label>
        <Select value={dateMode} onValueChange={(value) => changeDateMode(value as DateMode)}>
          <SelectTrigger id={`${filename}-date-mode`} className="h-10 w-full border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950 sm:w-[150px]">
            <CalendarDays className="mr-2 size-4 text-slate-500" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {filterKind === "payment-date" && <SelectItem value="all">All dates</SelectItem>}
            <SelectItem value="month">By month</SelectItem>
            <SelectItem value="range">Date range</SelectItem>
          </SelectContent>
        </Select>
        {dateMode === "month" && <input aria-label="Export month" type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />}
          {showRangeDates && <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
            {filterKind === "dues-month" && <>
              <input aria-label="First dues month" type="month" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="h-10 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
              <input aria-label="Last dues month" type="month" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="h-10 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
            </>}
            {filterKind === "payment-date" && <>
              <input aria-label="Export start date" type="date" value={startDate} onChange={(event) => { setStartDate(event.target.value); setDateMode("range"); }} className="h-10 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
              <input aria-label="Export end date" type="date" value={endDate} onChange={(event) => { setEndDate(event.target.value); setDateMode("range"); }} className="h-10 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
            </>}
        </div>}
      </div>}
      <div role="group" aria-label={`${title} export formats`} className="grid w-full grid-cols-2 items-center gap-2 sm:inline-flex sm:w-auto">
        <Button type="button" variant="outline" onClick={() => void prepare("csv", !filtersInPreview)} disabled={disabled || exporting !== null} aria-label={`Export ${title} as CSV${filtersInPreview ? " (all dates)" : ""}`} className="h-10 min-w-0 shrink-0 border-slate-300 px-2 text-slate-700 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 sm:px-3">
          <Download className="mr-2 size-4" />{exporting === "csv" ? "Exporting…" : "CSV"}
        </Button>
        <Button type="button" variant="outline" onClick={() => filtersInPreview ? (setPreview(null), setPreviewOpen(true)) : void prepare("pdf")} disabled={disabled || exporting !== null} aria-label={`Preview ${title} as PDF`} className="h-10 min-w-0 shrink-0 border-slate-300 px-2 text-slate-700 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 sm:px-3">
          <FileText className="mr-2 size-4" />PDF preview
        </Button>
      </div>
    </div>

    {previewOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-2 sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closePreview(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby={`${filename}-preview-title`} className={cn("flex h-auto max-h-[94dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50", preview && "h-[min(88dvh,900px)]")}>
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800 sm:px-6">
          <div className="min-w-0">
            <h2 id={`${filename}-preview-title`} className="text-lg font-semibold">{title} · PDF preview</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{filterKind === "dues-month" ? "Choose the dues months, preview the unpaid members, then save as PDF." : "Choose a period, preview the report, then save it as a PDF."}</p>
          </div>
          <Button type="button" variant="outline" onClick={closePreview} aria-label="Close PDF preview" className="h-10 w-10 shrink-0 px-0 dark:border-slate-700 dark:hover:bg-slate-800"><X className="size-4" /></Button>
        </header>
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:flex-wrap sm:items-end sm:px-6">
          {filtersInPreview && showDateFilters && <>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-none">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300" htmlFor={`${filename}-date-mode`}>{filterKind === "dues-month" ? "Filter dues period" : "Filter by date"}</label>
              <Select value={dateMode} onValueChange={(value) => changeDateMode(value as DateMode)}>
                <SelectTrigger id={`${filename}-date-mode`} className="h-10 w-full border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950 sm:w-[170px]">
                  <CalendarDays className="mr-2 size-4 text-slate-500" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filterKind === "payment-date" && <SelectItem value="all">All dates</SelectItem>}
                  <SelectItem value="month">By month</SelectItem>
                  <SelectItem value="range">Date range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {dateMode === "month" && <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-none">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300" htmlFor={`${filename}-month`}>Month</label>
              <input id={`${filename}-month`} aria-label="Export month" type="month" value={month} onChange={(event) => { setMonth(event.target.value); setPreview(null); }} className="h-10 min-w-0 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
            </div>}
            {showRangeDates && <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex min-w-0 flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300" htmlFor={`${filename}-start-date`}>{filterKind === "dues-month" ? "First month" : "Start date"}</label>
                <input id={`${filename}-start-date`} aria-label={filterKind === "dues-month" ? "First dues month" : "Export start date"} type={filterKind === "dues-month" ? "month" : "date"} value={startDate} onChange={(event) => { setStartDate(event.target.value); setDateMode("range"); setPreview(null); }} className="h-10 min-w-0 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
              </div>
              <div className="flex min-w-0 flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300" htmlFor={`${filename}-end-date`}>{filterKind === "dues-month" ? "Last month" : "End date"}</label>
                <input id={`${filename}-end-date`} aria-label={filterKind === "dues-month" ? "Last dues month" : "Export end date"} type={filterKind === "dues-month" ? "month" : "date"} value={endDate} onChange={(event) => { setEndDate(event.target.value); setDateMode("range"); setPreview(null); }} className="h-10 min-w-0 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
              </div>
            </div>}
          </>}
          {filtersInPreview && <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row">
            <Button type="button" variant="outline" onClick={() => void prepare("csv")} disabled={disabled || exporting !== null} className="h-10 w-full border-slate-300 dark:border-slate-700 dark:hover:bg-slate-800 sm:w-auto">
              <Download className="mr-2 size-4" />{exporting === "csv" ? "Exporting…" : "Download CSV"}
            </Button>
            <Button type="button" onClick={() => void prepare("pdf")} disabled={disabled || exporting !== null} className="h-10 w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto">
              <FileText className="mr-2 size-4" />{exporting === "pdf" ? "Preparing…" : preview ? "Update preview" : "Generate preview"}
            </Button>
          </div>}
        </div>
        {preview ? <iframe
          ref={setPrintFrame}
          srcDoc={preview.html}
          title={`${preview.title} PDF preview`}
          className="min-h-0 flex-1 bg-slate-100"
          onLoad={(event) => setPrintFrame(event.currentTarget)}
        /> : <div className="flex min-h-[96px] items-center justify-center bg-slate-50 px-6 text-center text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400 sm:min-h-[140px]">
          Select a period above and generate the PDF preview.
        </div>}
        {preview && <footer className="flex flex-col-reverse gap-2 border-t border-slate-200 px-4 py-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-slate-500 dark:text-slate-400">Choose “Save as PDF” in the browser print dialog.</p>
          <Button type="button" onClick={() => { printFrame?.contentWindow?.focus(); printFrame?.contentWindow?.print(); }} disabled={!printFrame} className="h-10 w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto">
            <Download className="mr-2 size-4" />Download PDF
          </Button>
        </footer>}
      </section>
    </div>}
  </>;
}
