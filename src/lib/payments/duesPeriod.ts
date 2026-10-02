export type DuesFrequency = "monthly" | "bimonthly" | "quarterly";

const MONTHS_PER_FREQUENCY: Record<DuesFrequency, number> = {
  monthly: 1,
  bimonthly: 2,
  quarterly: 3,
};

function currentIndiaMonth(now: Date): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  return { year, month };
}

export function getDuesMonthKeys(frequency: DuesFrequency, now = new Date()): string[] {
  const { year, month } = currentIndiaMonth(now);
  const count = MONTHS_PER_FREQUENCY[frequency];

  return Array.from({ length: count }, (_, offset) => {
    const date = new Date(Date.UTC(year, month - 1 + offset, 1));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

export function formatDuesPeriod(monthKeys: string[]): string {
  const labels = monthKeys.map((monthKey) => {
    const [year, month] = monthKey.split("-").map(Number);
    return new Intl.DateTimeFormat("en-IN", {
      month: "long",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    }).format(new Date(Date.UTC(year, month - 1, 1)));
  });

  return labels.length > 1 ? `${labels[0]} – ${labels[labels.length - 1]}` : labels[0] ?? "";
}

export function isDuesFrequency(value: unknown): value is DuesFrequency {
  return value === "monthly" || value === "bimonthly" || value === "quarterly";
}
