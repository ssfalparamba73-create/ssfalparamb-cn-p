"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import {
  createAppQueryClient,
  PERSISTED_QUERY_CACHE_KEY,
  registerAppQueryClient,
} from "@/lib/client/appQueryClient";

const TWENTY_ONE_DAYS = 21 * 24 * 60 * 60_000;

export function AppQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createAppQueryClient);
  const [persister] = useState(() =>
    typeof window === "undefined"
      ? null
      : createSyncStoragePersister({
          storage: window.localStorage,
          key: PERSISTED_QUERY_CACHE_KEY,
          throttleTime: 1_000,
        })
  );

  useEffect(() => registerAppQueryClient(queryClient), [queryClient]);

  if (!persister) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

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
