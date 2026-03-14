"use client";

import { useQuery } from "@tanstack/react-query";
import { AccountLayout } from "@/components/account-layout";
import { fetchWithAuth, PB_BASE_URL, getUserId } from "@/lib/pb";
import { useUnidade } from "@/hooks/use-unidade";

interface HistoricoItem {
  id: string;
  created: string;
  tipo: "CREDITO" | "DEBITO";
  saldo: number;
  valor: number;
  observacao: string;
  valido_ate: string;
  missao_nome: string;
  pedido_id: string;
}

interface SaldoData {
  saldo: number;
}

export default function HistoricoPage() {
  const userId = getUserId();
  const { selectedId: unidadeId, selectedNome, unidades } = useUnidade();

  const { data: saldoData } = useQuery<SaldoData>({
    queryKey: ["saldo", userId, unidadeId],
    queryFn: async () => {
      const unidadeFilter = unidadeId ? ` && unidade='${unidadeId}'` : "";
      const filter = encodeURIComponent(`usuario='${userId}'${unidadeFilter}`);
      const res = await fetchWithAuth(`${PB_BASE_URL}/api/collections/saldo/records?filter=${filter}&perPage=1`);
      if (!res.ok) throw new Error();
      return (await res.json()).items?.[0] || { saldo: 0 };
    },
    enabled: !!userId,
  });

  const { data: historicoItems = [] } = useQuery<HistoricoItem[]>({
    queryKey: ["historico", userId, unidadeId],
    queryFn: async () => {
      if (!userId) return [];
      const unidadeFilter = unidadeId ? ` && unidade='${unidadeId}'` : "";
      const filter = encodeURIComponent(`usuario='${userId}'${unidadeFilter}`);
      const res = await fetchWithAuth(`${PB_BASE_URL}/api/collections/historico/records?filter=${filter}&perPage=200&sort=-created`);
      if (!res.ok) throw new Error();
      return (await res.json()).items;
    },
    enabled: !!userId,
  });

  const saldo = saldoData?.saldo ?? 0;
  const isExpired = (validoAte: string) => !!validoAte && new Date(validoAte) < new Date();
  const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const getLabel = (item: HistoricoItem) => {
    if (item.tipo === "CREDITO" && item.missao_nome) return item.missao_nome;
    if (item.tipo === "DEBITO" && item.pedido_id) return `Pedido #${item.pedido_id.slice(0, 8)}`;
    return item.observacao || "Transação";
  };

  return (
    <AccountLayout>
      {unidades.length > 1 && selectedNome && (
        <p className="text-xs text-muted-foreground mb-6">
          Unidade: <span className="font-semibold text-foreground">{selectedNome}</span>
        </p>
      )}

      <div className="mb-12">
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Saldo disponível</p>
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-light tracking-tight">{saldo.toLocaleString("pt-BR")}</span>
          <span className="text-sm text-muted-foreground">pontos</span>
        </div>
      </div>

      {historicoItems.length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">Nenhum registro de pontos ainda.</p>
      ) : (
        <div className="divide-y divide-border/40">
          {historicoItems.map((item) => {
            const isCredito = item.tipo === "CREDITO";
            const expired = isCredito && isExpired(item.valido_ate);
            return (
              <div key={item.id} className={`py-4 flex items-center justify-between gap-4 ${expired ? "opacity-40" : ""}`}>
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${isCredito ? "bg-emerald-500" : "bg-red-400"}`} />
                  <div className="min-w-0">
                    <p className="text-sm truncate">{getLabel(item)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(item.created)}
                      {isCredito && item.valido_ate && (
                        <span className={`ml-2 ${expired ? "text-orange-500" : ""}`}>
                          · expira {new Date(item.valido_ate).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-medium tabular-nums shrink-0 ${isCredito ? "text-emerald-600" : "text-red-500"}`}>
                  {isCredito ? "+" : "−"}{(item.valor ?? item.saldo ?? 0).toLocaleString("pt-BR")}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </AccountLayout>
  );
}
