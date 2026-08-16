"use client";

type QueryListener = () => void;

export interface QuerySnapshot<T> {
  data?: T;
  error?: unknown;
  isFetching: boolean;
  updatedAt: number;
}

interface QueryEntry<T = unknown> {
  data?: T;
  error?: unknown;
  updatedAt: number;
  promise?: Promise<T>;
  listeners: Set<QueryListener>;
  snapshot: QuerySnapshot<T>;
}

interface PersistedAdminQuery {
  key: string;
  data: unknown;
  updatedAt: number;
}

const ADMIN_CACHE_MAX_AGE = 30 * 60_000;
const ADMIN_CACHE_DB = "ssf-admin-query-cache";
const ADMIN_CACHE_STORE = "queries";
const ADMIN_PERSISTED_CACHE_ENABLED = process.env.NEXT_PUBLIC_ADMIN_PERSISTED_CACHE !== "false";
let adminCacheHydrated = false;
let adminCacheFlushTimer: number | undefined;
const persistedAdminQueries = new Map<string, PersistedAdminQuery>();

function isAdminQuery(key: string): boolean {
  return key.startsWith("admin:");
}

function openAdminCacheDb(): Promise<IDBDatabase | null> {
  if (!ADMIN_PERSISTED_CACHE_ENABLED || typeof window === "undefined" || !("indexedDB" in window)) return Promise.resolve(null);
  return new Promise((resolve) => {
    const request = window.indexedDB.open(ADMIN_CACHE_DB, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(ADMIN_CACHE_STORE, { keyPath: "key" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

async function hydrateAdminCache(): Promise<void> {
  const db = await openAdminCacheDb();
  if (!db) {
    adminCacheHydrated = true;
    return;
  }
  await new Promise<void>((resolve) => {
    const request = db.transaction(ADMIN_CACHE_STORE, "readonly").objectStore(ADMIN_CACHE_STORE).getAll();
    request.onsuccess = () => {
      const now = Date.now();
      for (const record of request.result as PersistedAdminQuery[]) {
        if (!record.key || now - record.updatedAt > ADMIN_CACHE_MAX_AGE) continue;
        persistedAdminQueries.set(record.key, record);
        const entry = entryFor(record.key);
        entry.data = record.data;
        entry.updatedAt = record.updatedAt;
        refreshSnapshot(entry);
      }
      resolve();
    };
    request.onerror = () => resolve();
  });
  db.close();
  adminCacheHydrated = true;
  queryEntries.forEach((entry, key) => {
    if (isAdminQuery(key)) notify(entry);
  });
}

function scheduleAdminCacheFlush(): void {
  if (typeof window === "undefined" || adminCacheFlushTimer !== undefined) return;
  adminCacheFlushTimer = window.setTimeout(() => {
    adminCacheFlushTimer = undefined;
    void flushAdminCache();
  }, 250);
}

async function flushAdminCache(): Promise<void> {
  const db = await openAdminCacheDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const transaction = db.transaction(ADMIN_CACHE_STORE, "readwrite");
    const store = transaction.objectStore(ADMIN_CACHE_STORE);
    store.clear();
    persistedAdminQueries.forEach((record) => store.put(record));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => resolve();
  });
  db.close();
}

function persistAdminEntry<T>(key: string, entry: QueryEntry<T>): void {
  if (!isAdminQuery(key) || entry.data === undefined) return;
  persistedAdminQueries.set(key, { key, data: entry.data, updatedAt: entry.updatedAt });
  scheduleAdminCacheFlush();
}

function removePersistedAdminQueries(prefix?: string): void {
  persistedAdminQueries.forEach((_, key) => {
    if (!prefix || key.startsWith(prefix)) persistedAdminQueries.delete(key);
  });
  scheduleAdminCacheFlush();
}

const adminCacheReady = typeof window === "undefined" ? Promise.resolve() : hydrateAdminCache();

const EMPTY_SNAPSHOT: QuerySnapshot<never> = {
  data: undefined,
  error: undefined,
  isFetching: false,
  updatedAt: 0,
};

const queryEntries = new Map<string, QueryEntry>();

function entryFor<T>(key: string): QueryEntry<T> {
  const existing = queryEntries.get(key) as QueryEntry<T> | undefined;
  if (existing) return existing;
  const entry: QueryEntry<T> = {
    updatedAt: 0,
    listeners: new Set(),
    snapshot: EMPTY_SNAPSHOT,
  };
  queryEntries.set(key, entry);
  return entry;
}

function refreshSnapshot(entry: QueryEntry) {
  entry.snapshot = {
    data: entry.data,
    error: entry.error,
    isFetching: Boolean(entry.promise),
    updatedAt: entry.updatedAt,
  };
}

function notify(entry: QueryEntry) {
  refreshSnapshot(entry);
  entry.listeners.forEach((listener) => listener());
}

export function getQuerySnapshot<T>(key: string): QuerySnapshot<T> {
  const entry = queryEntries.get(key) as QueryEntry<T> | undefined;
  return entry?.snapshot ?? EMPTY_SNAPSHOT;
}

export function subscribeQuery(key: string, listener: QueryListener): () => void {
  const entry = entryFor(key);
  entry.listeners.add(listener);
  return () => entry.listeners.delete(listener);
}

export function isQueryFresh(key: string, staleTime: number): boolean {
  const snapshot = getQuerySnapshot(key);
  return snapshot.data !== undefined && Date.now() - snapshot.updatedAt < staleTime;
}

export function setQueryData<T>(key: string, data: T): void {
  const entry = entryFor<T>(key);
  entry.data = data;
  entry.error = undefined;
  entry.updatedAt = Date.now();
  persistAdminEntry(key, entry);
  notify(entry);
}

export function fetchQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  options: { staleTime?: number; force?: boolean; staleWhileRevalidate?: boolean } = {}
): Promise<T> {
  if (isAdminQuery(key) && !adminCacheHydrated) {
    return adminCacheReady.then(() => fetchQuery(key, queryFn, options));
  }
  const entry = entryFor<T>(key);
  const staleTime = options.staleTime ?? 0;

  if (!options.force && entry.data !== undefined && Date.now() - entry.updatedAt < staleTime) {
    return Promise.resolve(entry.data);
  }
  if (!options.force && options.staleWhileRevalidate && entry.data !== undefined) {
    void fetchQuery(key, queryFn, { ...options, force: true, staleWhileRevalidate: false }).catch(() => undefined);
    return Promise.resolve(entry.data);
  }
  if (entry.promise) return entry.promise;

  entry.error = undefined;
  const promise = queryFn()
    .then((data) => {
      entry.data = data;
      entry.updatedAt = Date.now();
      persistAdminEntry(key, entry);
      return data;
    })
    .catch((error: unknown) => {
      entry.error = error;
      throw error;
    })
    .finally(() => {
      entry.promise = undefined;
      notify(entry);
    });

  entry.promise = promise;
  notify(entry);
  return promise;
}

export function invalidateQueries(prefix: string): void {
  queryEntries.forEach((entry, key) => {
    if (!key.startsWith(prefix)) return;
    entry.updatedAt = 0;
    persistAdminEntry(key, entry);
    notify(entry);
  });
}

export function clearQueries(prefix?: string): void {
  Array.from(queryEntries.entries()).forEach(([key, entry]) => {
    if (prefix && !key.startsWith(prefix)) return;
    entry.data = undefined;
    entry.error = undefined;
    entry.updatedAt = 0;
    entry.promise = undefined;
    notify(entry);
    if (entry.listeners.size === 0) queryEntries.delete(key);
  });
  if (!prefix || prefix.startsWith("admin:")) removePersistedAdminQueries(prefix);
}

export function clearProtectedQueryCache(): void {
  clearQueries("admin:");
  clearQueries("member:");
  clearQueries("auth:");
}
