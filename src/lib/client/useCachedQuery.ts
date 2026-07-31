"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { fetchQuery, getQuerySnapshot, subscribeQuery } from "./queryCache";

interface UseCachedQueryOptions<T> {
  key: string;
  queryFn: () => Promise<T>;
  staleTime?: number;
  enabled?: boolean;
}

export function useCachedQuery<T>({
  key,
  queryFn,
  staleTime = 0,
  enabled = true,
}: UseCachedQueryOptions<T>) {
  const subscribe = useCallback(
    (listener: () => void) => subscribeQuery(key, listener),
    [key]
  );
  const getSnapshot = useCallback(() => getQuerySnapshot<T>(key), [key]);
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (!enabled) return;
    void fetchQuery(key, queryFn, { staleTime }).catch(() => undefined);
  }, [enabled, key, queryFn, staleTime]);

  useEffect(() => {
    if (!enabled) return;
    const refresh = () => {
      if (document.visibilityState === "visible") {
        void fetchQuery(key, queryFn, { staleTime }).catch(() => undefined);
      }
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [enabled, key, queryFn, staleTime]);

  const refetch = useCallback(
    () => fetchQuery(key, queryFn, { staleTime, force: true }),
    [key, queryFn, staleTime]
  );

  return {
    data: snapshot.data,
    error: snapshot.error,
    isInitialLoading: snapshot.data === undefined && snapshot.isFetching,
    isRefreshing: snapshot.data !== undefined && snapshot.isFetching,
    refetch,
  };
}