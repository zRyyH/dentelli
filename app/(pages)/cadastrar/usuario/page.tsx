"use client";

import { useEffect, useRef, useState } from "react";

function useMaskedInput(formatter: (v: string) => string) {
  const ref = useRef<HTMLInputElement>(null);
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const cursor = input.selectionStart ?? input.value.length;
    const digitsBeforeCursor = input.value.slice(0, cursor).replace(/\D/g, "").length;
    const formatted = formatter(input.value);
    requestAnimationFrame(() => {
      if (!ref.current) return;
      let count = 0;
      let pos = formatted.length;
      for (let i = 0; i < formatted.length; i++) {
        if (count >= digitsBeforeCursor) { pos = i; break; }
        if (/\d/.test(formatted[i])) count++;
      }
      ref.current.setSelectionRange(pos, pos);
    });
    return formatted;
  };
  return { ref, onChange };
}

import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SimpleForm } from "@/components/simple-form";
import { SearchSelect } from "@/components/search-select";
import { useEmbaixadores, useColetores, useTipoOptions, useSexoOptions } from "@/hooks/use-admin-data";
import { useUnidade } from "@/hooks/use-unidade";
import { useUser } from "@/hooks/use-user";
import { formatCpf, formatDate, formatTelefone, parseDateToISO, validateCpf, validateEmail, validateNascimento, validateTelefone } from "@/lib/formatters";
import { toast } from "sonner";
import { parsePbErrors } from "@/lib/pb-errors";

async function apiPost(path: string, body: object, method = "POST") {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    const err = new Error((json as any).error || "Erro na requisição") as any;
    err.pbData = (json as any).data;
    throw err;
  }
  return res.json();
}

type Modo = "cadastrar" | "editar";

const lbl = "block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5";
const inp = "bg-card text-card-foreground h-9";

