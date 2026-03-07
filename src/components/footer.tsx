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
    <footer className="border-t border-border bg-primary py-12">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 md:grid-cols-3 md:gap-16 text-center justify-items-center">
        <div>
          <h4 className="mb-4 text-lg font-bold text-primary-foreground">Atendimento Ao Cliente</h4>
          <p className="mb-3 text-sm font-bold text-primary-foreground/90">Horário de Atendimento</p>
          <div className="space-y-2 text-sm text-primary-foreground/70">
            <p className="flex items-center gap-2 justify-center">
              <Clock className="h-4 w-4 shrink-0" /> Segunda a sexta: 8:00 às 18:00h
            </p>
            <p className="flex items-center gap-2 justify-center">
              <Phone className="h-4 w-4 shrink-0" />
              {tema?.whatsapp ? (
                <a href={`https://wa.me/${tema.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="hover:text-primary-foreground transition-colors">
                  WhatsApp: {formatPhone(tema.whatsapp)}
                </a>
              ) : "WhatsApp"}
            </p>
            <p className="flex items-center gap-2 justify-center">
              <Mail className="h-4 w-4 shrink-0" />
              {tema?.email ? (
                <a href={`mailto:${tema.email}`} className="hover:text-primary-foreground transition-colors">
                  {tema.email}
                </a>
              ) : "E-mail"}
            </p>
          </div>
        </div>

        <div>
          <h4 className="mb-4 text-lg font-bold text-primary-foreground">Menu</h4>
          <ul className="space-y-2 text-sm text-primary-foreground/70">
            <li><Link href="/rewards" className="hover:text-primary-foreground transition-colors">Recompensas</Link></li>
            <li><Link href="/support" className="hover:text-primary-foreground transition-colors">Contato</Link></li>
            <li><Link href="/my_account/pedidos" className="hover:text-primary-foreground transition-colors">Meus Pedidos</Link></li>
            <li><Link href="/my_account/perfil" className="hover:text-primary-foreground transition-colors">Editar cadastro</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-lg font-bold text-primary-foreground">Nossas Políticas</h4>
          <ul className="space-y-2 text-sm text-primary-foreground/70">
            <li><Link href="/regulation" className="hover:text-primary-foreground transition-colors">Regulamento do Programa</Link></li>
            <li><Link href="/regulation" className="hover:text-primary-foreground transition-colors">Entrega, Devolução e Reembolso</Link></li>
            <li><Link href="/regulation" className="hover:text-primary-foreground transition-colors">Políticas de privacidade</Link></li>
          </ul>

          {socials.length > 0 && (
            <>
              <p className="mt-4 text-sm font-bold text-primary-foreground">Onde nos encontrar:</p>
              <div className="mt-2 flex gap-3 justify-center">
                {socials.map(({ icon: Icon, label, href }) => (
                  <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground text-primary hover:bg-primary-foreground/80 transition-colors">
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 mt-8 pt-6 border-t border-primary-foreground/20 text-center text-sm text-primary-foreground/70">
        © Todos os direitos reservados. Feito com <span className="text-primary-foreground">❤</span> por <span className="font-bold text-primary-foreground">Dentelli</span>
      </div>
    </footer>
  );
}
