"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/hooks/use-theme";
import { UnidadeProvider } from "@/hooks/use-unidade";
import { UserProvider } from "@/hooks/use-user";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 1000 * 60 * 2 } },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <UserProvider>
          <UnidadeProvider>
            {children}
            <Toaster richColors position="top-right" />
          </UnidadeProvider>
        </UserProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
