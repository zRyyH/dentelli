"use client";

import { useQuery } from "@tanstack/react-query";
import { AccountLayout } from "@/components/account-layout";
import { PageLoader } from "@/components/page-loader";
import { getUserId } from "@/lib/pb";
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
  missao_categoria: string;
  pedido_id: string;
  indicacao_nome: string;
}

interface SaldoData {
  saldo: number;
}

export default function HistoricoPage() {
  const userId = getUserId();
  const { selectedId: unidadeId, selectedNome, unidades } = useUnidade();

  const { data: saldoData, isLoading: saldoLoading } = useQuery<SaldoData>({
    queryKey: ["saldo", userId, unidadeId],
    queryFn: async () => {
      const params = unidadeId ? `?unidadeId=${unidadeId}` : "";
      const res = await fetch(`/api/saldo${params}`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!userId,
  });

  const { data: historicoItems = [], isLoading: historicoLoading } = useQuery<HistoricoItem[]>({
    queryKey: ["historico", userId, unidadeId],
    queryFn: async () => {
      if (!userId) return [];
      const params = unidadeId ? `?unidadeId=${unidadeId}` : "";
      const res = await fetch(`/api/historico${params}`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!userId,
  });

  const isLoading = saldoLoading || historicoLoading;
  const saldo = saldoData?.saldo ?? 0;
  const isExpired = (validoAte: string) => !!validoAte && new Date(validoAte) < new Date();
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <AccountLayout>
      {isLoading && <PageLoader />}
      {!isLoading && (
        <>
          {unidades.length > 1 && selectedNome && (
            <p className="text-xs text-muted-foreground mb-6">
              Unidade: <span className="font-semibold text-foreground">{selectedNome}</span>
            </p>
          )}

          {/* Saldo */}
          <div className="mb-10 pb-8 border-b border-border/50">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Saldo disponível</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-light tracking-tight">{saldo.toLocaleString("pt-BR")}</span>
              <span className="text-sm text-muted-foreground">pontos</span>
            </div>
          </div>

          {/* Lista */}
          {historicoItems.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">Nenhum registro de pontos ainda.</p>
          ) : (
            <div className="space-y-1">
              {historicoItems.map((item) => {
                const isCredito = item.tipo === "CREDITO";
                const expired = isCredito && isExpired(item.valido_ate);
                const pontos = (item.valor ?? item.saldo ?? 0).toLocaleString("pt-BR");

                const titulo = (() => {
                  if (isCredito && item.missao_nome) return item.missao_nome;
                  if (!isCredito && item.pedido_id) return `Pedido #${item.pedido_id.slice(0, 8).toUpperCase()}`;
                  return item.observacao || "Transação";
                })();

                const subtitulo = isCredito && item.missao_categoria === "INDICACAO" && item.indicacao_nome
                  ? item.indicacao_nome
                  : null;

                return (
                  <div
                    key={item.id}
                    className={`group flex items-start justify-between gap-4 rounded-xl px-4 py-3.5 transition-colors hover:bg-muted/40 ${expired ? "opacity-40" : ""}`}
                  >
                    {/* Indicador + textos */}
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${isCredito ? "bg-emerald-500" : "bg-red-400"}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-snug truncate">{titulo}</p>
                        {subtitulo && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitulo}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(item.created)}</p>
                      </div>
                    </div>

                    {/* Valor + expira */}
                    <div className="flex flex-col items-end shrink-0 gap-1">
                      <span className={`text-sm font-semibold tabular-nums ${isCredito ? "text-emerald-600" : "text-red-500"}`}>
                        {isCredito ? "+" : "−"}{pontos}
                      </span>
                      {isCredito && item.valido_ate && (
                        <span className={`text-[10px] font-medium uppercase tracking-wide ${expired ? "text-orange-500" : "text-muted-foreground/60"}`}>
                          EXPIRA {new Date(item.valido_ate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </AccountLayout>
  );
}
