import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Desejo } from "@/lib/types";

export function useWishlist() {
  const qc = useQueryClient();

  const query = useQuery<Desejo[]>({
    queryKey: ["wishlist"],
    queryFn: () => fetch("/api/wishlist").then((r) => r.ok ? r.json() : []),
  });

  const add = useMutation({
    mutationFn: (produtoId: string) =>
      fetch("/api/wishlist/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ produtoId }),
      }).then((r) => { if (!r.ok) throw new Error(); }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wishlist"] }),
  });

  const remove = useMutation({
    mutationFn: (desejoId: string) =>
      fetch(`/api/wishlist/${desejoId}`, { method: "DELETE" })
        .then((r) => { if (!r.ok) throw new Error(); }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wishlist"] }),
  });

  const isInWishlist = (produtoId: string) =>
    (query.data || []).some((d) => d.produto === produtoId);

  const toggleWishlist = (produtoId: string) => {
    const desejo = (query.data || []).find((d) => d.produto === produtoId);
    if (desejo) remove.mutate(desejo.id);
    else add.mutate(produtoId);
  };

  return {
    wishlist: query.data || [],
    isLoading: query.isLoading,
    isInWishlist,
    toggleWishlist,
  };
}
