"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, Info, ShoppingCart, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/header";
import { SiteFooter } from "@/components/footer";
import { FloatingButtons } from "@/components/floating-buttons";
import { PageTransition } from "@/components/page-transition";
import { useProduct, useProducts, getProductImages } from "@/hooks/use-products";
import { useWishlist } from "@/hooks/use-wishlist";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  const { data: product, isLoading } = useProduct(id);
  const { data: allProducts } = useProducts();

  useEffect(() => { setSelectedImage(0); }, [id]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") setSelectedImage((p) => (p + 1) % images.length);
      if (e.key === "ArrowLeft") setSelectedImage((p) => (p - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxOpen]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <SiteHeader activeNav="RECOMPENSAS" />
        <main className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="space-y-4">
              <Skeleton className="w-full rounded-2xl aspect-[4/3]" />
            </div>
            <div className="space-y-5">
              <Skeleton className="h-8 w-4/5 rounded-xl" />
              <Skeleton className="h-10 w-1/3 rounded-xl" />
              <Skeleton className="h-12 w-full rounded-full" />
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <SiteHeader activeNav="RECOMPENSAS" />
        <main className="mx-auto max-w-4xl px-6 py-20 text-center">
          <p className="text-base font-medium">Produto não encontrado.</p>
          <Button onClick={() => router.push("/rewards")} className="mt-5 rounded-full">Voltar às Recompensas</Button>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const images = getProductImages(product);
  const currentImage = images[selectedImage] || "";
  const relatedProducts = (allProducts || [])
    .filter((r) => r.id !== product.id && r.categoria === product.categoria)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <SiteHeader activeNav="RECOMPENSAS" />

      <PageTransition>
      {/* Breadcrumb */}
      <div className="mx-auto max-w-6xl px-6 pt-8 pb-2">
        <nav className="flex items-center gap-2 text-[10px] tracking-[0.18em] uppercase text-muted-foreground/40">
          <Link href="/homepage" className="hover:text-muted-foreground/70 transition-colors">Início</Link>
          <span>›</span>
          <Link href="/rewards" className="hover:text-muted-foreground/70 transition-colors">Recompensas</Link>
          <span>›</span>
          <span className="truncate max-w-[200px]">{product.nome}</span>
        </nav>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-6 pb-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-stretch">
          {/* Image */}
          <div className="relative min-h-[400px]">
            <div className="group absolute inset-0 overflow-hidden rounded-2xl border border-border/40 bg-white shadow-sm cursor-zoom-in"
              onClick={() => images.length > 0 && setLightboxOpen(true)}>
              {currentImage ? (
                <img src={currentImage} alt={product.nome} className="absolute inset-0 h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.03]" />
              ) : (
                <div className="flex h-full w-full items-center justify-center"><span className="text-7xl opacity-20">🎁</span></div>
              )}
              {images.length > 1 && (
                <>
                  <button className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/85 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => { e.stopPropagation(); setSelectedImage((p) => (p - 1 + images.length) % images.length); }}>
                    <ChevronLeft className="h-4 w-4 text-foreground/70" />
                  </button>
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/85 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => { e.stopPropagation(); setSelectedImage((p) => (p + 1) % images.length); }}>
                    <ChevronRight className="h-4 w-4 text-foreground/70" />
                  </button>
                  <div className="absolute bottom-3 right-3 rounded-full bg-black/35 px-2.5 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
                    {selectedImage + 1} / {images.length}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-border/40 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-start justify-between gap-4">
                <h1 className="text-2xl font-bold leading-snug">{product.nome}</h1>
                <button onClick={() => toggleWishlist(product.id)} className="mt-1 shrink-0 rounded-full p-1.5 hover:bg-muted transition-colors">
                  <Heart className={`h-5 w-5 transition-all ${isInWishlist(product.id) ? "fill-primary text-primary" : "text-muted-foreground/35 hover:text-primary"}`} />
                </button>
              </div>

              <div className="mb-8 border-b border-border/40 pb-8">
                <p className="text-4xl font-bold tracking-tight text-primary">{product.pontos.toLocaleString("pt-BR")}</p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50">Pontos</p>
              </div>

              <div className="mb-5 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">Quantidade</span>
                <div className="flex items-center gap-1 rounded-full border border-border/60 p-1">
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">−</button>
                  <span className="min-w-[32px] text-center text-sm font-semibold">{quantity}</span>
                  <button onClick={() => setQuantity((q) => q + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">+</button>
                </div>
              </div>

              <Button className="w-full rounded-full py-6 text-sm font-bold tracking-[0.12em]"
                disabled={addToCart.isPending}
                onClick={() => addToCart.mutate(
                  { produtoId: product.id, pontos: product.pontos, quantidade: quantity },
                  {
                    onSuccess: () => { window.dispatchEvent(new CustomEvent("cart-added")); toast.success("Adicionado ao carrinho!"); },
                    onError: () => toast.error("Não foi possível adicionar ao carrinho."),
                  }
                )}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                {addToCart.isPending ? "ADICIONANDO..." : "ADICIONAR AO CARRINHO"}
              </Button>

              <div className="mt-5 flex items-start gap-3 rounded-xl bg-muted/40 p-4">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary/50" />
                <p className="text-[11px] leading-relaxed text-muted-foreground/60">
                  Resgates são feitos pelo embaixador comparecendo pessoalmente na clínica. Aqui é feita apenas a solicitação.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {product.descricao && (
          <div className="mt-6 rounded-2xl border border-border/40 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50">Descrição</h2>
            <div className="text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: product.descricao }} />
          </div>
        )}

        {/* Related */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <div className="mb-6 flex items-center gap-5">
              <div className="h-px flex-1 bg-border/40" />
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/40">Veja Também</h2>
              <div className="h-px flex-1 bg-border/40" />
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {relatedProducts.map((r) => {
                const img = getProductImages(r)[0] || "";
                return (
                  <Link key={r.id} href={`/produto/${r.id}`}
                    className="group rounded-2xl border border-border/40 bg-white p-3 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
                    <div className="mb-3 w-full overflow-hidden rounded-xl bg-muted/25 aspect-square">
                      {img ? <img src={img} alt={r.nome} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        : <div className="flex h-full w-full items-center justify-center"><span className="text-4xl opacity-20">🎁</span></div>}
                    </div>
                    <p className="line-clamp-2 text-xs font-medium leading-relaxed group-hover:text-primary transition-colors">{r.nome}</p>
                    <p className="mt-1.5 text-xs font-bold text-primary">{r.pontos.toLocaleString("pt-BR")} pts</p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Lightbox */}
      {lightboxOpen && images.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}>
          <button className="absolute right-5 top-5 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            onClick={() => setLightboxOpen(false)}>
            <X className="h-5 w-5" />
          </button>
          {images.length > 1 && (
            <>
              <button className="absolute left-5 top-1/2 z-50 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                onClick={(e) => { e.stopPropagation(); setSelectedImage((p) => (p - 1 + images.length) % images.length); }}>
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button className="absolute right-5 top-1/2 z-50 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                onClick={(e) => { e.stopPropagation(); setSelectedImage((p) => (p + 1) % images.length); }}>
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <img src={images[selectedImage]} alt={product.nome} className="max-h-[88vh] max-w-[88vw] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()} />
          {images.length > 1 && (
            <div className="absolute bottom-5 flex gap-2">
              {images.map((_, idx) => (
                <button key={idx} onClick={(e) => { e.stopPropagation(); setSelectedImage(idx); }}
                  className={`rounded-full transition-all duration-200 ${idx === selectedImage ? "h-2 w-6 bg-white" : "h-2 w-2 bg-white/35 hover:bg-white/60"}`} />
              ))}
            </div>
          )}
        </div>
      )}

      </PageTransition>

      <SiteFooter />
      <FloatingButtons />
    </div>
  );
}
