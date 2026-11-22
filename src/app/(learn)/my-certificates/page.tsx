import { faDownload, faLink } from "@fortawesome/free-solid-svg-icons";
import type { Metadata } from "next";
import Link from "next/link";

import { Icon } from "@/components/icon";
import { CertificatePreview } from "@/components/learn/certificate-preview";
import { MySpace } from "@/components/learn/my-space";
import { CERTIFICATES, getCourse } from "@/server/demo/data";
import { formatDate } from "@/shared/format";

export const metadata: Metadata = { title: "Mes certificats" };

/** Mes certificats (prototype « mine », onglet Certificats). Phase 6 : PDF réel par URL signée. */
export default function MyCertificatesPage() {
  return (
    <MySpace tab="certs">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
        {CERTIFICATES.map((certificate) => {
          const course = getCourse(certificate.courseSlug);
          if (!course) return null;
          return (
            <article key={certificate.code} className="flex flex-col gap-3.5 rounded-2xl border border-line bg-white p-4">
              <h2 className="sr-only">Certificat : {course.title}</h2>
              <CertificatePreview fullName={certificate.fullName} courseTitle={course.title} />
              <div className="flex justify-between gap-2 text-[13px] text-muted">
                <span>Émis le {formatDate(certificate.issuedAt)}</span>
                <span className="font-mono">{certificate.code}</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled
                  title="Disponible à la phase 6"
                  className="flex flex-1 items-center justify-center gap-2 rounded-base bg-forest p-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Icon icon={faDownload} /> PDF
                </button>
                <Link
                  href={`/certificates/${certificate.code}`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-base border border-line-strong bg-white p-3 text-sm font-bold text-forest"
                >
                  <Icon icon={faLink} /> Partager
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </MySpace>
  );
}
