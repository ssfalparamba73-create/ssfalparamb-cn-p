"use client";

import { QueryClient } from "@tanstack/react-query";

export const PERSISTED_QUERY_CACHE_KEY = "ssf-alparamba:member-query-cache:v1";

let activeQueryClient: QueryClient | null = null;

export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 24 * 24 * 60 * 60_000,
        retry: (failureCount, error) => {
          const status = (error as { status?: number } | null)?.status;
          if (status === 401 || status === 403) return false;
          return failureCount < 2;
        },
        refetchOnMount: true,
        refetchOnReconnect: true,
        refetchOnWindowFocus: true,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export function registerAppQueryClient(queryClient: QueryClient): () => void {
  activeQueryClient = queryClient;
  return () => {
    if (activeQueryClient === queryClient) activeQueryClient = null;
  };
}

export function clearAppQueryCache(): void {
  activeQueryClient?.clear();
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(PERSISTED_QUERY_CACHE_KEY);
  }
}

export function setAppQueryData<T>(queryKey: readonly unknown[], data: T): void {
  activeQueryClient?.setQueryData(queryKey, data);
}
