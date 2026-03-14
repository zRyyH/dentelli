import { NextRequest, NextResponse } from "next/server";
import { pbFetch, getPbToken, getUserIdFromToken, apiError } from "@/lib/pb-server";

export async function GET(request: NextRequest) {
  const token = await getPbToken();
  if (!token) return apiError("Não autenticado", 401);
  const userId = getUserIdFromToken(token);
  if (!userId) return apiError("Token inválido", 401);

  const unidadeId = request.nextUrl.searchParams.get("unidadeId");
  const unidadeFilter = unidadeId ? ` && unidade='${unidadeId}'` : "";
  const filter = encodeURIComponent(`usuario='${userId}' && status!='CARRINHO'${unidadeFilter}`);

  const res = await pbFetch(`/api/collections/pedido/records?filter=${filter}&perPage=100&sort=-created`);
  if (!res.ok) return apiError("Falha ao buscar pedidos");

  const pedidos = (await res.json()).items as any[];

  // Busca items de cada pedido
  const pedidosComItems = await Promise.all(
    pedidos.map(async (pedido) => {
      if (!pedido.item?.length) return { ...pedido, itemDetails: [] };
      const itemFilter = pedido.item.map((id: string) => `id='${id}'`).join("||");
      const itemRes = await pbFetch(`/api/collections/item/records?filter=(${itemFilter})&perPage=50`);
      return {
        ...pedido,
        itemDetails: itemRes.ok ? (await itemRes.json()).items : [],
      };
    })
  );

  return NextResponse.json(pedidosComItems);
}
