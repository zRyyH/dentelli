"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/header";
import { SiteFooter } from "@/components/footer";
import { FloatingButtons } from "@/components/floating-buttons";
import { PageTransition } from "@/components/page-transition";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { useProducts } from "@/hooks/use-products";
import { useWishlist } from "@/hooks/use-wishlist";

export default function WishlistPage() {
  const { wishlist, isLoading: wishlistLoading } = useWishlist();
  const { data: products, isLoading: productsLoading } = useProducts();

  const isLoading = wishlistLoading || productsLoading;
  const wishlistProducts = (products || []).filter((p) => wishlist.some((d) => d.produto === p.id));

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <SiteHeader activeNav="" />

      <PageTransition>
      <div className="bg-primary py-8">
        <h1 className="mx-auto max-w-4xl px-6 text-3xl font-bold text-primary-foreground text-center tracking-wide">
          LISTA DE DESEJOS
        </h1>
      </div>

      <main className="mx-auto max-w-4xl px-6 py-8 min-h-[400px]">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : wishlistProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Heart className="h-16 w-16 mb-4 opacity-25" />
            <p className="text-lg font-medium text-foreground">Sua lista de desejos está vazia</p>
            <p className="text-sm mt-1">Marque produtos com ❤️ para adicioná-los aqui</p>
            <Button nativeButton={false} render={<Link href="/rewards" />} className="mt-6 rounded-full">
              Ver Recompensas
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {wishlistProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      </PageTransition>

      <SiteFooter />
      <FloatingButtons />
    </div>
  );
}
