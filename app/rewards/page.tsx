"use client";

import { useEffect, useState } from "react";
import { useQueryState } from "nuqs";
import { SlidersHorizontal, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { SiteHeader } from "@/components/header";
import { SiteFooter } from "@/components/footer";
import { FloatingButtons } from "@/components/floating-buttons";
import { PageTransition } from "@/components/page-transition";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { useProducts } from "@/hooks/use-products";
import { useCategorias } from "@/hooks/use-admin-data";

const MIN = 0, MAX = 5000;

export default function RewardsPage() {
  const { data: categorias = [] } = useCategorias();
  const { data: products, isLoading } = useProducts();

  const [busca] = useQueryState("busca", { defaultValue: "" });
  const [categoriaParam] = useQueryState("categoria", { defaultValue: "" });

  const [pointsRange, setPointsRange] = useState([MIN, MAX]);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);

  useEffect(() => {
    if (categoriaParam && (categorias as any[]).length) {
      const cat = (categorias as any[]).find((c) => c.nome === categoriaParam);
      if (cat) setCategoryIds([cat.id]);
    }
  }, [categoriaParam, categorias]);

  const isDefaultRange = pointsRange[0] === MIN && pointsRange[1] === MAX;
  const activeFilters = (isDefaultRange ? 0 : 1) + categoryIds.length;

  const filtered = (products || []).filter((r) => {
    const inRange = r.pontos >= pointsRange[0] && r.pontos <= pointsRange[1];
    const inCat = categoryIds.length === 0 || categoryIds.includes(r.categoria);
    const inSearch = !busca || r.nome.toLowerCase().includes(busca.toLowerCase());
    return inRange && inCat && inSearch;
  });

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader activeNav="RECOMPENSAS" />

      <PageTransition>
      <div className="bg-primary py-8">
        <h1 className="mx-auto max-w-4xl px-6 text-3xl font-bold text-primary-foreground text-center">RECOMPENSAS</h1>
      </div>

      <div className="mx-auto flex max-w-6xl gap-10 px-4 py-10">
        {/* Filter sidebar */}
        <aside className="hidden w-64 shrink-0 md:block">
          <div className="sticky top-24 space-y-7">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Filtros</span>
                {activeFilters > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {activeFilters}
                  </span>
                )}
              </div>
              {activeFilters > 0 && (
                <button onClick={() => { setPointsRange([MIN, MAX]); setCategoryIds([]); }}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground/70 hover:text-primary transition-colors">
                  <X className="h-3 w-3" /> Limpar
                </button>
              )}
            </div>

            <div className="h-px bg-border/60" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Pontos</span>
                <span className="text-xs font-semibold text-primary tabular-nums">
                  {pointsRange[0].toLocaleString("pt-BR")} – {pointsRange[1].toLocaleString("pt-BR")}
                </span>
              </div>
              <Slider min={MIN} max={MAX} step={50} value={pointsRange} onValueChange={setPointsRange} />
              <div className="flex justify-between">
                <span className="text-[10px] text-muted-foreground/60">{MIN} pts</span>
                <span className="text-[10px] text-muted-foreground/60">{MAX.toLocaleString("pt-BR")} pts</span>
              </div>
            </div>

            <div className="h-px bg-border/60" />

            <div className="space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Categorias</span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(categorias as any[]).map((cat) => {
                  const active = categoryIds.includes(cat.id);
                  return (
                    <button key={cat.id}
                      onClick={() => setCategoryIds((prev) => prev.includes(cat.id) ? prev.filter((c) => c !== cat.id) : [...prev, cat.id])}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                        active ? "border-primary bg-primary text-primary-foreground" : "border-border/70 text-muted-foreground hover:border-primary/50 hover:text-primary"
                      }`}>
                      {cat.nome}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {!isLoading && (
            <p className="mb-5 text-xs text-muted-foreground/70">
              {filtered.length === 0 ? "Nenhuma recompensa encontrada" : `${filtered.length} recompensa${filtered.length !== 1 ? "s" : ""} encontrada${filtered.length !== 1 ? "s" : ""}`}
              {busca && <span className="ml-1 font-medium text-foreground/60">para &ldquo;{busca}&rdquo;</span>}
            </p>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((r) => <ProductCard key={r.id} product={r} />)}
            </div>
          )}
        </div>
      </div>

      </PageTransition>

      <SiteFooter />
      <FloatingButtons />
    </div>
  );
}
