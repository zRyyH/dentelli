"use client";

import { useRouter } from "next/navigation";
import { Heart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWishlist } from "@/hooks/use-wishlist";
import { getProductImageUrl } from "@/hooks/use-products";
import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
  wishlistOnly?: boolean;
}

export function ProductCard({ product, wishlistOnly = false }: ProductCardProps) {
  const router = useRouter();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const imgUrl = getProductImageUrl(product);
  const wishlisted = isInWishlist(product.id);

  return (
    <div className="group rounded-xl border-2 border-border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary h-full">
      <div className="mb-4 flex h-48 items-center justify-center rounded-lg bg-muted overflow-hidden cursor-pointer"
        onClick={() => router.push(`/produto/${product.id}`)}>
        {imgUrl ? (
          <img src={imgUrl} alt={product.nome} className="h-full w-full object-cover" />
        ) : <span className="text-5xl">🎁</span>}
      </div>
      <h3 className="mb-1 text-sm font-medium">{product.nome}</h3>
      <p className="mb-4 text-lg font-bold text-primary">{product.pontos.toLocaleString("pt-BR")} Pontos</p>
      <div className="flex items-center gap-2">
        {!wishlistOnly && (
          <Button onClick={() => router.push(`/produto/${product.id}`)}
            className="flex-1 rounded-full bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-1 h-3 w-3" /> DETALHES
          </Button>
        )}
        {wishlistOnly && (
          <Button onClick={() => router.push(`/produto/${product.id}`)}
            className="flex-1 rounded-full bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/90">
            VER PRODUTO
          </Button>
        )}
        <button onClick={() => toggleWishlist(product.id)}
          className={`flex h-9 w-9 items-center justify-center rounded-full border border-border transition-colors ${wishlisted ? "text-primary bg-primary/10" : "text-primary hover:bg-primary/10"}`}>
          <Heart className={`h-4 w-4 ${wishlisted ? "fill-primary" : ""}`} />
        </button>
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <Skeleton className="mb-4 h-48 w-full rounded-lg" />
      <Skeleton className="mb-1 h-4 w-3/4" />
      <Skeleton className="mb-4 h-6 w-1/2" />
      <Skeleton className="h-9 w-full rounded-full" />
    </div>
  );
}
