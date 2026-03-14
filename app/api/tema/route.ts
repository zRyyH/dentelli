import { NextResponse } from "next/server";
import { pbAdminFetch, apiError } from "@/lib/pb-server";

export async function GET() {
  const res = await pbAdminFetch("/api/collections/tema/records?perPage=1");
  if (!res.ok) return apiError("Falha ao buscar tema");
  const data = await res.json();
  return NextResponse.json(data.items?.[0] ?? null);
}
