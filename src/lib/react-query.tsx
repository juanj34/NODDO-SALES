"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";

/**
 * React Query configuration for NODDO
 *
 * Cache strategy:
 * - staleTime: 5 minutes (data considered fresh for 5 min)
 * - cacheTime: 10 minutes (unused data kept in cache for 10 min)
 * - refetchOnWindowFocus: false (prevent re-fetching when user returns to tab)
 * - retry: 1 (retry failed queries once before giving up)
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 5 minutes
        staleTime: 5 * 60 * 1000,
        // Unused data is kept in cache for 10 minutes
        gcTime: 10 * 60 * 1000,
        // Don't refetch when window regains focus (reduces unnecessary queries)
        refetchOnWindowFocus: false,
        // Retry failed queries once
        retry: 1,
        // Don't retry on 404 (resource doesn't exist)
        retryOnMount: false,
      },
      mutations: {
        // Retry mutations once by default
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always create a new query client
    return makeQueryClient();
  } else {
    // Browser: reuse existing client or create new one
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export function ReactQueryProvider({ children }: { children: ReactNode }) {
  // NOTE: Avoid useState when initializing the query client if you don't
  // have a suspense boundary between this and the code that may suspend.
  // Otherwise, React will throw away the client on the initial render if it
  // suspends and there is no boundary
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools only in development */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      )}
    </QueryClientProvider>
  );
}

/**
 * Get the query client instance (for use in server components)
 */
export { getQueryClient };
