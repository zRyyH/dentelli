"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { AccountLayout } from "@/components/account-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { setUserData } from "@/lib/pb";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export default function PerfilPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: userData } = useQuery({
    queryKey: ["usuario-perfil"],
    queryFn: async () => {
      const res = await fetch("/api/perfil");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUserData(data);
      return data;
    },
  });

  useEffect(() => {
    if (userData) {
      setNome(userData.nome || "");
      setEmail(userData.email || "");
    }
  }, [userData]);

  const handleSave = async () => {
    if (!userId) return;
    const body: Record<string, string> = {};
    if (nome !== userData?.nome) body.nome = nome;
    if (email !== userData?.email) body.email = email;

    if (newPassword) {
      if (newPassword !== confirmPassword) { toast.error("As senhas não coincidem"); return; }
      if (!oldPassword) { toast.error("Informe a senha atual"); return; }
      body.oldPassword = oldPassword;
      body.password = newPassword;
      body.passwordConfirm = confirmPassword;
    }

    if (Object.keys(body).length === 0) { toast.info("Nenhuma alteração detectada"); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any)?.error || "Erro ao salvar");
      }
      toast.success("Alterações salvas.");
      setOldPassword(""); setNewPassword(""); setConfirmPassword("");
      const updated = await res.json();
      if (updated) setUserData(updated);
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar alterações");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AccountLayout>
      <div className="max-w-sm space-y-10">
        <div className="space-y-6">
          <div>
            <label className="block text-xs text-muted-foreground mb-2">Nome</label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)}
              className="border-0 border-b rounded-none bg-transparent px-0 h-8 text-sm focus-visible:ring-0 focus-visible:border-foreground shadow-none" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-2">E-mail</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="border-0 border-b rounded-none bg-transparent px-0 h-8 text-sm focus-visible:ring-0 focus-visible:border-foreground shadow-none" />
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-6">Alterar senha</p>
          <div className="space-y-6">
            {[
              { label: "Senha atual", value: oldPassword, onChange: setOldPassword, show: showOld, onToggle: () => setShowOld(!showOld) },
              { label: "Nova senha", value: newPassword, onChange: setNewPassword, show: showNew, onToggle: () => setShowNew(!showNew) },
              { label: "Confirmar nova senha", value: confirmPassword, onChange: setConfirmPassword, show: showConfirm, onToggle: () => setShowConfirm(!showConfirm) },
            ].map(({ label, value, onChange, show, onToggle }) => (
              <div key={label}>
                <label className="block text-xs text-muted-foreground mb-2">{label}</label>
                <div className="relative">
                  <Input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)}
                    className="border-0 border-b rounded-none bg-transparent px-0 h-8 text-sm focus-visible:ring-0 shadow-none pr-7" />
                  <button type="button" onClick={onToggle}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground">
                    {show ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="rounded-full px-8 text-sm">
          {saving ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </AccountLayout>
  );
}
