import Link from "next/link";

import { buttonStyles, Logo } from "@/components/ui";

export default function NotFound() {
  return (
    <main id="contenu" className="mx-auto flex w-full max-w-read flex-1 flex-col items-start justify-center gap-5 px-5 py-16">
      <Link href="/" aria-label="Doztra-Learn, accueil">
        <Logo />
      </Link>
      <h1 className="text-[clamp(28px,4vw,40px)] tracking-[-.03em]">Page introuvable</h1>
      <p className="text-base text-muted">Cette page n&apos;existe pas ou n&apos;est plus disponible.</p>
      <Link href="/courses" className={buttonStyles.primary}>
        Voir le catalogue
      </Link>
    </main>
  );
}
