import { NextResponse } from "next/server";
import { pbFetch, apiError } from "@/lib/pb-server";

export async function GET() {
  const res = await pbFetch("/api/collections/usuario");
  if (!res.ok) return apiError("Falha ao buscar schema");
  const schema = await res.json();
  const field = schema.schema?.find((f: { name: string }) => f.name === "tipo");
  return NextResponse.json(field?.options?.values || []);
}
