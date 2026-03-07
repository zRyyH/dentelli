"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SimpleForm } from "@/components/simple-form";
import { BatchQueue } from "@/components/batch-queue";
import { BatchToggle } from "@/components/batch-toggle";
import { useEmbaixadores, useUnidades, useAllColetores, useRelacoes } from "@/hooks/use-admin-data";
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

interface BatchIndicacao {
  _id: string;
  coletorId: string;
  coletorNome: string;
  embaixadorId: string;
  embaixadorNome: string;
  nome: string;
  telefone: string;
  relacaoId: string;
  relacaoNome: string;
  status?: "pending" | "success" | "error";
}

const lbl = "block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5";
const inp = "bg-card text-card-foreground h-9";

export default function IndicacoesPage() {
  const [coletorId, setColetorId] = useState("");
  const [embaixadorId, setEmbaixadorId] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [relacaoId, setRelacaoId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [batchMode, setBatchMode] = useState(false);

  const batch = useBatch<BatchIndicacao>();
  const { data: coletores = [] } = useAllColetores();
  const { data: relacoes = [] } = useRelacoes();
  const { data: unidades = [] } = useUnidades();

  const coletorSelecionado = useMemo(() => coletores.find((c) => c.id === coletorId), [coletorId, coletores]);
  const unidadeId = (coletorSelecionado as any)?.unidade || "";
  const unidadeNome = useMemo(() => unidades.find((u: any) => u.id === unidadeId)?.nome || "", [unidadeId, unidades]);
  const { data: embaixadores = [] } = useEmbaixadores(unidadeId || undefined);

  const embaixadorSelecionado = useMemo(() => embaixadores.find((e) => e.id === embaixadorId), [embaixadorId, embaixadores]);
  const tipo = (embaixadorSelecionado as any)?.tipo || "";
  const prontuario = (embaixadorSelecionado as any)?.prontuario || "";

  const resetIndicacao = () => { setNome(""); setTelefone(""); setRelacaoId(""); };

  const buildBody = (item: BatchIndicacao) => ({
    nome: item.nome, telefone: item.telefone, relacao: item.relacaoId,
    usuario_embaixador: item.embaixadorId, usuario_coletor: item.coletorId,
  });

  const validate = () => {
    if (!coletorId || !embaixadorId) { toast.error("Preencha coletor e embaixador"); return false; }
    if (!nome || !telefone) { toast.error("Preencha nome e telefone da indicação"); return false; }
    return true;
  };

  const handleCadastrar = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await apiPost("/api/admin/indicacao", {
        nome, telefone, relacaoId, embaixadorId, coletorId,
        coletor: coletores.find((c) => c.id === coletorId) ?? { id: coletorId },
        embaixador: embaixadores.find((e) => e.id === embaixadorId) ?? { id: embaixadorId },
        relacao: relacoes.find((r) => r.id === relacaoId) ?? { id: relacaoId },
        unidade: { id: unidadeId, nome: unidadeNome },
      });
      toast.success("Indicação cadastrada com sucesso!");
      resetIndicacao();
      setColetorId(""); setEmbaixadorId("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao cadastrar indicação");
    } finally {
      setSubmitting(false);
    }
  };

  const addToBatch = () => {
    if (!validate()) return;
    batch.add({
      coletorId, coletorNome: coletores.find((c) => c.id === coletorId)?.nome || "",
      embaixadorId, embaixadorNome: embaixadores.find((e) => e.id === embaixadorId)?.nome || "",
      nome, telefone,
      relacaoId, relacaoNome: relacoes.find((r) => r.id === relacaoId)?.nome || "",
    });
    resetIndicacao();
    toast.success("Indicação adicionada ao lote");
  };

  const submitBatch = async () => {
    const result = await batch.run(async (item) => {
      try {
        await apiPost("/api/admin/indicacao", {
          nome: item.nome, telefone: item.telefone,
          relacaoId: item.relacaoId, embaixadorId: item.embaixadorId, coletorId: item.coletorId,
          coletor: { id: item.coletorId, nome: item.coletorNome },
          embaixador: { id: item.embaixadorId, nome: item.embaixadorNome },
          relacao: { id: item.relacaoId, nome: item.relacaoNome },
        });
        return true;
      } catch {
        return false;
      }
    });
    if (!result) return;
    if (result.errors === 0) {
      toast.success(`${result.total} indicação(ões) cadastrada(s) com sucesso!`);
      batch.clear();
    } else {
      toast.error(`${result.errors} de ${result.total} item(s) falharam.`);
      batch.clearSuccesses();
    }
  };

  return (
    <SimpleForm title="CADASTRAR INDICAÇÃO">
      <div className="flex justify-end">
        <BatchToggle id="sw-batch-ind" checked={batchMode}
          onCheckedChange={(v) => { setBatchMode(v); if (!v) batch.clear(); }} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={lbl}>Coletor</label>
          <Select value={coletorId} onValueChange={setColetorId} items={Object.fromEntries(coletores.map((c) => [c.id, c.nome]))}>
            <SelectTrigger className="bg-card text-card-foreground h-9"><SelectValue placeholder="Selecione um coletor" /></SelectTrigger>
            <SelectContent>{coletores.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <label className={lbl}>Unidade</label>
          <Input value={unidadeNome} readOnly className={`${inp} cursor-not-allowed`} placeholder="..." />
        </div>
      </div>

      <hr className="border-border" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={lbl}>Embaixador</label>
          <Select value={embaixadorId} onValueChange={setEmbaixadorId} disabled={!unidadeId} items={Object.fromEntries(embaixadores.map((e) => [e.id, e.nome]))}>
            <SelectTrigger className="bg-card text-card-foreground h-9"><SelectValue placeholder="Selecione um embaixador" /></SelectTrigger>
            <SelectContent>{embaixadores.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <label className={lbl}>Tipo</label>
          <Input value={tipo} readOnly className={`${inp} cursor-not-allowed`} />
        </div>
        <div>
          <label className={lbl}>Prontuário</label>
          <Input value={prontuario} readOnly className={`${inp} cursor-not-allowed`} />
        </div>
      </div>

      <hr className="border-border" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={lbl}>Nome</label>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} className={inp} />
        </div>
        <div>
          <label className={lbl}>Telefone</label>
          <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} className={inp} />
        </div>
        <div>
          <label className={lbl}>Relação</label>
          <Select value={relacaoId} onValueChange={setRelacaoId} items={Object.fromEntries(relacoes.map((r) => [r.id, r.nome]))}>
            <SelectTrigger className="bg-card text-card-foreground h-9"><SelectValue placeholder="Selecione uma relação" /></SelectTrigger>
            <SelectContent>{relacoes.map((r) => <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <hr className="border-border" />

      <div className="flex justify-center pt-2">
        {batchMode ? (
          <Button type="button" variant="outline"
            className="px-14 py-3 text-base font-bold tracking-wide border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            onClick={addToBatch}>
            <Plus className="h-4 w-4 mr-2" /> ADICIONAR AO LOTE
          </Button>
        ) : (
          <Button className="px-14 py-3 text-base font-bold tracking-wide" onClick={handleCadastrar} disabled={submitting}>
            {submitting ? "ENVIANDO..." : "CADASTRAR"}
          </Button>
        )}
      </div>

      {batchMode && (
        <BatchQueue items={batch.queue} onRemove={batch.remove} onSubmit={submitBatch}
          submitting={batch.submitting} progress={batch.progress}
          singular="indicação" plural="indicações"
          renderItem={(item) => (
            <>
              <p className="font-medium text-card-foreground truncate">{item.nome}</p>
              <p className="text-xs text-muted-foreground truncate">{item.telefone} · Embaixador: {item.embaixadorNome}</p>
              {item.relacaoNome && <p className="text-xs text-muted-foreground">{item.relacaoNome}</p>}
            </>
          )}
        />
      )}
    </SimpleForm>
  );
}
