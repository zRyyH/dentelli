"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SimpleForm } from "@/components/simple-form";
import { BatchQueue } from "@/components/batch-queue";
import { BatchToggle } from "@/components/batch-toggle";
import { useUnidades, useEmbaixadores, useColetores, useTipoOptions } from "@/hooks/use-admin-data";
import { useBatch } from "@/hooks/use-batch";
import { formatCpf, formatDate, parseDateToISO } from "@/lib/formatters";

async function apiPost(path: string, body: object, method = "POST") {
  const res = await fetch(path, {
    method,
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

interface BatchUsuario {
  _id: string;
  unidadeId: string;
  unidadeNome: string;
  nome: string;
  email: string;
  prontuario: string;
  tipo: string;
  sexo: string;
  telefone: string;
  nascimento: string;
  cpf: string;
  observacao: string;
  senha: string;
  isAdministrador: boolean;
  isColetor: boolean;
  isEmbaixador: boolean;
  status?: "pending" | "success" | "error";
}

type Modo = "cadastrar" | "editar";

const lbl = "block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5";
const inp = "bg-card text-card-foreground h-9";

export default function UsuarioPage() {
  const { data: unidades = [] } = useUnidades();
  const { data: tipoOptions = [] } = useTipoOptions();

  const [modo, setModo] = useState<Modo>("cadastrar");
  const [unidadeId, setUnidadeId] = useState("");
  const [usuarioId, setUsuarioId] = useState("");
  const [isAdministrador, setIsAdministrador] = useState(false);
  const [isColetor, setIsColetor] = useState(false);
  const [isEmbaixador, setIsEmbaixador] = useState(false);
  const hasAtLeastOneRole = isAdministrador || isColetor || isEmbaixador;

  const { data: embaixadores = [] } = useEmbaixadores(unidadeId || undefined);
  const { data: coletores = [] } = useColetores(unidadeId || undefined);

  const allUsuarios = (() => {
    const map = new Map<string, { id: string; nome: string }>();
    embaixadores.forEach((u) => map.set(u.id, u));
    coletores.forEach((u) => map.set(u.id, u));
    return Array.from(map.values());
  })();

  const [nivelInicianteId, setNivelInicianteId] = useState("");
  const [nome, setNome] = useState("");
  const [prontuario, setProntuario] = useState("");
  const [tipo, setTipo] = useState("PACIENTE");
  const [sexo, setSexo] = useState("");
  const [telefone, setTelefone] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [cpf, setCpf] = useState("");
  const [observacao, setObservacao] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [batchMode, setBatchMode] = useState(false);

  const batch = useBatch<BatchUsuario>();

  useEffect(() => {
    fetch("/api/admin/nivel-iniciante")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setNivelInicianteId(data.id || ""); })
      .catch(() => {});
  }, []);

  const resetForm = () => {
    setNome(""); setProntuario(""); setTipo("PACIENTE"); setSexo("");
    setTelefone(""); setNascimento(""); setCpf(""); setObservacao("");
    setEmail(""); setSenha(""); setUsuarioId("");
    setIsAdministrador(false); setIsColetor(false); setIsEmbaixador(false);
  };

  useEffect(() => { resetForm(); setUnidadeId(""); setBatchMode(false); batch.clear(); }, [modo]);
  useEffect(() => { setUsuarioId(""); }, [unidadeId]);

  useEffect(() => {
    if (modo !== "editar" || !usuarioId) { if (modo === "editar") resetForm(); return; }
    fetch(`/api/admin/usuario/${usuarioId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return;
        setNome(data.nome || ""); setProntuario(data.prontuario || ""); setTipo(data.tipo || "");
        setSexo(data.sexo === "M" ? "M" : data.sexo === "F" ? "F" : "");
        setTelefone(data.telefone || ""); setCpf(data.cpf ? formatCpf(data.cpf) : "");
        setObservacao(data.observacao || ""); setEmail(data.email || ""); setSenha("");
        setIsAdministrador(!!data.administrador); setIsColetor(!!data.coletor); setIsEmbaixador(!!data.embaixador);
        if (data.nascimento) {
          const d = new Date(data.nascimento);
          setNascimento(`${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`);
        } else { setNascimento(""); }
      })
      .catch((e: any) => toast.error(e.message || "Erro ao carregar dados"));
  }, [usuarioId, modo]);


  const handleSubmit = async () => {
    if (!unidadeId) { toast.error("Selecione uma unidade"); return; }
    if (!nome) { toast.error("Informe o nome"); return; }
    if (!email || (!senha && modo === "cadastrar")) { toast.error("Informe email e senha"); return; }
    if (modo === "editar" && !usuarioId) { toast.error("Selecione um usuário"); return; }
    if (!hasAtLeastOneRole) { toast.error("Pelo menos uma função deve estar ativa"); return; }

    setSubmitting(true);
    try {
      const unidade = unidades.find((u) => u.id === unidadeId) ?? { id: unidadeId };
      if (modo === "cadastrar") {
        await apiPost("/api/admin/usuario", {
          unidadeId, nome, email, senha, prontuario, tipo, sexo,
          telefone, nascimento: nascimento ? parseDateToISO(nascimento) : undefined,
          cpf, observacao, isAdministrador, isColetor, isEmbaixador,
          nivelInicianteId, unidade,
        });
        toast.success("Usuário cadastrado com sucesso!");
        resetForm();
      } else {
        await apiPost(`/api/admin/usuario/${usuarioId}`, {
          unidadeId, nome, prontuario, tipo, sexo, telefone,
          nascimento: nascimento ? parseDateToISO(nascimento) : undefined,
          cpf, observacao, email, senha,
          isAdministrador, isColetor, isEmbaixador, unidade,
        }, "PATCH");
        toast.success("Usuário atualizado com sucesso!");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar");
    } finally {
      setSubmitting(false);
    }
  };

  const addToBatch = () => {
    if (!unidadeId || !nome || !email || !senha || !hasAtLeastOneRole) { toast.error("Preencha todos os campos obrigatórios"); return; }
    batch.add({
      unidadeId, unidadeNome: unidades.find((u) => u.id === unidadeId)?.nome || "",
      nome, email, prontuario, tipo, sexo, telefone, nascimento, cpf, observacao, senha,
      isAdministrador, isColetor, isEmbaixador,
    });
    resetForm(); setUnidadeId("");
    toast.success("Usuário adicionado ao lote");
  };

  const submitBatch = async () => {
    const result = await batch.run(async (item) => {
      try {
        await apiPost("/api/admin/usuario", {
          unidadeId: item.unidadeId, nome: item.nome, email: item.email, senha: item.senha,
          prontuario: item.prontuario, tipo: item.tipo, sexo: item.sexo, telefone: item.telefone,
          nascimento: item.nascimento ? parseDateToISO(item.nascimento) : undefined,
          cpf: item.cpf, observacao: item.observacao,
          isAdministrador: item.isAdministrador, isColetor: item.isColetor, isEmbaixador: item.isEmbaixador,
          nivelInicianteId,
          unidade: { id: item.unidadeId, nome: item.unidadeNome },
        });
        return true;
      } catch {
        return false;
      }
    });
    if (!result) return;
    if (result.errors === 0) {
      toast.success(`${result.total} usuário(s) cadastrado(s) com sucesso!`);
      batch.clear();
    } else {
      toast.error(`${result.errors} de ${result.total} item(s) falharam.`);
      batch.clearSuccesses();
    }
  };

  return (
    <SimpleForm title="USUÁRIO">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div className="flex-1">
          <label className={lbl}>Ação</label>
          <Tabs value={modo} onValueChange={(v) => setModo(v as Modo)}>
            <TabsList className="w-full">
              <TabsTrigger value="cadastrar" className="flex-1">CADASTRAR</TabsTrigger>
              <TabsTrigger value="editar" className="flex-1">EDITAR</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        {modo === "cadastrar" && (
          <div className="pb-0.5">
            <BatchToggle id="sw-batch" checked={batchMode}
              onCheckedChange={(v) => { setBatchMode(v); if (!v) batch.clear(); }} />
          </div>
        )}
      </div>

      <hr className="border-border" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={lbl}>Unidade <span className="text-destructive">*</span></label>
          <Select value={unidadeId} onValueChange={setUnidadeId} items={Object.fromEntries(unidades.map((u) => [u.id, u.nome]))}>
            <SelectTrigger className="bg-card text-card-foreground h-9"><SelectValue placeholder="Selecione uma unidade" /></SelectTrigger>
            <SelectContent>{unidades.map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {modo === "editar" && (
          <div>
            <label className={lbl}>Usuário</label>
            <Select value={usuarioId} onValueChange={setUsuarioId} disabled={!unidadeId} items={Object.fromEntries(allUsuarios.map((u) => [u.id, u.nome]))}>
              <SelectTrigger className="bg-card text-card-foreground h-9"><SelectValue placeholder="Selecione um usuário" /></SelectTrigger>
              <SelectContent>{allUsuarios.map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}
      </div>

      <hr className="border-border" />

      <div className="space-y-4">
        <div>
          <label className={lbl}>Funções <span className="text-destructive">*</span></label>
          <div className="flex flex-wrap gap-6 mt-1">
            {[
              { id: "sw-admin", checked: isAdministrador, onChange: setIsAdministrador, label: "Administrador" },
              { id: "sw-coletor", checked: isColetor, onChange: setIsColetor, label: "Coletor" },
              { id: "sw-embaixador", checked: isEmbaixador, onChange: setIsEmbaixador, label: "Embaixador" },
            ].map(({ id, checked, onChange, label: lbTxt }) => (
              <div key={id} className="flex items-center gap-2">
                <Switch id={id} checked={checked} onCheckedChange={onChange} />
                <Label htmlFor={id} className="text-sm cursor-pointer">{lbTxt}</Label>
              </div>
            ))}
          </div>
          {!hasAtLeastOneRole && <p className="text-xs text-destructive mt-1.5">Pelo menos uma função deve estar ativa.</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className={lbl}>Nome <span className="text-destructive">*</span></label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" className={inp} />
          </div>
          <div>
            <label className={lbl}>Prontuário</label>
            <Input value={prontuario} onChange={(e) => setProntuario(e.target.value)} className={inp} />
          </div>
          <div>
            <label className={lbl}>Tipo</label>
            <Select value={tipo} onValueChange={setTipo} items={Object.fromEntries([...new Set(["PACIENTE", ...tipoOptions])].map((opt) => [opt, opt]))}>
              <SelectTrigger className="bg-card text-card-foreground h-9"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {[...new Set(["PACIENTE", ...tipoOptions])].map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className={lbl}>Sexo</label>
            <Select value={sexo} onValueChange={setSexo} items={{ M: "Homem", F: "Mulher" }}>
              <SelectTrigger className="bg-card text-card-foreground h-9"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Homem</SelectItem>
                <SelectItem value="F">Mulher</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className={lbl}>Telefone</label>
            <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(XX) XXXXX-XXXX" className={inp} />
          </div>
          <div>
            <label className={lbl}>Data de nascimento</label>
            <Input value={nascimento} onChange={(e) => setNascimento(formatDate(e.target.value))} placeholder="DD/MM/AAAA" className={inp} />
          </div>
          <div>
            <label className={lbl}>CPF</label>
            <Input value={cpf} onChange={(e) => setCpf(formatCpf(e.target.value))} placeholder="XXX.XXX.XXX-XX" className={inp} />
          </div>
          <div>
            <label className={lbl}>Observação</label>
            <Textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} className="bg-card text-card-foreground min-h-[36px]" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Email <span className="text-destructive">*</span></label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" className={inp} />
          </div>
          <div>
            <label className={lbl}>Senha {modo === "cadastrar" && <span className="text-destructive">*</span>}</label>
            <div className="relative">
              <Input type={showSenha ? "text" : "password"} value={senha} onChange={(e) => setSenha(e.target.value)}
                placeholder={modo === "editar" ? "Deixe vazio para manter atual" : "••••••••"} className={`${inp} pr-9`} />
              <button type="button" onClick={() => setShowSenha((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-card-foreground">
                {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <hr className="border-border" />

      <div className="flex justify-center pt-2">
        {batchMode ? (
          <Button type="button" variant="outline"
            className="px-14 py-3 text-base font-bold tracking-wide border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            onClick={addToBatch} disabled={!hasAtLeastOneRole}>
            <Plus className="h-4 w-4 mr-2" /> ADICIONAR AO LOTE
          </Button>
        ) : (
          <Button className="px-14 py-3 text-base font-bold tracking-wide" onClick={handleSubmit}
            disabled={submitting || !hasAtLeastOneRole}>
            {submitting ? "ENVIANDO..." : modo === "cadastrar" ? "CADASTRAR" : "SALVAR"}
          </Button>
        )}
      </div>

      {batchMode && (
        <BatchQueue items={batch.queue} onRemove={batch.remove} onSubmit={submitBatch}
          submitting={batch.submitting} progress={batch.progress}
          singular="usuário" plural="usuários"
          renderItem={(item) => (
            <>
              <p className="font-medium text-card-foreground truncate">{item.nome}</p>
              <p className="text-xs text-muted-foreground truncate">{item.email} · {item.unidadeNome}</p>
              <p className="text-xs text-muted-foreground">
                {[item.isAdministrador && "Admin", item.isColetor && "Coletor", item.isEmbaixador && "Embaixador"].filter(Boolean).join(", ")}
              </p>
            </>
          )}
        />
      )}
    </SimpleForm>
  );
}