export default function UsuarioPage() {
  const { unidades } = useUnidade();
  const loadingUnidades = unidades.length === 0;
  const { data: tipoOptions = [], isLoading: loadingTipo } = useTipoOptions();
  const { data: sexoOptions = [], isLoading: loadingSexo } = useSexoOptions();
  const { isDono: userIsDono, isLoading: loadingUser } = useUser();
  const [nivelLoaded, setNivelLoaded] = useState(false);

  const [modo, setModo] = useState<Modo>("cadastrar");
  const [unidadeId, setUnidadeId] = useState(""); // usado só no modo editar para filtrar usuários
  const [unidadeIds, setUnidadeIds] = useState<string[]>([]); // unidades vinculadas ao usuário
  const [usuarioId, setUsuarioId] = useState("");
  const [isAdministrador, setIsAdministrador] = useState(false);
  const [isColetor, setIsColetor] = useState(false);
  const [isEmbaixador, setIsEmbaixador] = useState(false);
  const hasAtLeastOneRole = isAdministrador || isColetor || isEmbaixador;
  const requireAllFields = isEmbaixador;

  const { data: embaixadores = [] } = useEmbaixadores(unidadeId || undefined);
  const { data: coletores = [] } = useColetores(unidadeId || undefined);

  const allUsuarios = (() => {
    const map = new Map<string, { id: string; nome: string; email?: string; cpf?: string; telefone?: string; prontuario?: string }>();
    embaixadores.forEach((u) => map.set(u.id, u));
    coletores.forEach((u) => map.set(u.id, u));
    return Array.from(map.values());
  })();

  const [nivelInicianteId, setNivelInicianteId] = useState("");
  const [nome, setNome] = useState("");
  const [prontuario, setProntuario] = useState("");
  const [tipo, setTipo] = useState("");
  const [sexo, setSexo] = useState("");
  const [telefone, setTelefone] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [cpf, setCpf] = useState("");
  const [observacao, setObservacao] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = (() => {
    if (!unidadeIds.length || !nome || !email || !telefone || !hasAtLeastOneRole) return false;
    if (!validateEmail(email) || !validateTelefone(telefone)) return false;
    if (modo === "cadastrar" && !senha) return false;
    if (modo === "editar" && !usuarioId) return false;
    if (requireAllFields) {
      if (!prontuario || !tipo || !sexo || !nascimento || !cpf) return false;
      if (!validateNascimento(nascimento) || !validateCpf(cpf)) return false;
    }
    return true;
  })();

  const telefoneInput = useMaskedInput(formatTelefone);
  const cpfInput = useMaskedInput(formatCpf);
  const nascimentoInput = useMaskedInput(formatDate);

  useEffect(() => {
    fetch("/api/admin/nivel-iniciante")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setNivelInicianteId(data.id || ""); })
      .catch(() => {})
      .finally(() => setNivelLoaded(true));
  }, []);

  const resetForm = () => {
    setNome(""); setProntuario(""); setTipo(""); setSexo("");
    setTelefone(""); setNascimento(""); setCpf(""); setObservacao("");
    setEmail(""); setSenha(""); setUsuarioId(""); setUnidadeIds([]);
    setIsAdministrador(false); setIsColetor(false); setIsEmbaixador(false);
  };

  useEffect(() => { resetForm(); setUnidadeId(""); }, [modo]);
  useEffect(() => { setUsuarioId(""); }, [unidadeId]);

  useEffect(() => {
    if (modo !== "editar" || !usuarioId) { if (modo === "editar") resetForm(); return; }
    fetch(`/api/admin/usuario/${usuarioId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return;
        setNome(data.nome || ""); setProntuario(data.prontuario || ""); setTipo(data.tipo || "");
        setSexo(data.sexo || "");
        setTelefone(data.telefone ? formatTelefone(data.telefone) : ""); setCpf(data.cpf ? formatCpf(data.cpf) : "");
        setObservacao(data.observacao || ""); setEmail(data.email || ""); setSenha("");
        setIsAdministrador(!!data.administrador); setIsColetor(!!data.coletor); setIsEmbaixador(!!data.embaixador);
        const uIds = Array.isArray(data.unidade) ? data.unidade : data.unidade ? [data.unidade] : [];
        setUnidadeIds(uIds);
        if (data.nascimento) {
          const d = new Date(data.nascimento);
          setNascimento(`${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`);
        } else { setNascimento(""); }
      })
      .catch((e: any) => toast.error(e.message || "Erro ao carregar dados"));
  }, [usuarioId, modo]);

  const handleSubmit = async () => {
    if (!unidadeIds.length) { toast.error("Selecione ao menos uma unidade"); return; }
    if (!nome) { toast.error("Informe o nome"); return; }
    if (!email) { toast.error("Informe o email"); return; }
    if (!telefone) { toast.error("Informe o telefone"); return; }
    if (!senha && modo === "cadastrar") { toast.error("Informe a senha"); return; }
    if (modo === "editar" && !usuarioId) { toast.error("Selecione um usuário"); return; }
    if (!hasAtLeastOneRole) { toast.error("Pelo menos uma função deve estar ativa"); return; }
    if (requireAllFields) {
      if (!prontuario) { toast.error("Informe o prontuário"); return; }
      if (!tipo) { toast.error("Informe o tipo"); return; }
      if (!sexo) { toast.error("Informe o sexo"); return; }
      if (!nascimento) { toast.error("Informe a data de nascimento"); return; }
      if (!cpf) { toast.error("Informe o CPF"); return; }
    }

    setSubmitting(true);
    try {
      const telefoneDigits = telefone.replace(/\D/g, "");
      const baseFields = {
        unidadeIds, nome, email, telefone: telefoneDigits,
        isAdministrador, isColetor, isEmbaixador,
      };
      const extraFields = requireAllFields ? {
        prontuario, tipo, sexo, cpf: cpf.replace(/\D/g, ""), observacao,
        nascimento: nascimento ? parseDateToISO(nascimento) : undefined,
      } : {};
      if (modo === "cadastrar") {
        await apiPost("/api/admin/usuario", {
          ...baseFields, ...extraFields, senha, nivelInicianteId,
        });
        toast.success("Usuário cadastrado com sucesso!");
        resetForm();
      } else {
        await apiPost(`/api/admin/usuario/${usuarioId}`, {
          ...baseFields, ...extraFields, senha,
        }, "PATCH");
        toast.success("Usuário atualizado com sucesso!");
      }
    } catch (err: any) {
      const fieldErrors = parsePbErrors(err.pbData);
      if (fieldErrors.length > 0) {
        fieldErrors.forEach((msg) => toast.error(msg));
      } else {
        toast.error(err.message || "Erro ao processar");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = loadingUnidades || loadingTipo || loadingSexo || !nivelLoaded || loadingUser;

  if (isLoading) {
    return (
      <SimpleForm title="USUÁRIO">
        <div className="flex items-center justify-center py-24">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </SimpleForm>
    );
  }

  return (
    <SimpleForm title="USUÁRIO">
      <div>
        <label className={lbl}>Ação</label>
        <Tabs value={modo} onValueChange={(v) => setModo(v as Modo)}>
          <TabsList className="w-full">
            <TabsTrigger value="cadastrar" className="flex-1">CADASTRAR</TabsTrigger>
            <TabsTrigger value="editar" className="flex-1">EDITAR</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <hr className="border-border" />

      {modo === "editar" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Filtrar usuários por unidade</label>
            <SearchSelect
              value={unidadeId}
              onChange={setUnidadeId}
              options={unidades.map((u) => ({ id: u.id, label: u.nome }))}
              placeholder="Selecione uma unidade"
              loading={loadingUnidades}
            />
          </div>
          <div>
            <label className={lbl}>Usuário</label>
            <SearchSelect
              value={usuarioId}
              onChange={setUsuarioId}
              options={allUsuarios.map((u) => ({
                id: u.id,
                label: u.nome,
                searchText: [u.email, u.cpf, u.telefone, (u as any).prontuario].filter(Boolean).join(" "),
              }))}
              placeholder="Selecione um usuário"
              disabled={!unidadeId}
            />
          </div>
        </div>
      )}

      <hr className="border-border" />

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <div>
            <label className={lbl}>Funções <span className="text-destructive">*</span></label>
            <div className="flex flex-wrap gap-6 mt-1">
              {[
                { id: "sw-admin", checked: isAdministrador, onChange: setIsAdministrador, label: "Administrador", donoOnly: true },
                { id: "sw-coletor", checked: isColetor, onChange: setIsColetor, label: "Coletor", donoOnly: false },
                { id: "sw-embaixador", checked: isEmbaixador, onChange: setIsEmbaixador, label: "Embaixador", donoOnly: false },
              ].filter((f) => !f.donoOnly || userIsDono).map(({ id, checked, onChange, label: lbTxt }) => (
                <div key={id} className="flex items-center gap-2">
                  <Switch id={id} checked={checked} onCheckedChange={onChange} />
                  <Label htmlFor={id} className="text-sm cursor-pointer">{lbTxt}</Label>
                </div>
              ))}
            </div>
            <p className={`text-xs text-destructive mt-1.5 ${hasAtLeastOneRole ? "invisible" : ""}`}>Pelo menos uma função deve estar ativa.</p>
          </div>
          <div>
            <label className={lbl}>Unidades <span className="text-destructive">*</span></label>
            <SearchSelect
              multi
              values={unidadeIds}
              onChangeMulti={setUnidadeIds}
              options={unidades.map((u) => ({ id: u.id, label: u.nome }))}
              placeholder="Selecione as unidades"
              loading={loadingUnidades}
            />
            {!unidadeIds.length && !loadingUnidades && (
              <p className="text-xs text-destructive mt-1.5">Selecione ao menos uma unidade.</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={lbl}>Nome <span className="text-destructive">*</span></label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" className={inp} />
          </div>
          <div>
            <label className={lbl}>Telefone <span className="text-destructive">*</span></label>
            <Input ref={telefoneInput.ref} value={telefone}
              onChange={(e) => setTelefone(telefoneInput.onChange(e))}
              placeholder="(XX) XXXXX-XXXX" className={inp} />
            {telefone && !validateTelefone(telefone) && <p className="text-xs text-destructive mt-1">Telefone inválido</p>}
          </div>
          <div>
            <label className={lbl}>Email <span className="text-destructive">*</span></label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" className={inp} />
            {email && !validateEmail(email) && <p className="text-xs text-destructive mt-1">Email inválido</p>}
          </div>
        </div>

        {requireAllFields && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className={lbl}>Prontuário <span className="text-destructive">*</span></label>
                <Input value={prontuario} onChange={(e) => setProntuario(e.target.value)} className={inp} />
              </div>
              <div>
                <label className={lbl}>Tipo <span className="text-destructive">*</span></label>
                <SearchSelect
                  value={tipo}
                  onChange={setTipo}
                  options={tipoOptions.map((opt) => ({ id: opt, label: opt }))}
                  placeholder="Selecione"
                  loading={loadingTipo}
                />
              </div>
              <div>
                <label className={lbl}>Sexo <span className="text-destructive">*</span></label>
                <SearchSelect
                  value={sexo}
                  onChange={setSexo}
                  options={sexoOptions.map((opt) => ({ id: opt, label: opt }))}
                  placeholder="Selecione"
                  loading={loadingSexo}
                />
              </div>
              <div>
                <label className={lbl}>Data de nascimento <span className="text-destructive">*</span></label>
                <Input ref={nascimentoInput.ref} value={nascimento}
                  onChange={(e) => setNascimento(nascimentoInput.onChange(e))}
                  placeholder="DD/MM/AAAA" className={inp} />
                {nascimento && !validateNascimento(nascimento) && <p className="text-xs text-destructive mt-1">Data inválida</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>CPF <span className="text-destructive">*</span></label>
                <Input ref={cpfInput.ref} value={cpf}
                  onChange={(e) => setCpf(cpfInput.onChange(e))}
                  placeholder="XXX.XXX.XXX-XX" className={inp} />
                {cpf && !validateCpf(cpf) && <p className="text-xs text-destructive mt-1">CPF inválido</p>}
              </div>
              <div>
                <label className={lbl}>Observação</label>
                <Textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} className="bg-card text-card-foreground min-h-[36px]" />
              </div>
            </div>
          </>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <Button className="px-14 py-3 text-base font-bold tracking-wide" onClick={handleSubmit}
          disabled={submitting || !canSubmit}>
          {submitting ? "ENVIANDO..." : modo === "cadastrar" ? "CADASTRAR" : "SALVAR"}
        </Button>
      </div>
    </SimpleForm>
  );
}
