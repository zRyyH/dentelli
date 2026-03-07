import { NextRequest, NextResponse } from "next/server";
import { PB_BASE_URL, apiError } from "@/lib/pb-server";
import { withWebhook } from "@/lib/with-webhook";

export const POST = withWebhook(async (request: NextRequest) => {
  const { email, password } = await request.json();

  const res = await fetch(`${PB_BASE_URL}/api/collections/usuario/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: email, password }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    return apiError((error as any)?.message || "Falha na autenticação", 401);
  }

  const data = await res.json();

  const response = NextResponse.json({ token: data.token, record: data.record });
  response.cookies.set("pb_token", data.token, {
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
  });
  return response;
});
