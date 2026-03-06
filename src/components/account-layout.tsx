"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteHeader } from "./header";
import { SiteFooter } from "./footer";
import { FloatingButtons } from "./floating-buttons";
import { PageTransition } from "./page-transition";

const navItems = [
  { label: "Histórico", href: "/my_account/historico" },
  { label: "Pedidos", href: "/my_account/pedidos" },
  { label: "Perfil", href: "/my_account/perfil" },
];

export function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <PageTransition>
        <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
          <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-10">Minha Conta</p>
          <nav className="flex gap-8 border-b border-border/40 mb-10">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}
                className={`pb-3 text-sm transition-colors border-b-2 -mb-px ${
                  pathname === item.href
                    ? "border-foreground text-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}>
                {item.label}
              </Link>
            ))}
          </nav>
          {children}
        </main>
      </PageTransition>
      <SiteFooter />
      <FloatingButtons />
    </div>
  );
}
