import { NextRequest, NextResponse } from "next/server";
import { pbFetch, apiError } from "@/lib/pb-server";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await pbFetch(`/api/collections/produto/records/${id}`);
  if (!res.ok) return apiError("Produto não encontrado", 404);
  return NextResponse.json(await res.json());
}
