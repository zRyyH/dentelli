import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUnidade } from "@/hooks/use-unidade";
import type { CartItem, Pedido } from "@/lib/types";

async function apiFetch(path: string, body?: object) {
  const res = await fetch(path, body
    ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    : undefined
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as any).error || "Erro na requisição");
  }
  return res.json();
}

export function useCart() {
  const qc = useQueryClient();
  const { selectedId: unidadeId } = useUnidade();

  const { data, isLoading } = useQuery<{ pedido: Pedido | null; items: CartItem[] }>({
    queryKey: ["cart"],
    queryFn: () => fetch("/api/cart").then((r) => r.ok ? r.json() : { pedido: null, items: [] }),
  });

  const pedido = data?.pedido ?? null;
  const items = data?.items ?? [];
  const totalPontos = items.reduce((sum, i) => sum + i.pontos * i.quantidade, 0);
  const itemCount = items.reduce((s, i) => s + i.quantidade, 0);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["cart"] });

  const addToCart = useMutation({
    mutationFn: ({ produtoId, pontos, quantidade }: { produtoId: string; pontos: number; quantidade: number }) =>
      apiFetch("/api/cart/add", { produtoId, pontos, quantidade, unidadeId }),
    onSuccess: invalidate,
  });

  const removeFromCart = useMutation({
    mutationFn: (itemId: string) => apiFetch("/api/cart/remove", { itemId }),
    onSuccess: invalidate,
  });

  const updateItemQuantity = useMutation({
    mutationFn: ({ itemId, newQuantity }: { itemId: string; newQuantity: number }) =>
      apiFetch("/api/cart/update", { itemId, newQuantity }),
    onSuccess: invalidate,
  });

  return { pedido, items, totalPontos, itemCount, isLoading, addToCart, removeFromCart, updateItemQuantity };
}
