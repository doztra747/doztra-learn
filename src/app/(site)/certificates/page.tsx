import { faAward } from "@fortawesome/free-solid-svg-icons";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Icon } from "@/components/icon";
import { buttonStyles, inputStyles } from "@/components/ui";

export const metadata: Metadata = { title: "Vérifier un certificat" };

const CODE_PATTERN = /^DZL-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

/** Le formulaire envoie ?code= (GET, fonctionne sans JS) ; un code bien formé redirige vers sa page publique. */
async function CodeRedirect({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = (await searchParams).code;
  const code = (Array.isArray(raw) ? raw[0] : raw)?.trim().toUpperCase();
  if (code && CODE_PATTERN.test(code)) redirect(`/certificates/${code}`);
  return code ? (
    <p role="alert" className="text-sm font-semibold text-danger">
      Format de code invalide. Exemple : DZL-7K2F-91QA.
    </p>
  ) : null;
}

export default function VerifyCertificatePage(props: PageProps<"/certificates">) {
  return (
    <main className="mx-auto w-full max-w-[640px] px-5 py-[clamp(32px,6vw,72px)]">
      <span className="mb-5 grid size-14 place-items-center rounded-lg bg-forest text-2xl text-gold">
        <Icon icon={faAward} />
      </span>
      <h1 className="mb-2 text-[clamp(28px,4vw,40px)] tracking-[-.03em]">Vérifier un certificat</h1>
      <p className="mb-7 text-base text-muted">
        Saisissez le code imprimé sous le QR code du certificat pour confirmer son authenticité.
      </p>
      <form action="/certificates" className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-[clamp(20px,3vw,28px)]">
        <label className="flex flex-col gap-1.5 text-[13px] font-bold text-ink-700">
          Code du certificat
          <input
            name="code"
            required
            maxLength={13}
            autoComplete="off"
            placeholder="DZL-XXXX-XXXX"
            className={`${inputStyles} font-mono uppercase`}
          />
        </label>
        <Suspense fallback={null}>
          <CodeRedirect searchParams={props.searchParams} />
        </Suspense>
        <button type="submit" className={buttonStyles.block}>
          Vérifier
        </button>
      </form>
    </main>
  );
}
