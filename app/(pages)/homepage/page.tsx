"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { SiteHeader } from "@/components/header";
import { SiteFooter } from "@/components/footer";
import { FloatingButtons } from "@/components/floating-buttons";
import { PageTransition } from "@/components/page-transition";
import { ProductCard } from "@/components/product-card";
import { useTheme } from "@/hooks/use-theme";
import { useProducts, getProductImageUrl } from "@/hooks/use-products";
import { useCategorias } from "@/hooks/use-admin-data";
import { PageLoader } from "@/components/page-loader";
import { PB_BASE_URL } from "@/lib/pb";
import type { Product } from "@/lib/types";

function CarouselWithDots({ products }: { products: Product[] }) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  return (
    <div>
      <Carousel setApi={setApi} opts={{ align: "start", loop: true }}
        plugins={[Autoplay({ delay: 3000, stopOnInteraction: true })]} className="w-full">
        <CarouselContent className="-ml-4">
          {products.map((p) => (
            <CarouselItem key={p.id} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/4">
              <ProductCard product={p} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="-left-4 md:-left-12" />
        <CarouselNext className="-right-4 md:-right-12" />
      </Carousel>
      <div className="flex justify-center gap-2 mt-4">
        {Array.from({ length: count }).map((_, i) => (
          <button key={i} onClick={() => api?.scrollTo(i)}
            className={`h-2.5 w-2.5 rounded-full transition-colors ${i === current ? "bg-primary" : "bg-primary/25"}`} />
        ))}
      </div>
    </div>
  );
}

export default function HomepagePage() {
  const router = useRouter();
  const { images } = useTheme();
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: categorias = [], isLoading: categoriasLoading } = useCategorias();

  const isLoading = productsLoading || categoriasLoading;
  const recentProducts = products.slice(0, 8);
  const dentellinosProducts = products.slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader activeNav="HOME" />

      <PageTransition>
      {isLoading ? <PageLoader /> : <>
      {/* Hero Banner */}
      <section className="relative w-full max-h-[700px] overflow-hidden" style={{ background: "var(--gradient-bg)" }}>
        {images.banner ? (
          <img src={images.banner} alt="Banner" className="w-full max-h-[700px] object-cover" />
        ) : (
          <div className="flex min-h-[400px] items-center justify-center px-8 py-16">
            <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 text-center md:flex-row md:text-left">
              <div className="flex-1 space-y-4">
                <p className="text-lg text-primary-foreground/80">Transforme sorrisos e conquiste prêmios!</p>
                <h1 className="text-5xl font-black leading-tight md:text-7xl text-primary-foreground">
                  Indique<br />PONTUE<br />ganhe!
                </h1>
                <p className="text-primary-foreground/70">Fazer parte do Dentelli Club é simples e cheio de recompensas!</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Categories */}
      {(categorias as any[]).length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex items-center justify-center gap-8 overflow-x-auto pb-4">
            {(categorias as any[]).map((cat) => {
              const catImg = cat.foto ? `${PB_BASE_URL}/api/files/${cat.collectionId}/${cat.id}/${cat.foto}` : null;
              return (
                <button key={cat.id} onClick={() => router.push(`/rewards?categoria=${encodeURIComponent(cat.nome)}`)}
                  className="flex flex-col items-center gap-3 group min-w-[100px]">
                  <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-primary/20 bg-primary/5 group-hover:border-primary/50 group-hover:shadow-lg overflow-hidden transition-all">
                    {catImg ? <img src={catImg} alt={cat.nome} className="h-full w-full object-cover" /> : <span className="text-3xl">📦</span>}
                  </div>
                  <span className="text-sm font-semibold text-primary">{cat.nome}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Novidades */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="border-b-2 border-primary pb-1 text-lg font-bold text-primary">NOVIDADES</h2>
          <Link href="/rewards" className="text-sm font-bold text-primary hover:underline">VER TODOS</Link>
        </div>
        {recentProducts.length > 0 && <CarouselWithDots products={recentProducts} />}
      </section>

      {/* Promotional Banners */}
      <section className="mx-auto max-w-6xl px-4 pb-12 space-y-6">
        <div className="relative w-full overflow-hidden rounded-2xl" style={{ background: "var(--gradient-bg)" }}>
          {images.banners_secundarios[0] ? (
            <img src={images.banners_secundarios[0]} alt="Banner promocional" className="w-full max-h-[320px] object-cover rounded-2xl transition-transform duration-300 hover:scale-105" />
          ) : (
            <div className="flex min-h-[280px] items-center justify-center p-8">
              <div className="text-center text-primary-foreground">
                <h3 className="text-3xl font-bold">O seu presente te espera no</h3>
                <p className="mt-2 text-2xl font-bold">🦷 DentelliClub</p>
              </div>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="overflow-hidden rounded-2xl" style={{ background: "var(--gradient-bg)" }}>
              {images.banners_secundarios[i] ? (
                <img src={images.banners_secundarios[i]} alt="Banner" className="w-full min-h-[240px] object-cover transition-transform duration-300 hover:scale-105" />
              ) : <div className="min-h-[240px]" />}
            </div>
          ))}
        </div>
      </section>

      {/* Produtos Dentellinos */}
      {dentellinosProducts.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="border-b-2 border-primary pb-1 text-lg font-bold text-primary">PRODUTOS DENTELLINOS</h2>
            <Link href="/rewards" className="text-sm font-bold text-primary hover:underline">VER TODOS</Link>
          </div>
          <div className="rounded-2xl p-8 bg-primary">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              <div className="flex flex-col justify-center text-primary-foreground space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary-foreground/50">
                  <ChevronRight className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">NOVIDADES</h3>
                <p className="text-sm font-bold">APROVEITE ESSES PRÊMIOS!</p>
              </div>
              {dentellinosProducts.map((p) => {
                const imgUrl = getProductImageUrl(p);
                return (
                  <div key={p.id} className="rounded-xl bg-card p-4 shadow-md">
                    <div className="mb-4 flex h-40 items-center justify-center rounded-lg bg-muted overflow-hidden cursor-pointer"
                      onClick={() => router.push(`/produto/${p.id}`)}>
                      {imgUrl ? <img src={imgUrl} alt={p.nome} className="h-full w-full object-cover" /> : <span className="text-5xl">🎁</span>}
                    </div>
                    <h3 className="mb-1 text-sm font-medium">{p.nome}</h3>
                    <p className="mb-4 text-lg font-bold text-primary">{p.pontos.toLocaleString("pt-BR")} Pontos</p>
                    <Button onClick={() => router.push(`/produto/${p.id}`)} className="w-full rounded-full text-xs font-bold">
                      <Plus className="mr-1 h-3 w-3" /> DETALHES
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      </>}
      </PageTransition>

      <SiteFooter />
      <FloatingButtons />
    </div>
  );
}
