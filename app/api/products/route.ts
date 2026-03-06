import { NextRequest, NextResponse } from "next/server";
import { pbFetch, apiError } from "@/lib/pb-server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "true";

  const res = await pbFetch("/api/collections/produto/records?sort=-created&perPage=100");
  if (!res.ok) return apiError("Falha ao buscar produtos");

  const data = await res.json();
  const items = all
    ? data.items
    : (data.items as any[]).filter((p) => p.ativo !== false);

  return NextResponse.json(items);
}
