import { NextRequest, NextResponse } from "next/server";
import { pbFetch, getPbToken, getUserIdFromToken, apiError } from "@/lib/pb-server";
import { withWebhook } from "@/lib/with-webhook";

async function fetchCartItems(itemIds: string[]) {
  if (!itemIds.length) return [];
  const filter = itemIds.map((id) => `id='${id}'`).join("||");
  const res = await pbFetch(`/api/collections/item/records?filter=(${filter})&perPage=50`);
  if (!res.ok) return [];
  return (await res.json()).items as any[];
}

export const POST = withWebhook(async (request: NextRequest) => {
  const token = await getPbToken();
  if (!token) return apiError("Não autenticado", 401);
  const userId = getUserIdFromToken(token);
  if (!userId) return apiError("Token inválido", 401);

  const { itemId, newQuantity } = await request.json();

  // Busca pedido CARRINHO
  const filter = encodeURIComponent(`usuario='${userId}' && status='CARRINHO'`);
  const pedidoRes = await pbFetch(`/api/collections/pedido/records?filter=${filter}&perPage=1`);
  const pedido = pedidoRes.ok ? (await pedidoRes.json()).items?.[0] || null : null;
  if (!pedido) return apiError("Carrinho não encontrado", 404);

  if (newQuantity <= 0) {
    // Remove item
    await pbFetch(`/api/collections/item/records/${itemId}`, { method: "DELETE" });
    const newItemIds = (pedido.item as string[]).filter((id) => id !== itemId);
    if (!newItemIds.length) {
      await pbFetch(`/api/collections/pedido/records/${pedido.id}`, { method: "DELETE" });
    } else {
      const allItems = await fetchCartItems(newItemIds);
      const total = allItems.reduce((s: number, i: any) => s + i.pontos * i.quantidade, 0);
      await pbFetch(`/api/collections/pedido/records/${pedido.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item: newItemIds, pontos: total }),
      });
    }
    return NextResponse.json({ ok: true });
  }

  // Atualiza quantidade
  await pbFetch(`/api/collections/item/records/${itemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantidade: newQuantity }),
  });

  const allItems = await fetchCartItems(pedido.item);
  const updated = allItems.map((i: any) => i.id === itemId ? { ...i, quantidade: newQuantity } : i);
  const total = updated.reduce((s: number, i: any) => s + i.pontos * i.quantidade, 0);
  await pbFetch(`/api/collections/pedido/records/${pedido.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pontos: total }),
  });

  return NextResponse.json({ ok: true });
});
