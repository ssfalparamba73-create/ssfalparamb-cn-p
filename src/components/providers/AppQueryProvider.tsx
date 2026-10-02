"use client";

import { useEffect, useState, type ReactNode } from "react";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import {
  createAppQueryClient,
  PERSISTED_QUERY_CACHE_KEY,
  registerAppQueryClient,
} from "@/lib/client/appQueryClient";

const TWENTY_ONE_DAYS = 21 * 24 * 60 * 60_000;

// Keep the server render and first browser render on the same provider tree.
// localStorage is accessed only when the persister calls these methods.
const safeBrowserStorage = {
  getItem(key: string) {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Persistence is optional; queries still work without browser storage.
    }
  },
  removeItem(key: string) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore storage failures so they do not break app rendering.
    }
  },
};

const persister = createSyncStoragePersister({
  storage: safeBrowserStorage,
  key: PERSISTED_QUERY_CACHE_KEY,
  throttleTime: 1_000,
});

export function AppQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createAppQueryClient);

  useEffect(() => registerAppQueryClient(queryClient), [queryClient]);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: TWENTY_ONE_DAYS,
        // Financial activity must always be verified against the server after a reload.
        buster: "member-cache-v3",
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            const scope = query.queryKey[0];
            if (query.state.status !== "success") return false;
            if (scope === "auth") return true;
            if (scope !== "member") return false;
            const resource = query.queryKey[1];
            return resource !== "dashboard" && resource !== "payments";
          },
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
