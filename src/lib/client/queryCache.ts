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
  notify(entry);
}

export function fetchQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  options: { staleTime?: number; force?: boolean } = {}
): Promise<T> {
  const entry = entryFor<T>(key);
  const staleTime = options.staleTime ?? 0;

  if (!options.force && entry.data !== undefined && Date.now() - entry.updatedAt < staleTime) {
    return Promise.resolve(entry.data);
  }
  if (entry.promise) return entry.promise;

  entry.error = undefined;
  const promise = queryFn()
    .then((data) => {
      entry.data = data;
      entry.updatedAt = Date.now();
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
}

export function clearProtectedQueryCache(): void {
  clearQueries("admin:");
  clearQueries("member:");
  clearQueries("auth:");
}