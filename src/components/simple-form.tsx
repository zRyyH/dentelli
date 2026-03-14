"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isAuthenticated } from "@/lib/pb";
import { useUser } from "@/hooks/use-user";
import { SiteHeader } from "./header";
import { SiteFooter } from "./footer";
import { PageTransition } from "./page-transition";

export function SimpleForm({ title, children }: { title: string; children: React.ReactNode }) {
  const router = useRouter();
  const { isAdmin, isLoading } = useUser();

  useEffect(() => {
    if (!isAuthenticated()) { router.replace("/"); return; }
    if (!isLoading && !isAdmin) { router.replace("/homepage"); }
  }, [router, isAdmin, isLoading]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "hsl(220 18% 91%)" }}>
      <SiteHeader activeNav="CADASTRAR" />
      <PageTransition>
        <main className="flex-1 flex items-start justify-center py-12 px-4">
          <div className="w-full max-w-4xl min-h-[600px] rounded-2xl border border-border p-8 shadow-sm space-y-6" style={{ background: "hsl(220 14% 96%)" }}>
            <h1 className="text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">{title}</h1>
            {children}
          </div>
        </main>
      </PageTransition>
      <SiteFooter />
    </div>
  );
}
