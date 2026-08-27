import type { Metadata } from "next";
import { Sora, Instrument_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";

// Mismas tres fuentes que Axis (ver docs/05-estilo-visual-axis.md).
const display = Sora({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600", "700", "800"] });
const body = Instrument_Sans({ variable: "--font-body", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sinergéticos Mailing",
  description: "Mailing masivo de Sinergéticos",
  robots: { index: false, follow: false },
};

// Aplica el tema ANTES del primer render para que no parpadee.
const themeInit = `(function(){try{var t=localStorage.getItem("mailing-theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
