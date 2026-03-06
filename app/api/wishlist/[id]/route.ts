import { NextRequest, NextResponse } from "next/server";
import { pbFetch, getPbToken, apiError } from "@/lib/pb-server";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getPbToken();
  if (!token) return apiError("Não autenticado", 401);

  const { id } = await params;
  const res = await pbFetch(`/api/collections/desejo/records/${id}`, { method: "DELETE" });
  if (!res.ok) return apiError("Falha ao remover da lista de desejos");

  return NextResponse.json({ ok: true });
}
