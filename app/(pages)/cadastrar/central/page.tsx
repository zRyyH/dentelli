"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2, CheckCircle2, XCircle, Wallet, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SearchSelect } from "@/components/search-select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SimpleForm } from "@/components/simple-form";
import {
  useEmbaixadores, useMissoes,
  usePedidosPendentes, useSaldoEmbaixador, useIndicacoes,
} from "@/hooks/use-admin-data";
import { useUnidade } from "@/hooks/use-unidade";
import { toast } from "sonner";

async function apiPost(path: string, body: object) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as any).error || "Erro na requisição");
  }
  return res.json();
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface CreditoRow {
  _id: string;
  embaixadorId: string;
  missaoId: string;
  indicacaoId: string;
  observacao: string;
  pontos: number;
  status?: "pending" | "success" | "error";
  error?: string;
}

type TipoTransacao = "CREDITO" | "DEBITO";

const lbl = "block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5";
const inp = "bg-card text-card-foreground h-9";

function makeRow(): CreditoRow {
  return { _id: `${Date.now()}-${Math.random()}`, embaixadorId: "", missaoId: "", indicacaoId: "", observacao: "", pontos: 0 };
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CentralPage() {
  const [tipoTransacao, setTipoTransacao] = useState<TipoTransacao>("CREDITO");
  const [unidadeId, setUnidadeId] = useState("");

  // CRÉDITO — multi-row
  const [rows, setRows] = useState<CreditoRow[]>([makeRow()]);
  const [submitting, setSubmitting] = useState(false);

  // DÉBITO — single form
  const [embaixadorId, setEmbaixadorId] = useState("");
  const [pedidoId, setPedidoId] = useState("");
  const [pontosItem, setPontosItem] = useState("");
  const [observacaoDebito, setObservacaoDebito] = useState("");
  const [submittingDebito, setSubmittingDebito] = useState(false);

  const { unidades } = useUnidade();
  const { data: embaixadores = [], isLoading: loadingEmb } = useEmbaixadores(unidadeId || undefined);
  const { data: todasMissoes = [], isLoading: loadingMissoes } = useMissoes();

  const { data: pedidos = [] } = usePedidosPendentes(embaixadorId);
  const { data: saldoData, isLoading: saldoLoading } = useSaldoEmbaixador(embaixadorId, unidadeId || undefined);

  const missoes = useMemo(() => todasMissoes.filter((m) => !m.automatico), [todasMissoes]);
  const embaixadorOptions = useMemo(() => embaixadores.map((e) => ({ id: e.id, label: e.nome, searchText: [(e as any).cpf, (e as any).telefone].filter(Boolean).join(" ") })), [embaixadores]);

  const saldoPontos = (saldoData?.saldo ?? 0) + (saldoData?.pendente ?? 0);
  const custoDebito = parseFloat(pontosItem) || 0;
  const saldoApos = saldoPontos - custoDebito;

  // Reset quando unidade muda
  useEffect(() => {
    setRows([makeRow()]);
    setEmbaixadorId(""); setPedidoId(""); setPontosItem(""); setObservacaoDebito("");
  }, [unidadeId]);

  // Reset quando tipo muda
  useEffect(() => {
    setRows([makeRow()]);
    setEmbaixadorId(""); setPedidoId(""); setPontosItem(""); setObservacaoDebito("");
  }, [tipoTransacao]);

  // Reset pedido quando embaixador muda (débito)
  useEffect(() => {
    setPedidoId(""); setPontosItem(""); setObservacaoDebito("");
  }, [embaixadorId]);

  const updateRow = (id: string, patch: Partial<CreditoRow>) =>
    setRows((prev) => prev.map((r) => r._id === id ? { ...r, ...patch } : r));

  const removeRow = (id: string) =>
    setRows((prev) => prev.filter((r) => r._id !== id));

  const addRow = () => setRows((prev) => [...prev, makeRow()]);

  // ─── Submeter créditos ──────────────────────────────────────────────────
  const handleSubmitCredito = async () => {
    if (!unidadeId) { toast.error("Selecione uma unidade"); return; }
    const indicacaoKeys = new Set<string>();
    for (const row of rows) {
      if (!row.embaixadorId) { toast.error("Selecione o embaixador em todos os créditos"); return; }
      if (!row.missaoId) { toast.error("Selecione a missão em todos os créditos"); return; }
      const missao = missoes.find((m) => m.id === row.missaoId);
      if (missao?.categoria === "INDICACAO") {
        if (!row.indicacaoId) { toast.error("Selecione a indicação em todos os créditos de indicação"); return; }
        const key = `${row.missaoId}::${row.indicacaoId}`;
        if (indicacaoKeys.has(key)) { toast.error("Existe mais de um crédito com a mesma missão e indicação"); return; }
        indicacaoKeys.add(key);
      }
    }

    setSubmitting(true);
    const unidadeNome = unidades.find((u) => u.id === unidadeId)?.nome ?? "";
    let errors = 0;

    const updated = await Promise.all(
      rows.map(async (row) => {
        const embaixador = embaixadores.find((e) => e.id === row.embaixadorId) ?? { id: row.embaixadorId };
        const missao = missoes.find((m) => m.id === row.missaoId) ?? { id: row.missaoId };
        try {
          await apiPost("/api/admin/central", {
            tipo: "CREDITO",
            embaixadorId: row.embaixadorId,
            unidadeId,
            missaoId: row.missaoId,
            indicacaoId: row.indicacaoId,
            pontos: row.pontos,
            observacao: row.observacao,
            saldoPontos: 0,
            embaixador,
            unidade: { id: unidadeId, nome: unidadeNome },
            missao,
          });
          return { ...row, status: "success" as const };
        } catch (err: any) {
          errors++;
          return { ...row, status: "error" as const, error: err.message || "Erro" };
        }
      })
    );

    setRows(updated);
    setSubmitting(false);

    if (errors === 0) {
      toast.success(`${rows.length} crédito(s) registrado(s) com sucesso!`);
      setRows([makeRow()]);
    } else {
      toast.error(`${errors} de ${rows.length} crédito(s) falharam.`);
    }
  };

  // ─── Submeter débito ────────────────────────────────────────────────────
  const handleSubmitDebito = async () => {
    if (!unidadeId || !embaixadorId) { toast.error("Preencha unidade e embaixador"); return; }
    if (!pedidoId) { toast.error("Selecione um pedido"); return; }
    if (saldoApos < 0) { toast.error("Saldo insuficiente para este resgate"); return; }

    setSubmittingDebito(true);
    try {
      await apiPost("/api/admin/central", {
        tipo: "DEBITO",
        embaixadorId, unidadeId, pedidoId, custoDebito, observacaoDebito, saldoPontos,
        embaixador: embaixadores.find((e) => e.id === embaixadorId) ?? { id: embaixadorId },
        unidade: unidades.find((u) => u.id === unidadeId) ?? { id: unidadeId },
        pedido: pedidos.find((p) => p.id === pedidoId) ?? { id: pedidoId },
        missaoId: "", indicacaoId: "", pontos: 0, observacao: observacaoDebito, missao: {},
      });
      toast.success("Resgate registrado com sucesso!");
      setEmbaixadorId(""); setPedidoId(""); setPontosItem(""); setObservacaoDebito("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar");
    } finally {
      setSubmittingDebito(false);
    }
  };

  const selectPedido = (id: string) => {
    const pedido = pedidos.find((p) => p.id === id);
    if (pedido) { setPedidoId(id); setPontosItem(String(pedido.pontos)); setObservacaoDebito((pedido as any).descricao || ""); }
  };

  return (
    <SimpleForm title="CENTRAL DE PONTOS">
      {/* Tipo + Unidade */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <div>
          <label className={lbl}>Tipo de transação</label>
          <Tabs value={tipoTransacao} onValueChange={(v) => setTipoTransacao(v as TipoTransacao)}>
            <TabsList className="w-full max-w-xs">
              <TabsTrigger value="CREDITO" className="flex-1">CRÉDITO</TabsTrigger>
              <TabsTrigger value="DEBITO" className="flex-1">DÉBITO</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div>
          <label className={lbl}>Unidade</label>
          <SearchSelect
            value={unidadeId}
            onChange={setUnidadeId}
            options={unidades.map((u) => ({ id: u.id, label: u.nome }))}
            placeholder="Selecione uma unidade"
            loading={unidades.length === 0}
          />
        </div>
      </div>

      <hr className="border-border" />

      {/* ── CRÉDITO ── */}
      {tipoTransacao === "CREDITO" && (<>
        <div className="space-y-3">
          {rows.map((row, idx) => {
            const isDuplicateIndicacao = (() => {
              const missao = missoes.find((m) => m.id === row.missaoId);
              if (missao?.categoria !== "INDICACAO" || !row.indicacaoId) return false;
              return rows.some((r) => r._id !== row._id && r.missaoId === row.missaoId && r.indicacaoId === row.indicacaoId);
            })();
            return (
              <CreditoRowForm
                key={row._id}
                row={row}
                idx={idx}
                total={rows.length}
                embaixadorOptions={embaixadorOptions}
                missoes={missoes}
                unidadeSelecionada={!!unidadeId}
                loadingEmb={!!unidadeId && loadingEmb}
                loadingMissoes={loadingMissoes}
                isDuplicateIndicacao={isDuplicateIndicacao}
                onUpdate={(patch) => updateRow(row._id, patch)}
                onRemove={() => removeRow(row._id)}
              />
            );
          })}
        </div>

        <div className="flex justify-center">
          <Button type="button" variant="outline" size="sm"
            onClick={addRow} disabled={!unidadeId}
            className="border-dashed border-primary text-primary hover:bg-primary/5">
            <Plus className="h-4 w-4 mr-1.5" /> NOVO CRÉDITO
          </Button>
        </div>

        <hr className="border-border" />

        <div className="flex justify-center pt-2">
          <Button className="px-14 py-3 text-base font-bold tracking-wide"
            onClick={handleSubmitCredito}
            disabled={submitting || !unidadeId || rows.length === 0 || rows.some((row) => {
              const m = missoes.find((m) => m.id === row.missaoId);
              return m?.categoria === "INDICACAO" && !!row.indicacaoId &&
                rows.filter((r) => r.missaoId === row.missaoId && r.indicacaoId === row.indicacaoId).length > 1;
            })}>
            {submitting
              ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> ENVIANDO...</>
              : `PONTUAR${rows.length > 1 ? ` (${rows.length})` : ""}`}
          </Button>
        </div>
      </>)}

      {/* ── DÉBITO ── */}
      {tipoTransacao === "DEBITO" && (<>
        <div>
          <label className={lbl}>Embaixador</label>
          <SearchSelect
            value={embaixadorId}
            onChange={setEmbaixadorId}
            options={embaixadorOptions}
            placeholder={!unidadeId ? "Selecione a unidade primeiro" : "Selecione um embaixador"}
            disabled={!unidadeId}
            loading={!!unidadeId && loadingEmb}
          />
        </div>

        {embaixadorId && (
          <div className="rounded-xl border border-border bg-muted/30 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Wallet className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-muted-foreground">Saldo disponível</span>
            </div>
            {saldoLoading
              ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              : <span className="text-2xl font-bold text-primary tabular-nums">{saldoPontos.toLocaleString("pt-BR")} <span className="text-sm font-medium">pts</span></span>}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-[1fr_6rem] gap-4 items-end">
            <div>
              <label className={lbl}>Pedido</label>
              <SearchSelect
                value={pedidoId}
                onChange={selectPedido}
                options={pedidos.map((p, idx) => ({
                  id: p.id,
                  label: `Pedido ${idx + 1} • ${new Date(p.created).toLocaleDateString("pt-BR")} • ${p.pontos} pts • ${p.item?.length ?? 0} ${(p.item?.length ?? 0) === 1 ? "item" : "itens"}`,
                  searchText: `${p.id} ${p.pontos} ${new Date(p.created).toLocaleDateString("pt-BR")}`,
                }))}
                placeholder="Selecione um pedido"
                disabled={!embaixadorId}
              />
            </div>
            <div>
              <label className={lbl}>Custo pts</label>
              <Input value={pontosItem} readOnly className={`${inp} cursor-not-allowed`} />
            </div>
          </div>

          {pedidoId && (() => {
            const pedidoSel = pedidos.find((p) => p.id === pedidoId);
            const itens: any[] = (pedidoSel as any)?.itens ?? [];
            if (!itens.length) return null;
            return (
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="px-3 py-2 bg-muted/40 border-b border-border">
                  <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Itens do pedido — {itens.length} {itens.length === 1 ? "produto" : "produtos"}
                  </span>
                </div>
                {itens.map((it, idx) => (
                  <div key={it.id} className="flex items-center gap-2 px-3 py-2 border-b border-border last:border-0 text-sm">
                    <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">{idx + 1}</span>
                    <span className="flex-1 truncate text-card-foreground font-medium">{it.produtoNome}</span>
                    <span className="text-xs text-muted-foreground">× {it.quantidade}</span>
                    <span className="text-xs font-bold text-primary shrink-0">{(it.pontos * it.quantidade).toLocaleString("pt-BR")} pts</span>
                  </div>
                ))}
              </div>
            );
          })()}

          <div>
            <label className={lbl}>Observação</label>
            <Input value={observacaoDebito} onChange={(e) => setObservacaoDebito(e.target.value)} className={inp} />
          </div>
          {pedidoId && (
            <div className={`rounded-xl border px-5 py-4 flex items-center justify-between ${saldoApos < 0 ? "border-destructive/40 bg-destructive/5" : "border-emerald-400/40 bg-emerald-500/5"}`}>
              <div className="flex items-center gap-2.5">
                {saldoApos < 0
                  ? <AlertTriangle className="h-5 w-5 text-destructive" />
                  : <Wallet className="h-5 w-5 text-emerald-600" />}
                <span className="text-sm font-semibold text-muted-foreground">Saldo após resgate</span>
              </div>
              <span className={`text-2xl font-bold tabular-nums ${saldoApos < 0 ? "text-destructive" : "text-emerald-600"}`}>
                {saldoApos.toLocaleString("pt-BR")} <span className="text-sm font-medium">pts</span>
              </span>
            </div>
          )}
        </div>

        <hr className="border-border" />

        <div className="flex justify-center pt-2">
          <Button className="px-14 py-3 text-base font-bold tracking-wide"
            disabled={submittingDebito || !unidadeId || !embaixadorId || !pedidoId}
            onClick={handleSubmitDebito}>
            {submittingDebito ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
            RESGATAR
          </Button>
        </div>
      </>)}
    </SimpleForm>
  );
}

// ─── CreditoRowForm ───────────────────────────────────────────────────────────
interface CreditoRowProps {
  row: CreditoRow;
  idx: number;
  total: number;
  embaixadorOptions: { id: string; label: string; searchText?: string }[];
  missoes: any[];
  unidadeSelecionada: boolean;
  loadingEmb?: boolean;
  loadingMissoes?: boolean;
  isDuplicateIndicacao?: boolean;
  onUpdate: (patch: Partial<CreditoRow>) => void;
  onRemove: () => void;
}

function CreditoRowForm({ row, idx, total, embaixadorOptions, missoes, unidadeSelecionada, loadingEmb, loadingMissoes, isDuplicateIndicacao, onUpdate, onRemove }: CreditoRowProps) {
  const { data: indicacoes = [], isLoading: loadingIndicacoes } = useIndicacoes(row.embaixadorId || undefined);
  const missaoSelecionada = missoes.find((m) => m.id === row.missaoId);
  const isIndicacao = missaoSelecionada?.categoria === "INDICACAO";

  const handleMissaoChange = (id: string) => {
    const missao = missoes.find((m) => m.id === id);
    onUpdate({ missaoId: id, indicacaoId: "", pontos: missao?.pontos || 0 });
  };

  const statusIcon = row.status === "success"
    ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
    : row.status === "error"
    ? <XCircle className="h-4 w-4 text-destructive shrink-0" />
    : null;

  return (
    <div className={`rounded-lg border p-4 space-y-3 transition-colors ${
      row.status === "success" ? "border-emerald-400/50 bg-emerald-50/30 dark:bg-emerald-950/10"
      : row.status === "error" ? "border-destructive/40 bg-destructive/5"
      : "border-border bg-card/30"
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {statusIcon}
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Crédito {idx + 1}</span>
          {row.error && <span className="text-xs text-destructive">{row.error}</span>}
        </div>
        {total > 1 && row.status !== "success" && (
          <button type="button" onClick={onRemove}
            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_6rem] gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Embaixador</label>
          <SearchSelect
            value={row.embaixadorId}
            onChange={(v) => onUpdate({ embaixadorId: v, indicacaoId: "" })}
            options={embaixadorOptions}
            placeholder={!unidadeSelecionada ? "Selecione a unidade primeiro" : "Selecione um embaixador"}
            disabled={!unidadeSelecionada || row.status === "success"}
            loading={loadingEmb}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Missão</label>
          <SearchSelect
            value={row.missaoId}
            onChange={handleMissaoChange}
            options={missoes.map((m) => ({ id: m.id, label: m.missao, searchText: m.categoria ?? "" }))}
            placeholder="Selecione uma missão"
            disabled={row.status === "success"}
            loading={loadingMissoes}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Pontos</label>
          <Input value={row.pontos || ""} readOnly className="bg-card text-card-foreground h-9 cursor-not-allowed" />
        </div>
      </div>

      {isIndicacao && (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Indicação</label>
          <SearchSelect
            value={row.indicacaoId}
            onChange={(v) => onUpdate({ indicacaoId: v })}
            options={indicacoes.map((i) => ({ id: i.id, label: `${i.nome} — ${i.telefone}`, searchText: `${i.telefone.replace(/\D/g, "")} ${(i as any).relacao}` }))}
            placeholder={!row.embaixadorId ? "Selecione o embaixador primeiro" : "Buscar por nome ou telefone..."}
            disabled={!row.embaixadorId || row.status === "success"}
            loading={!!row.embaixadorId && loadingIndicacoes}
          />
          {isDuplicateIndicacao && (
            <p className="text-xs text-destructive mt-1">Esta combinação de missão e indicação já existe em outro crédito</p>
          )}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Observação</label>
        <Textarea
          value={row.observacao}
          onChange={(e) => onUpdate({ observacao: e.target.value })}
          className="bg-card text-card-foreground min-h-[36px]"
          disabled={row.status === "success"}
        />
      </div>
    </div>
  );
}
