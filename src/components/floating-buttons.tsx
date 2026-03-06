"use client";

import { useRouter } from "next/navigation";
import { Heart, ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";

export function FloatingButtons() {
  const router = useRouter();
  const { itemCount } = useCart();
  const { wishlist } = useWishlist();

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3 md:hidden">
      <button onClick={() => router.push("/wishlist")}
        className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg border border-border/50 text-primary hover:bg-primary/5 transition-colors">
        <Heart className="h-5 w-5" />
        {wishlist.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
            {wishlist.length}
          </span>
        )}
      </button>
      <button onClick={() => router.push("/checkout")}
        className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary shadow-lg text-primary-foreground hover:bg-primary/90 transition-colors">
        <ShoppingCart className="h-5 w-5" />
        {itemCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-bold text-primary">
            {itemCount}
          </span>
        )}
      </button>
    </div>
  );
}
