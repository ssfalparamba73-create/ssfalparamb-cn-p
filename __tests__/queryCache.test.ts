import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearProtectedQueryCache,
  clearQueries,
  fetchQuery,
  getQuerySnapshot,
  invalidateQueries,
  setQueryData,
} from "@/lib/client/queryCache";
import {
  readCachedBlockOptions,
  writeCachedBlockOptions,
} from "@/lib/client/safePersistentCache";

describe("query cache", () => {
  beforeEach(() => {
    clearQueries();
    window.localStorage.clear();
  });

  it("deduplicates simultaneous requests for the same query", async () => {
    let resolveRequest!: (value: string[]) => void;
    const request = new Promise<string[]>((resolve) => {
      resolveRequest = resolve;
    });
    const queryFn = vi.fn(() => request);

    const first = fetchQuery("admin:members:first", queryFn, { staleTime: 30_000 });
    const second = fetchQuery("admin:members:first", queryFn, { staleTime: 30_000 });
    resolveRequest(["member"]);

    await expect(first).resolves.toEqual(["member"]);
    await expect(second).resolves.toEqual(["member"]);
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it("serves fresh data without another request and refetches after invalidation", async () => {
    const queryFn = vi.fn()
      .mockResolvedValueOnce("first")
      .mockResolvedValueOnce("second");

    await expect(fetchQuery("admin:dashboard", queryFn, { staleTime: 30_000 })).resolves.toBe("first");
    await expect(fetchQuery("admin:dashboard", queryFn, { staleTime: 30_000 })).resolves.toBe("first");
    expect(queryFn).toHaveBeenCalledTimes(1);

    invalidateQueries("admin:dashboard");
    await expect(fetchQuery("admin:dashboard", queryFn, { staleTime: 30_000 })).resolves.toBe("second");
    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it("clears protected data without removing public cache entries", () => {
    setQueryData("admin:dashboard", { total: 1 });
    setQueryData("member:profile", { id: "member" });
    setQueryData("public:support", [{ name: "Support" }]);

    clearProtectedQueryCache();

    expect(getQuerySnapshot("admin:dashboard").data).toBeUndefined();
    expect(getQuerySnapshot("member:profile").data).toBeUndefined();
    expect(getQuerySnapshot("public:support").data).toEqual([{ name: "Support" }]);
  });
});

describe("safe persistent cache", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("persists only normalized Block option strings", () => {
    writeCachedBlockOptions([" North ", "", "South"]);
    expect(readCachedBlockOptions()).toEqual(["North", "South"]);
  });

  it("ignores expired Block options", () => {
    window.localStorage.setItem(
      "ssf-safe:block-options:v1",
      JSON.stringify({ values: ["North"], savedAt: Date.now() - 25 * 60 * 60 * 1000 })
    );
    expect(readCachedBlockOptions()).toEqual([]);
  });
});
