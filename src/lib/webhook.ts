import { fetchWithAuth, PB_BASE_URL } from "./pb";
import type { WebhookTipo } from "./types";

export async function fireWebhooks(tipo: WebhookTipo, payload: object): Promise<void> {
  try {
    const filter = encodeURIComponent(`tipo='${tipo}'`);
    const res = await fetchWithAuth(`${PB_BASE_URL}/api/collections/webhook/records?filter=${filter}&perPage=100`);
    if (!res.ok) return;
    const data = await res.json();
    const webhooks: Array<{ webhook: string }> = data.items ?? [];
    if (!webhooks.length) return;
    await Promise.allSettled(
      webhooks.map((w) =>
        fetch(w.webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tipo, ...payload }),
        })
      )
    );
  } catch { /* silencioso */ }
}
