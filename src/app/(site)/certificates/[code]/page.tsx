import { faCircleCheck, faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { Suspense } from "react";

import { Icon } from "@/components/icon";
import { CertificatePreview } from "@/components/learn/certificate-preview";
import { buttonStyles } from "@/components/ui";
import { getCertificate, getCourse } from "@/server/demo/data";
import { formatDate } from "@/shared/format";

async function Verification({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const certificate = getCertificate(decodeURIComponent(code));
  const course = certificate ? getCourse(certificate.courseSlug) : undefined;

  if (!certificate || !course) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-2xl border border-line bg-white p-[clamp(20px,3vw,28px)]">
        <p className="flex items-center gap-3 rounded-md bg-danger-bg px-4 py-3 font-semibold text-danger" role="status">
          <Icon icon={faCircleXmark} />
          Aucun certificat ne correspond à ce code.
        </p>
        <Link href="/certificates" className={buttonStyles.primary}>
          Vérifier un autre code
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-6 rounded-2xl border border-line bg-white p-[clamp(20px,3vw,28px)]">
      <div className="min-w-0 flex-[1_1_260px]">
        <CertificatePreview fullName={certificate.fullName} courseTitle={course.title} />
      </div>
      <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-3">
        <p className="flex items-center gap-2.5 self-start rounded-full bg-success-bg px-3.5 py-2 text-sm font-bold text-success" role="status">
          <Icon icon={faCircleCheck} />
          Certificat authentique
        </p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[15px]">
          <dt className="text-muted">Titulaire</dt>
          <dd className="font-bold text-ink">{certificate.fullName}</dd>
          <dt className="text-muted">Cours</dt>
          <dd className="text-ink">
            <Link href={`/courses/${course.slug}`}>{course.title}</Link>
          </dd>
          <dt className="text-muted">Durée</dt>
          <dd className="text-ink">{course.duration}</dd>
          <dt className="text-muted">Émis le</dt>
          <dd className="text-ink">{formatDate(certificate.issuedAt)}</dd>
          <dt className="text-muted">Code</dt>
          <dd className="font-mono text-ink">{certificate.code}</dd>
        </dl>
      </div>
    </div>
  );
}

/** F-74 : page publique de vérification (cible du QR code). */
export default function CertificatePage(props: PageProps<"/certificates/[code]">) {
  return (
    <main className="mx-auto w-full max-w-[880px] px-5 py-[clamp(32px,6vw,72px)]">
      <h1 className="mb-6 text-[clamp(28px,4vw,40px)] tracking-[-.03em]">Vérification de certificat</h1>
      <Suspense fallback={<p className="text-muted">Vérification en cours…</p>}>
        <Verification params={props.params} />
      </Suspense>
    </main>
  );
}
