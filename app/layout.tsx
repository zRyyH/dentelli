import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Providers } from "@/providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dentelli Club",
  description: "O melhor programa de pontos da odontologia",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){try{
  var t=localStorage.getItem('site-theme');
  if(t){var d=JSON.parse(t);var c=d.colors;if(c&&c.primary){
    var el=document.documentElement;
    el.style.setProperty('--primary',c.primary);
    el.style.setProperty('--secondary',c.secondary);
    el.style.setProperty('--accent',c.accent);
    el.style.setProperty('--primary-foreground','oklch(1 0 0)');
    el.style.setProperty('--secondary-foreground','oklch(1 0 0)');
    el.style.setProperty('--accent-foreground','oklch(1 0 0)');
    el.style.setProperty('--gradient-bg','linear-gradient(180deg,'+c.primary+' 0%,'+c.secondary+' 100%)');
  }}
}catch(e){}})();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <NuqsAdapter>
          <Providers>{children}</Providers>
        </NuqsAdapter>
      </body>
    </html>
  );
}
