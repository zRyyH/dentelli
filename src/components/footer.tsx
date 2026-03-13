"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, Phone, Mail, Instagram, Youtube, Facebook, Music } from "lucide-react";
import { fetchWithAuth, PB_BASE_URL } from "@/lib/pb";

interface TemaFooter {
  whatsapp: string;
  email: string;
  instagram: string;
  youtube: string;
  tiktok: string;
  facebook: string;
}

const formatPhone = (raw: string) => {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return raw;
};

export function SiteFooter() {
  const [tema, setTema] = useState<TemaFooter | null>(null);

  useEffect(() => {
    fetchWithAuth(`${PB_BASE_URL}/api/collections/tema/records?perPage=1`)
      .then((r) => r.json())
      .then((data) => {
        const record = data.items?.[0];
        if (!record) return;
        setTema({
          whatsapp:  record.whatsapp  ?? "",
          email:     record.email     ?? "",
          instagram: record.instagram ?? "",
          youtube:   record.youtube   ?? "",
          tiktok:    record.tiktok    ?? "",
          facebook:  record.facebook  ?? "",
        });
      })
      .catch(() => {});
  }, []);

  const socials = [
    { icon: Instagram, label: "Instagram", href: tema?.instagram },
    { icon: Youtube,   label: "Youtube",   href: tema?.youtube   },
    { icon: Music,     label: "TikTok",    href: tema?.tiktok    },
    { icon: Facebook,  label: "Facebook",  href: tema?.facebook  },
  ].filter((s) => s.href);

  return (
    <footer
      className="relative overflow-hidden"
      style={{
        background: "linear-gradient(to bottom, var(--color-primary) 0%, color-mix(in srgb, var(--color-primary) 30%, black) 100%)",
      }}
    >
      <div className="mx-auto max-w-6xl px-6 pt-16 pb-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-16 text-center justify-items-center">

          {/* Atendimento */}
          <div className="flex flex-col items-center px-8">
            <span className="mb-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-primary-foreground/40">Suporte</span>
            <h4 className="mb-5 text-base font-bold text-primary-foreground">Atendimento ao Cliente</h4>
            <div className="space-y-3 text-sm text-primary-foreground/60">
              <p className="flex items-center gap-2 justify-center">
                <Clock className="h-3.5 w-3.5 shrink-0 text-primary-foreground/40" />
                Segunda a sexta: 8:00 às 18:00h
              </p>
              <p className="flex items-center gap-2 justify-center">
                <Phone className="h-3.5 w-3.5 shrink-0 text-primary-foreground/40" />
                {tema?.whatsapp ? (
                  <a
                    href={`https://wa.me/${tema.whatsapp.replace(/\D/g, "")}`}
                    target="_blank" rel="noreferrer"
                    className="hover:text-primary-foreground transition-colors"
                  >
                    WhatsApp: {formatPhone(tema.whatsapp)}
                  </a>
                ) : "WhatsApp"}
              </p>
              <p className="flex items-center gap-2 justify-center">
                <Mail className="h-3.5 w-3.5 shrink-0 text-primary-foreground/40" />
                {tema?.email ? (
                  <a href={`mailto:${tema.email}`} className="hover:text-primary-foreground transition-colors">
                    {tema.email}
                  </a>
                ) : "E-mail"}
              </p>
            </div>
          </div>

          {/* Menu */}
          <div className="flex flex-col items-center px-8">
            <span className="mb-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-primary-foreground/40">Navegação</span>
            <h4 className="mb-5 text-base font-bold text-primary-foreground">Menu</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/60">
              <li><Link href="/rewards" className="hover:text-primary-foreground transition-colors">Recompensas</Link></li>
              <li><Link href="/support" className="hover:text-primary-foreground transition-colors">Contato</Link></li>
              <li><Link href="/my_account/pedidos" className="hover:text-primary-foreground transition-colors">Meus Pedidos</Link></li>
              <li><Link href="/my_account/perfil" className="hover:text-primary-foreground transition-colors">Editar Cadastro</Link></li>
            </ul>
          </div>

          {/* Políticas + Redes */}
          <div className="flex flex-col items-center px-8">
            <span className="mb-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-primary-foreground/40">Legal</span>
            <h4 className="mb-5 text-base font-bold text-primary-foreground">Nossas Políticas</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/60">
              <li><Link href="/regulation" className="hover:text-primary-foreground transition-colors">Regulamento do Programa</Link></li>
              <li><Link href="/regulation" className="hover:text-primary-foreground transition-colors">Entrega, Devolução e Reembolso</Link></li>
              <li><Link href="/regulation" className="hover:text-primary-foreground transition-colors">Políticas de Privacidade</Link></li>
            </ul>

            {socials.length > 0 && (
              <div className="mt-6">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-primary-foreground/40">Siga-nos</p>
                <div className="flex gap-2 justify-center">
                  {socials.map(({ icon: Icon, label, href }) => (
                    <a
                      key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}
                      className="flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 hover:scale-110 hover:brightness-125"
                      style={{
                        background: "color-mix(in srgb, var(--color-primary-foreground) 12%, transparent)",
                        border: "1px solid color-mix(in srgb, var(--color-primary-foreground) 20%, transparent)",
                        color: "var(--color-primary-foreground)",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background =
                          "color-mix(in srgb, var(--color-primary-foreground) 22%, transparent)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background =
                          "color-mix(in srgb, var(--color-primary-foreground) 12%, transparent)";
                      }}
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-10 pt-6 text-center text-xs text-primary-foreground/40"
          style={{
            borderTop: "1px solid color-mix(in srgb, var(--color-primary-foreground) 12%, transparent)",
          }}
        >
          © {new Date().getFullYear()} Todos os direitos reservados.{" "}
          Feito com{" "}
          <span className="text-red-400">❤</span>{" "}
          por <span className="font-semibold text-primary-foreground/70">Dentelli</span>
        </div>
      </div>
    </footer>
  );
}
