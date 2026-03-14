import { NextRequest, NextResponse } from "next/server";
import { pbFetch, getPbToken, getUserIdFromToken, apiError } from "@/lib/pb-server";

async function fetchCartItems(itemIds: string[]) {
  if (!itemIds.length) return [];
  const filter = itemIds.map((id) => `id='${id}'`).join("||");
  const res = await pbFetch(`/api/collections/item/records?filter=(${filter})&perPage=50`);
  if (!res.ok) return [];
  return (await res.json()).items;
}

export async function GET(request: NextRequest) {
  try {
    const token = await getPbToken();
    if (!token) return apiError("Não autenticado", 401);
    const userId = getUserIdFromToken(token);
    if (!userId) return apiError("Token inválido", 401);

    const unidadeId = request.nextUrl.searchParams.get("unidadeId");
    const unidadeFilter = unidadeId ? ` && unidade='${unidadeId}'` : "";
    const filter = encodeURIComponent(`usuario='${userId}' && status='CARRINHO'${unidadeFilter}`);
    const pedidoRes = await pbFetch(`/api/collections/pedido/records?filter=${filter}&perPage=1`);
    if (!pedidoRes.ok) return NextResponse.json({ pedido: null, items: [] });

    const pedido = (await pedidoRes.json()).items?.[0] || null;
    const items = pedido?.item?.length ? await fetchCartItems(pedido.item) : [];

    return NextResponse.json({ pedido, items });
  } catch {
    return NextResponse.json({ pedido: null, items: [] });
  }
}
