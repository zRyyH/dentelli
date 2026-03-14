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

  const { produtoId, pontos, quantidade, unidadeId } = await request.json();

  // Busca pedido CARRINHO existente (filtrado por unidade se informada)
  const unidadeFilter = unidadeId ? ` && unidade='${unidadeId}'` : "";
  const filter = encodeURIComponent(`usuario='${userId}' && status='CARRINHO'${unidadeFilter}`);
  const pedidoRes = await pbFetch(`/api/collections/pedido/records?filter=${filter}&perPage=1`);
  const currentPedido = pedidoRes.ok ? (await pedidoRes.json()).items?.[0] || null : null;

  // Verifica item duplicado
  let existingItem: any = null;
  if (currentPedido?.item?.length) {
    const items = await fetchCartItems(currentPedido.item);
    existingItem = items.find((i) => i.produto === produtoId) || null;
  }

  // Cria ou atualiza item
  let itemId: string;
  if (existingItem) {
    const r = await pbFetch(`/api/collections/item/records/${existingItem.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantidade: existingItem.quantidade + quantidade, pontos }),
    });
    if (!r.ok) return apiError("Falha ao atualizar item");
    itemId = existingItem.id;
  } else {
    const r = await pbFetch(`/api/collections/item/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantidade, pontos, produto: produtoId }),
    });
    if (!r.ok) return apiError("Falha ao criar item");
    itemId = (await r.json()).id;
  }

  // Atualiza ou cria pedido
  if (currentPedido) {
    const itemIds = existingItem ? currentPedido.item : [...currentPedido.item, itemId];
    const allItems = await fetchCartItems(itemIds);
    const total = allItems.reduce((s: number, i: any) => s + i.pontos * i.quantidade, 0);
    await pbFetch(`/api/collections/pedido/records/${currentPedido.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item: itemIds, pontos: total }),
    });
  } else {
    const r = await pbFetch(`/api/collections/pedido/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usuario: userId,
        item: [itemId],
        pontos: pontos * quantidade,
        status: "CARRINHO",
        ...(unidadeId ? { unidade: unidadeId } : {}),
      }),
    });
    if (!r.ok) return apiError("Falha ao criar pedido");
  }

  return NextResponse.json({ ok: true });
});
