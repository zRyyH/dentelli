"use client";

import { useState, useEffect } from "react";
import { Phone, Mail, MessageCircle, ChevronDown, ArrowRight, MapPin, Clock, Bell, FileText, RotateCcw, Eye } from "lucide-react";
import { SiteHeader } from "@/components/header";
import { SiteFooter } from "@/components/footer";
import { FloatingButtons } from "@/components/floating-buttons";
import { PageTransition } from "@/components/page-transition";

type SupportSection = "atendimento" | "sobre" | "entregas" | "perguntas";

interface TemaData {
  email: string;
  telefone: string;
  whatsapp: string;
  informacao: {
    sobre?: { nome: string; descricao: string; fluxo: string[] };
    entregas?: Record<string, string>;
    perguntas_frequentes?: { pergunta: string; resposta: string }[];
  } | null;
}

const SIDEBAR_ITEMS: { key: SupportSection; label: string }[] = [
  { key: "atendimento", label: "Atendimento" },
  { key: "sobre", label: "Sobre o Programa" },
  { key: "entregas", label: "Entregas e Prazos" },
  { key: "perguntas", label: "Perguntas Frequentes" },
];

const ENTREGA_ICONS: Record<string, React.ElementType> = {
  prazo_disponibilidade: Clock, local: MapPin, notificacao: Bell,
  documento: FileText, prazo_retirada: Clock, nao_retirada: RotateCcw, acompanhamento: Eye,
};

const ENTREGA_LABELS: Record<string, string> = {
  prazo_disponibilidade: "Prazo de disponibilidade", local: "Local de retirada",
  notificacao: "Notificação", documento: "Documento necessário",
  prazo_retirada: "Prazo para retirada", nao_retirada: "Se não retirar", acompanhamento: "Acompanhe pelo",
};

const formatPhone = (raw: string) => {
  const d = raw.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return raw;
};

const SkeletonLines = () => (
  <div className="space-y-4 pt-2">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-4 animate-pulse rounded bg-muted/40" style={{ width: `${55 + (i % 3) * 15}%` }} />
    ))}
  </div>
);

const SectionHeader = ({ label, title }: { label: string; title: string }) => (
  <div className="mb-8">
    <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
    <h2 className="text-2xl font-light text-foreground">{title}</h2>
    <div className="mt-6 h-px bg-border/60" />
  </div>
);

