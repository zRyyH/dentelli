"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SimpleForm } from "@/components/simple-form";
import { BatchQueue } from "@/components/batch-queue";
import { BatchToggle } from "@/components/batch-toggle";
import { useUnidades, useEstoques, useProdutosAdmin } from "@/hooks/use-admin-data";
import { useBatch } from "@/hooks/use-batch";
import { formatCurrency } from "@/lib/formatters";

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
import { toast } from "sonner";

interface BatchEstoque {
  _id: string;
  tipo: TipoFluxo;
  unidadeId: string;
  unidadeNome: string;
  produtoId: string;
  produtoNome: string;
  quantidade: number;
  nomeLote: string;
  custoUnitario: string;
  observacao: string;
  status?: "pending" | "success" | "error";
}

type TipoFluxo = "ENTRADA" | "SAIDA";

const lbl = "block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5";
const inp = "bg-card text-card-foreground h-9";

export default function EstoquePage() {
  const [tipoFluxo, setTipoFluxo] = useState<TipoFluxo>("ENTRADA");
  const [unidadeId, setUnidadeId] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const [nomeLote, setNomeLote] = useState("");
  const [custoUnitario, setCustoUnitario] = useState("0,00");
  const [quantidade, setQuantidade] = useState("1");
  const [observacao, setObservacao] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [batchMode, setBatchMode] = useState(false);

  const batch = useBatch<BatchEstoque>();
  const { data: unidades = [] } = useUnidades();
  const { data: produtos = [] } = useProdutosAdmin();
  const { data: estoques = [] } = useEstoques(unidadeId);

  const estoqueQtd = (() => {
    if (!produtoId || !unidadeId) return "";
    const mov = estoques.find((e) => e.produto === produtoId);
    return mov ? String(mov.quantidade) : "0";
  })();

  const custoTotal = (() => {
    const cu = parseFloat(custoUnitario.replace(/\./g, "").replace(",", ".")) || 0;
    return (cu * (parseFloat(quantidade) || 0)).toFixed(2).replace(".", ",");
  })();

  const resetFields = () => { setProdutoId(""); setNomeLote(""); setCustoUnitario("0,00"); setQuantidade("1"); setObservacao(""); };

  useEffect(() => { resetFields(); }, [tipoFluxo]);
  useEffect(() => { setProdutoId(""); }, [unidadeId]);

  const produtosDisponiveis = tipoFluxo === "SAIDA"
    ? produtos.filter((p) => estoques.some((e) => e.produto === p.id))
    : produtos;

  const buildBody = (item: BatchEstoque) => {
    const body: any = { tipo: item.tipo, unidade: item.unidadeId, produto: item.produtoId, quantidade: item.quantidade };
    if (item.tipo === "ENTRADA") {
      body.observacao = item.nomeLote;
      body.custo_unitario = parseFloat(item.custoUnitario.replace(/\./g, "").replace(",", ".")) || 0;
    } else {
      body.observacao = item.observacao;
      body.status = "PENDENTE";
    }
    return body;
  };

  const handleSubmit = async () => {
    if (!unidadeId) { toast.error("Selecione uma unidade"); return; }
    if (!produtoId) { toast.error("Selecione um produto"); return; }

    setSubmitting(true);
    try {
      await apiPost("/api/admin/estoque", {
        tipo: tipoFluxo,
        unidadeId, produtoId,
        quantidade: parseInt(quantidade) || 1,
        nomeLote, custoUnitario, observacao,
        produto: produtos.find((p) => p.id === produtoId) ?? { id: produtoId },
        unidade: unidades.find((u) => u.id === unidadeId) ?? { id: unidadeId },
      });
      toast.success(`${tipoFluxo === "ENTRADA" ? "Entrada" : "Saída"} cadastrada com sucesso!`);
      resetFields();
      setUnidadeId("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao cadastrar");
    } finally {
      setSubmitting(false);
    }
  };

  const addToBatch = () => {
    if (!unidadeId) { toast.error("Selecione uma unidade"); return; }
    if (!produtoId) { toast.error("Selecione um produto"); return; }
    batch.add({
      tipo: tipoFluxo,
      unidadeId, unidadeNome: unidades.find((u) => u.id === unidadeId)?.nome || "",
      produtoId, produtoNome: produtos.find((p) => p.id === produtoId)?.nome || "",
      quantidade: parseInt(quantidade) || 1,
      nomeLote, custoUnitario, observacao,
    });
    resetFields();
    toast.success("Item adicionado ao lote");
  };

  const submitBatch = async () => {
    const result = await batch.run(async (item) => {
      try {
        await apiPost("/api/admin/estoque", {
          tipo: item.tipo,
          unidadeId: item.unidadeId, produtoId: item.produtoId,
          quantidade: item.quantidade,
          nomeLote: item.nomeLote, custoUnitario: item.custoUnitario, observacao: item.observacao,
          produto: { id: item.produtoId, nome: item.produtoNome },
          unidade: { id: item.unidadeId, nome: item.unidadeNome },
        });
        return true;
      } catch {
        return false;
      }
    });
    if (!result) return;
    if (result.errors === 0) {
      toast.success(`${result.total} item(s) cadastrado(s) com sucesso!`);
      batch.clear();
    } else {
      toast.error(`${result.errors} de ${result.total} item(s) falharam.`);
      batch.clearSuccesses();
    }
  };

  return (
    <SimpleForm title="ESTOQUE">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div>
          <label className={lbl}>Tipo de movimentação</label>
          <Tabs value={tipoFluxo} onValueChange={(v) => setTipoFluxo(v as TipoFluxo)}>
            <TabsList className="w-full max-w-xs">
              <TabsTrigger value="ENTRADA" className="flex-1">ENTRADA</TabsTrigger>
              <TabsTrigger value="SAIDA" className="flex-1">SAÍDA</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="pb-0.5">
          <BatchToggle id="sw-batch-est" checked={batchMode}
            onCheckedChange={(v) => { setBatchMode(v); if (!v) batch.clear(); }} />
        </div>
      </div>

      <hr className="border-border" />

      <div>
        <label className={lbl}>Unidade <span className="text-destructive">*</span></label>
        <Select value={unidadeId} onValueChange={setUnidadeId} items={Object.fromEntries(unidades.map((u) => [u.id, u.nome]))}>
          <SelectTrigger className="bg-card text-card-foreground max-w-xs h-9"><SelectValue placeholder="Selecione uma unidade" /></SelectTrigger>
          <SelectContent>{unidades.map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <hr className="border-border" />

      {tipoFluxo === "ENTRADA" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Nome do lote <span className="text-destructive">*</span></label>
              <Input placeholder="Descrição" value={nomeLote} onChange={(e) => setNomeLote(e.target.value)} className={inp} />
            </div>
            <div>
              <label className={lbl}>Produto <span className="text-destructive">*</span></label>
              <Select value={produtoId} onValueChange={setProdutoId} items={Object.fromEntries(produtosDisponiveis.map((p) => [p.id, p.nome]))}>
                <SelectTrigger className="bg-card text-card-foreground h-9"><SelectValue placeholder="Selecione uma opção" /></SelectTrigger>
                <SelectContent>{produtosDisponiveis.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={lbl}>Custo unitário <span className="text-destructive">*</span></label>
              <Input value={custoUnitario} onChange={(e) => setCustoUnitario(formatCurrency(e.target.value))} className={inp} />
            </div>
            <div>
              <label className={lbl}>Quantidade <span className="text-destructive">*</span></label>
              <Input type="number" min="1" value={quantidade} onChange={(e) => setQuantidade(e.target.value.replace(/[^0-9]/g, ""))} className={inp} />
            </div>
            <div>
              <label className={lbl}>Custo total</label>
              <Input value={custoTotal} readOnly className="bg-muted text-muted-foreground h-9 cursor-not-allowed" />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className={lbl}>Produto <span className="text-destructive">*</span></label>
              <Select value={produtoId} onValueChange={setProdutoId} items={Object.fromEntries(produtosDisponiveis.map((p) => [p.id, p.nome]))}>
                <SelectTrigger className="bg-card text-card-foreground h-9"><SelectValue placeholder="Selecione um produto" /></SelectTrigger>
                <SelectContent>{produtosDisponiveis.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="w-24">
              <label className={lbl}>Quantidade</label>
              <Input type="number" min="1" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} className={inp} />
            </div>
            <div className="w-24">
              <label className={lbl}>Estoque</label>
              <Input value={estoqueQtd} readOnly className={`${inp} cursor-not-allowed`} />
            </div>
          </div>
          <div>
            <label className={lbl}>Observação</label>
            <Textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} className="bg-card text-card-foreground resize-y" />
          </div>
        </div>
      )}

      <hr className="border-border" />

      <div className="flex justify-center pt-2">
        {batchMode ? (
          <Button type="button" variant="outline"
            className="px-14 py-3 text-base font-bold tracking-wide border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            onClick={addToBatch}>
            <Plus className="h-4 w-4 mr-2" /> ADICIONAR AO LOTE
          </Button>
        ) : (
          <Button className="px-14 py-3 text-base font-bold tracking-wide" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "ENVIANDO..." : tipoFluxo === "ENTRADA" ? "CADASTRAR ENTRADA" : "CADASTRAR SAÍDA"}
          </Button>
        )}
      </div>

      {batchMode && (
        <BatchQueue items={batch.queue} onRemove={batch.remove} onSubmit={submitBatch}
          submitting={batch.submitting} progress={batch.progress}
          singular="item" plural="itens"
          renderItem={(item) => (
            <>
              <p className="font-medium text-card-foreground truncate">{item.produtoNome}</p>
              <p className="text-xs text-muted-foreground">{item.tipo} · {item.unidadeNome} · {item.quantidade} un.</p>
            </>
          )}
        />
      )}
    </SimpleForm>
  );
}
