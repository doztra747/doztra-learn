import "@fortawesome/fontawesome-svg-core/styles.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import type { Metadata } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { connection } from "next/server";
import "./globals.css";

// Les styles Font Awesome sont importés ci-dessus : pas d'injection de <style> à l'exécution (compatibilité CSP).
config.autoAddCss = false;

// next/font télécharge les polices au build et les sert depuis l'application (aucune requête vers Google à l'exécution).
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Doztra-Learn",
    template: "%s · Doztra-Learn",
  },
  description:
    "Cours en ligne : texte, code, vidéos et PDF, avec suivi de progression et certificats.",
};

/**
 * CSP à nonce (src/proxy.ts) : chaque page doit être rendue à la requête pour que Next.js applique la nonce
 * à ses scripts. Le prérendu partiel est donc désactivé (guide CSP de Next.js 16, choix assumé du skill sécurité).
 */
export const instant = false;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  await connection();
  return (
    <html lang="fr" className={`${jakarta.variable} ${jetbrains.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#contenu"
          className="sr-only z-50 rounded-base bg-forest px-4 py-3 font-bold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Aller au contenu
        </a>
        {children}
      </body>
    </html>
  );
}