export default function SupportPage() {
  const [activeSection, setActiveSection] = useState<SupportSection>("atendimento");
  const [temaData, setTemaData] = useState<TemaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/tema")
      .then((r) => r.ok ? r.json() : null)
      .then((record) => {
        if (!record) return;
        let informacao = null;
        try { informacao = typeof record.informacao === "string" ? JSON.parse(record.informacao) : record.informacao ?? null; } catch {}
        setTemaData({ email: record.email ?? "", telefone: record.telefone ?? "", whatsapp: record.whatsapp ?? "", informacao });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const contatos = loading ? [] : [
    temaData?.whatsapp ? { tipo: "whatsapp", titulo: "WhatsApp", detalhe: formatPhone(temaData.whatsapp), Icon: MessageCircle, href: `https://wa.me/${temaData.whatsapp.replace(/\D/g, "")}` } : null,
    temaData?.telefone ? { tipo: "telefone", titulo: "Telefone", detalhe: formatPhone(temaData.telefone), Icon: Phone, href: `tel:${temaData.telefone.replace(/\D/g, "")}` } : null,
    temaData?.email ? { tipo: "email", titulo: "E-mail", detalhe: temaData.email, Icon: Mail, href: `mailto:${temaData.email}` } : null,
  ].filter(Boolean) as { tipo: string; titulo: string; detalhe: string; Icon: React.ElementType; href: string }[];

  const sobre = temaData?.informacao?.sobre;
  const entregas = temaData?.informacao?.entregas;
  const faqs = temaData?.informacao?.perguntas_frequentes ?? [];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader activeNav="SUPORTE" />

      <PageTransition>
      <div className="border-b border-border/60 py-8">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Central</p>
          <h1 className="mt-1 text-3xl font-light tracking-wide">Suporte</h1>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl gap-16 px-4 md:px-6 py-8 md:py-12">
        {/* Sidebar — desktop only */}
        <aside className="w-48 shrink-0 hidden md:block">
          <nav className="sticky top-24 space-y-0.5">
            {SIDEBAR_ITEMS.map((item) => (
              <button key={item.key} onClick={() => setActiveSection(item.key)}
                className={`w-full text-left py-2.5 pl-3 text-sm transition-colors ${
                  activeSection === item.key
                    ? "border-l-2 border-primary font-semibold text-primary"
                    : "border-l-2 border-transparent text-muted-foreground hover:text-foreground"
                }`}>
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 py-2 min-w-0 w-full">
          {/* Mobile tabs — inside main so they don't break the flex row */}
          <div className="md:hidden mb-6">
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {SIDEBAR_ITEMS.map((item) => (
                <button key={item.key} onClick={() => setActiveSection(item.key)}
                  className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                    activeSection === item.key ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"
                  }`}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          {activeSection === "atendimento" && (
            <div>
              <SectionHeader label="Atendimento" title="Fale com a gente" />
              {loading ? <SkeletonLines /> : (
                <>
                  <p className="mb-10 max-w-md text-sm leading-relaxed text-muted-foreground">
                    Dúvidas, reclamações, sugestões ou elogios — estamos disponíveis pelos canais abaixo.
                  </p>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    {contatos.map(({ tipo, titulo, detalhe, Icon, href }) => (
                      <a key={tipo} href={href} target="_blank" rel="noreferrer"
                        className="group flex flex-col gap-4 rounded-2xl border border-border/60 p-6 transition-all hover:border-primary/30 hover:shadow-sm">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/[0.08]">
                          <Icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{titulo}</p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{detalhe}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeSection === "sobre" && (
            <div>
              <SectionHeader label="Sobre" title={sobre?.nome ?? "Dentelli Club"} />
              {loading ? <SkeletonLines /> : sobre ? (
                <div className="space-y-10">
                  <p className="max-w-prose text-sm leading-7 text-muted-foreground">{sobre.descricao}</p>
                  {sobre.fluxo?.length > 0 && (
                    <div>
                      <p className="mb-5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Como funciona</p>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-0">
                        {sobre.fluxo.map((etapa, i) => (
                          <div key={i} className="flex items-center gap-3 sm:gap-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">{i + 1}</div>
                              <span className="text-sm font-medium">{etapa}</span>
                            </div>
                            {i < sobre.fluxo.length - 1 && (
                              <ArrowRight className="hidden h-4 w-4 shrink-0 text-muted-foreground/40 sm:block mx-4" strokeWidth={1.5} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {activeSection === "entregas" && (
            <div>
              <SectionHeader label="Logística" title="Entregas e Prazos" />
              {loading ? <SkeletonLines /> : entregas ? (
                <div className="divide-y divide-border/50">
                  {Object.entries(entregas).map(([key, value]) => {
                    const Icon = ENTREGA_ICONS[key] ?? Clock;
                    return (
                      <div key={key} className="flex items-start gap-4 py-5">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/60">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{ENTREGA_LABELS[key] ?? key}</p>
                          <p className="mt-1 text-sm leading-relaxed">{value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          )}

          {activeSection === "perguntas" && (
            <div>
              <SectionHeader label="FAQ" title="Perguntas Frequentes" />
              {loading ? <SkeletonLines /> : (
                <div className="divide-y divide-border/50">
                  {faqs.map((item, i) => {
                    const isOpen = openFaq === i;
                    return (
                      <div key={i}>
                        <button onClick={() => setOpenFaq(isOpen ? null : i)}
                          className="flex w-full items-start justify-between gap-4 py-5 text-left">
                          <span className="text-sm font-medium leading-snug">{item.pergunta}</span>
                          <ChevronDown className={`mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} strokeWidth={1.5} />
                        </button>
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-96 pb-5" : "max-h-0"}`}>
                          <p className="text-sm leading-7 text-muted-foreground">{item.resposta}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      </PageTransition>

      <SiteFooter />
      <FloatingButtons />
    </div>
  );
}
