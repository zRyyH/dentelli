import { NextRequest, NextResponse } from "next/server";
import { pbFetch, apiError } from "@/lib/pb-server";

export async function GET(request: NextRequest) {
  const embaixadorId = new URL(request.url).searchParams.get("embaixadorId");
  if (!embaixadorId) return apiError("embaixadorId obrigatório", 400);

  const filter = encodeURIComponent(`status='PENDENTE' && usuario='${embaixadorId}'`);
  const res = await pbFetch(`/api/collections/pedido/records?filter=${filter}&perPage=500&expand=item,item.produto`);
  if (!res.ok) return apiError("Falha ao buscar pedidos pendentes");

  const records = (await res.json()).items;
  const pedidos = records.map((p: any) => ({
    ...p,
    itens: (p.expand?.item ?? []).map((it: any) => ({
      id: it.id,
      quantidade: it.quantidade,
      pontos: it.pontos,
      produtoNome: it.expand?.produto?.nome ?? it.produto ?? "–",
    })),
  }));

  return NextResponse.json(pedidos);
}
