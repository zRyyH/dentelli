"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { canAccessAdminMenus, isAuthenticated } from "@/lib/pb";
import { SiteHeader } from "./header";
import { SiteFooter } from "./footer";
import { PageTransition } from "./page-transition";

export function SimpleForm({ title, children }: { title: string; children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) { router.replace("/"); return; }
    if (!canAccessAdminMenus()) { router.replace("/homepage"); }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader activeNav="CADASTRAR" />
      <PageTransition>
        <main className="flex-1 flex items-start justify-center py-12 px-4">
          <div className="w-full max-w-4xl rounded-2xl border border-border bg-card p-8 shadow-sm space-y-6">
            <h1 className="text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">{title}</h1>
            {children}
          </div>
        </main>
      </PageTransition>
      <SiteFooter />
    </div>
  );
}
