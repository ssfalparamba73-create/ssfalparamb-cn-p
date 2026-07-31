"use client";

const BLOCK_OPTIONS_KEY = "ssf-safe:block-options:v1";
const BLOCK_OPTIONS_MAX_AGE = 24 * 60 * 60 * 1000;

interface StoredBlockOptions {
  values: string[];
  savedAt: number;
}

export function readCachedBlockOptions(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(BLOCK_OPTIONS_KEY);
    if (!raw) return [];
    const stored = JSON.parse(raw) as StoredBlockOptions;
    if (
      !Array.isArray(stored.values) ||
      typeof stored.savedAt !== "number" ||
      Date.now() - stored.savedAt > BLOCK_OPTIONS_MAX_AGE
    ) {
      window.localStorage.removeItem(BLOCK_OPTIONS_KEY);
      return [];
    }
    return stored.values.filter((value): value is string => typeof value === "string" && Boolean(value.trim()));
  } catch {
    return [];
  }
}

export function writeCachedBlockOptions(values: string[]): void {
  if (typeof window === "undefined") return;
  const safeValues = values
    .filter((value) => typeof value === "string" && Boolean(value.trim()))
    .map((value) => value.trim())
    .slice(0, 50);
  try {
    window.localStorage.setItem(
      BLOCK_OPTIONS_KEY,
      JSON.stringify({ values: safeValues, savedAt: Date.now() } satisfies StoredBlockOptions)
    );
  } catch {
    // Storage can be unavailable in private mode; the in-memory cache still works.
  }
}

export function clearSafeUserPreferences(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(BLOCK_OPTIONS_KEY);
  } catch {
    // Ignore unavailable storage during logout.
  }
}
