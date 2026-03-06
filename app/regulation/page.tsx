"use client";

import { useState, useEffect } from "react";
import { SiteHeader } from "@/components/header";
import { SiteFooter } from "@/components/footer";
import { FloatingButtons } from "@/components/floating-buttons";
import { PageTransition } from "@/components/page-transition";
import { fetchWithAuth, PB_BASE_URL } from "@/lib/pb";

export default function RegulationPage() {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth(`${PB_BASE_URL}/api/collections/tema/records?perPage=1`)
      .then((r) => r.json())
      .then((data) => setHtml(data.items?.[0]?.regulamento ?? ""))
      .catch(() => setHtml(""))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-card">
      <SiteHeader activeNav="REGULAMENTO" />
      <PageTransition>
      <main className="mx-auto max-w-2xl px-6 py-16">
        <div className="mb-14">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-primary">DentelliClub</p>
          <h1 className="text-2xl font-light tracking-tight">Regulamento do Programa</h1>
          <div className="mt-6 h-px bg-border/50" />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-muted/40" style={{ width: `${70 + (i % 3) * 10}%` }} />
            ))}
          </div>
        ) : html ? (
          <div className="text-sm leading-7 text-muted-foreground prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: html }} />
        ) : null}

        <div className="mt-14 border-t border-border/40 pt-8">
          <p className="text-xs text-muted-foreground/50">
            Leia também a nossa{" "}
            <a href="#" className="text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline">
              Política de Entrega, Devolução e Reembolso
            </a>
            .
          </p>
        </div>
      </main>
      </PageTransition>

      <SiteFooter />
      <FloatingButtons />
    </div>
  );
}
