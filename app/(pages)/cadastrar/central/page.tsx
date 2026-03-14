"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SearchSelect } from "@/components/search-select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SimpleForm } from "@/components/simple-form";
import { BatchQueue } from "@/components/batch-queue";
import { BatchToggle } from "@/components/batch-toggle";
import {
  useUnidades, useEmbaixadores, useMissoes,
  usePedidosPendentes, useSaldoEmbaixador, useIndicacoes,
} from "@/hooks/use-admin-data";
import { useBatch } from "@/hooks/use-batch";
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

interface BatchCredito {
  _id: string;
  unidadeId: string;
  unidadeNome: string;
  embaixadorId: string;
  embaixadorNome: string;
  missaoId: string;
  missaoNome: string;
  indicacaoId: string;
  pontos: number;
  observacao: string;
  status?: "pending" | "success" | "error";
}

type TipoTransacao = "CREDITO" | "DEBITO";

const lbl = "block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5";
const inp = "bg-card text-card-foreground h-9";

export default function CentralPage() {
const [tipoTransacao, setTipoTransacao] = useState<TipoTransacao>("CREDITO");
  const [unidadeId, setUnidadeId] = useState("");
  const [embaixadorId, setEmbaixadorId] = useState("");
  const [missaoId, setMissaoId] = useState("");
  const [indicacaoId, setIndicacaoId] = useState("");
  const [observacao, setObservacao] = useState("");
  const [pontos, setPontos] = useState(0);
  const [pedidoId, setPedidoId] = useState("");
  const [pontosItem, setPontosItem] = useState("");
  const [observacaoDebito, setObservacaoDebito] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [batchMode, setBatchMode] = useState(false);

  const batch = useBatch<BatchCredito>();
  const { data: todasUnidades = [] } = useUnidades();
  const { data: embaixadores = [] } = useEmbaixadores(); // todos
  const { data: todasMissoes = [] } = useMissoes();
  const { data: todasIndicacoes = [] } = useIndicacoes();
  const { data: pedidos = [] } = usePedidosPendentes(embaixadorId);
  const { data: saldoData } = useSaldoEmbaixador(embaixadorId, unidadeId || undefined);

  const embaixadorSelecionado = useMemo(() => embaixadores.find((e) => e.id === embaixadorId), [embaixadores, embaixadorId]);

  const unidades = useMemo(() => {
    if (!embaixadorSelecionado?.unidade) return [];
    const ids = Array.isArray(embaixadorSelecionado.unidade)
      ? embaixadorSelecionado.unidade
      : [embaixadorSelecionado.unidade];
    return todasUnidades.filter((u) => ids.includes(u.id));
  }, [todasUnidades, embaixadorSelecionado]);

  const missoes = useMemo(() => todasMissoes.filter((m) => !m.automatico), [todasMissoes]);
  const missaoSelecionada = useMemo(() => missoes.find((m) => m.id === missaoId), [missaoId, missoes]);
  const missaoCategoria = missaoSelecionada?.categoria ?? "";

  const saldoPontos = (saldoData?.pendente ?? 0) + (saldoData?.saldo ?? 0);
  const custoDebito = parseFloat(pontosItem) || 0;
  const saldoApos = saldoPontos - custoDebito;

  const resetTransacao = () => {
    setMissaoId(""); setIndicacaoId(""); setObservacao(""); setPontos(0);
    setPedidoId(""); setPontosItem(""); setObservacaoDebito("");
  };

  useEffect(() => { resetTransacao(); setBatchMode(false); batch.clear(); }, [tipoTransacao]);
  useEffect(() => { setUnidadeId(""); resetTransacao(); }, [embaixadorId]);
  useEffect(() => { resetTransacao(); }, [unidadeId]);

  const handleMissaoChange = (id: string) => {
    const missao = missoes.find((m) => m.id === id);
    setMissaoId(id);
    setIndicacaoId("");
    setPontos(missao?.pontos || 0);
  };

  const selectPedido = (id: string) => {
    const pedido = pedidos.find((p) => p.id === id);
    if (pedido) {
      setPedidoId(id);
      setPontosItem(String(pedido.pontos));
      setObservacaoDebito((pedido as any).descricao || "");
    }
  };

  const handleSubmit = async () => {
    if (!unidadeId || !embaixadorId) { toast.error("Preencha unidade e embaixador"); return; }
    if (tipoTransacao === "CREDITO" && !missaoId) { toast.error("Selecione uma missão"); return; }
    if (tipoTransacao === "CREDITO" && missaoCategoria === "INDICACAO" && !indicacaoId) { toast.error("Selecione uma indicação para esta missão"); return; }
    if (tipoTransacao === "DEBITO") {
      if (!pedidoId) { toast.error("Selecione um pedido"); return; }
      if (saldoApos < 0) { toast.error("Saldo insuficiente para este resgate"); return; }
    }

    setSubmitting(true);
    try {
      await apiPost("/api/admin/central", {
        tipo: tipoTransacao,
        embaixadorId, unidadeId, missaoId, indicacaoId, pontos, observacao,
        pedidoId, custoDebito, observacaoDebito,
        saldoPontos,
        embaixador: embaixadores.find((e) => e.id === embaixadorId) ?? { id: embaixadorId },
        unidade: unidades.find((u) => u.id === unidadeId) ?? { id: unidadeId },
        missao: missoes.find((m) => m.id === missaoId) ?? { id: missaoId },
        pedido: pedidos.find((p) => p.id === pedidoId) ?? { id: pedidoId },
      });
      if (tipoTransacao === "CREDITO") {
        toast.success("Pontuação registrada com sucesso!");
        resetTransacao();
        setUnidadeId("");
      } else {
        toast.success("Resgate registrado com sucesso!");
        resetTransacao();
        setPedidoId(""); setPontosItem(""); setObservacaoDebito("");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar");
    } finally {
      setSubmitting(false);
    }
  };

  const addToBatch = () => {
    if (!unidadeId || !embaixadorId) { toast.error("Preencha unidade e embaixador"); return; }
    if (!missaoId) { toast.error("Selecione uma missão"); return; }
    if (missaoCategoria === "INDICACAO" && !indicacaoId) { toast.error("Selecione uma indicação para esta missão"); return; }
    batch.add({
      unidadeId, unidadeNome: unidades.find((u) => u.id === unidadeId)?.nome || "",
      embaixadorId, embaixadorNome: embaixadores.find((e) => e.id === embaixadorId)?.nome || "",
      missaoId, missaoNome: missoes.find((m) => m.id === missaoId)?.missao || "",
      indicacaoId,
      pontos, observacao,
    });
    setMissaoId(""); setIndicacaoId(""); setObservacao(""); setPontos(0);
    toast.success("Adicionado ao lote");
  };

  const submitBatch = async () => {
    const result = await batch.run(async (item) => {
      try {
        await apiPost("/api/admin/central", {
          tipo: "CREDITO",
          embaixadorId: item.embaixadorId,
          unidadeId: item.unidadeId,
          missaoId: item.missaoId,
          indicacaoId: item.indicacaoId,
          pontos: item.pontos,
          observacao: item.observacao,
          saldoPontos: 0,
          embaixador: { id: item.embaixadorId, nome: item.embaixadorNome },
          unidade: { id: item.unidadeId, nome: item.unidadeNome },
          missao: { id: item.missaoId, missao: item.missaoNome, pontos: item.pontos },
        });
        return true;
      } catch {
        return false;
      }
    });
    if (!result) return;
    if (result.errors === 0) {
      toast.success(`${result.total} pontuação(ões) registrada(s) com sucesso!`);
      batch.clear();
    } else {
      toast.error(`${result.errors} de ${result.total} item(s) falharam.`);
      batch.clearSuccesses();
    }
  };

  return (
    <SimpleForm title="CENTRAL DE PONTOS">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div>
          <label className={lbl}>Tipo de transação</label>
          <Tabs value={tipoTransacao} onValueChange={(v) => setTipoTransacao(v as TipoTransacao)}>
            <TabsList className="w-full max-w-xs">
              <TabsTrigger value="CREDITO" className="flex-1">CRÉDITO</TabsTrigger>
              <TabsTrigger value="DEBITO" className="flex-1">DÉBITO</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        {tipoTransacao === "CREDITO" && (
          <div className="pb-0.5">
            <BatchToggle id="sw-batch-cp" checked={batchMode}
              onCheckedChange={(v) => { setBatchMode(v); if (!v) batch.clear(); }} />
          </div>
        )}
      </div>

      <hr className="border-border" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={lbl}>Embaixador</label>
          <SearchSelect
            value={embaixadorId}
            onChange={setEmbaixadorId}
            options={embaixadores.map((e) => ({ id: e.id, label: e.nome, searchText: [(e as any).cpf, (e as any).telefone].filter(Boolean).join(" ") }))}
            placeholder="Selecione um embaixador"
          />
        </div>
        <div>
          <label className={lbl}>Unidade</label>
          <SearchSelect
            value={unidadeId}
            onChange={setUnidadeId}
            options={unidades.map((u) => ({ id: u.id, label: u.nome }))}
            placeholder={!embaixadorId ? "Selecione o embaixador primeiro" : "Selecione uma unidade"}
            disabled={!embaixadorId || unidades.length === 0}
          />
        </div>
        <div>
          <label className={lbl}>{tipoTransacao === "CREDITO" ? "Saldo de pontos" : "Pontos disponíveis"}</label>
          <Input value={saldoPontos} readOnly className={`${inp} cursor-not-allowed`} />
        </div>
      </div>

      <hr className="border-border" />

      {tipoTransacao === "CREDITO" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4">
            <div>
              <label className={lbl}>Missão</label>
              <SearchSelect
                value={missaoId}
                onChange={handleMissaoChange}
                options={missoes.map((m) => ({ id: m.id, label: m.missao, searchText: m.categoria ?? "" }))}
                placeholder="Selecione uma opção"
              />
            </div>
            <div>
              <label className={lbl}>Observação</label>
              <Textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} className="bg-card text-card-foreground min-h-[36px]" />
            </div>
            <div className="w-24">
              <label className={lbl}>Pontos</label>
              <Input value={pontos || ""} readOnly className={`${inp} cursor-not-allowed`} />
            </div>
          </div>
          {missaoCategoria === "INDICACAO" && (
            <div>
              <label className={lbl}>Indicação</label>
              <SearchSelect
                value={indicacaoId}
                onChange={setIndicacaoId}
                options={todasIndicacoes.map((i) => ({
                  id: i.id,
                  label: `${i.nome} — ${i.telefone}`,
                  searchText: `${i.telefone.replace(/\D/g, "")} ${i.relacao}`,
                }))}
                placeholder="Buscar por nome, telefone ou relação..."
              />
            </div>
          )}
        </div>
      ) : (
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
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Saldo após:</span>
            <Input value={saldoApos} readOnly className="w-28 h-9 bg-card text-card-foreground cursor-not-allowed text-right" />
          </div>
        </div>
      )}

      <hr className="border-border" />

      <div className="flex justify-center pt-2">
        {batchMode && tipoTransacao === "CREDITO" ? (
          <Button type="button" variant="outline"
            className="px-14 py-3 text-base font-bold tracking-wide border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            onClick={addToBatch} disabled={!unidadeId || !embaixadorId || !missaoId}>
            <Plus className="h-4 w-4 mr-2" /> ADICIONAR AO LOTE
          </Button>
        ) : (
          <Button className="px-14 py-3 text-base font-bold tracking-wide"
            disabled={submitting || !unidadeId || !embaixadorId || (tipoTransacao === "CREDITO" ? !missaoId : !pedidoId)}
            onClick={handleSubmit}>
            {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
            {tipoTransacao === "CREDITO" ? "PONTUAR" : "RESGATAR"}
          </Button>
        )}
      </div>

      {batchMode && tipoTransacao === "CREDITO" && (
        <BatchQueue items={batch.queue} onRemove={batch.remove} onSubmit={submitBatch}
          submitting={batch.submitting} progress={batch.progress}
          singular="pontuação" plural="pontuações"
          emptyHint={`Selecione embaixador + missão e clique em "Adicionar ao Lote"`}
          renderItem={(item) => (
            <>
              <p className="font-medium text-card-foreground truncate">{item.embaixadorNome}</p>
              <p className="text-xs text-muted-foreground truncate">{item.missaoNome} · {item.pontos} pts · {item.unidadeNome}</p>
            </>
          )}
        />
      )}
    </SimpleForm>
  );
}
