import { createContext, type ReactNode, useContext, useMemo } from "react";
import {
  getGetStorefrontQueryKey,
  useGetStorefront,
  type Product,
  type Settings,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

type StorefrontValue = {
  products: Product[];
  settings: Settings;
  refresh: () => void;
  isRefreshing: boolean;
};

const StorefrontContext = createContext<StorefrontValue | null>(null);

export function resolveStorefrontImage(url: string): string {
  if (!url || url.startsWith("/api/media/")) return url;
  if (url.startsWith("/images/")) {
    return `${import.meta.env.BASE_URL.replace(/\/$/, "")}${url}`;
  }
  return url;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "The storefront could not be loaded.";
}

export function StorefrontProvider({ children }: { children: ReactNode }) {
  const query = useGetStorefront({
    query: {
      queryKey: getGetStorefrontQueryKey(),
      staleTime: 60_000,
      refetchInterval: 5 * 60_000,
      refetchOnWindowFocus: true,
      retry: 2,
    },
  });

  const value = useMemo<StorefrontValue | null>(() => {
    if (!query.data) return null;
    return {
      products: query.data.products,
      settings: query.data.settings,
      refresh: () => { void query.refetch(); },
      isRefreshing: query.isFetching,
    };
  }, [query.data, query.isFetching, query.refetch]);

  if (query.isPending) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-background p-6" aria-busy="true">
        <p className="text-lg font-bold text-foreground">Loading Kaya Foods…</p>
      </main>
    );
  }

  if (!value) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-background p-6">
        <div className="max-w-md rounded-3xl border border-destructive/20 bg-card p-8 text-center shadow-xl">
          <h1 className="text-2xl font-black text-foreground">We couldn’t load the shop</h1>
          <p className="mt-3 text-foreground/70" role="alert">{errorMessage(query.error)}</p>
          <Button className="mt-6 rounded-full" onClick={() => void query.refetch()} disabled={query.isFetching}>
            {query.isFetching ? "Trying again…" : "Try again"}
          </Button>
        </div>
      </main>
    );
  }

  return (
    <StorefrontContext.Provider value={value}>
      {query.isRefetchError && (
        <div className="fixed inset-x-4 top-24 z-50 mx-auto flex max-w-xl items-center justify-between gap-4 rounded-2xl border border-destructive/30 bg-background p-4 text-sm font-bold text-foreground shadow-xl" role="alert">
          <span>We couldn’t refresh the shop. The last loaded catalogue is still shown.</span>
          <Button variant="outline" size="sm" onClick={() => void query.refetch()} disabled={query.isFetching}>
            Retry
          </Button>
        </div>
      )}
      {children}
    </StorefrontContext.Provider>
  );
}

export function useStorefront(): StorefrontValue {
  const value = useContext(StorefrontContext);
  if (!value) throw new Error("useStorefront must be used within StorefrontProvider");
  return value;
}