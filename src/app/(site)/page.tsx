import { faFilePdf } from "@fortawesome/free-regular-svg-icons";
import { faArrowRight, faAward, faCirclePlay, faCode, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { CourseCard } from "@/components/course/course-card";
import { CATEGORY_ICON_DEFS, Icon } from "@/components/icon";
import { buttonStyles, MoreLink, PHOTOS, PhotoImage, ProgressBar } from "@/components/ui";
import { getFeaturedCourses, getPublicCategories } from "@/server/catalog/catalog.service";
import { TRAINER } from "@/server/site";
import { plural } from "@/shared/format";

/** Teintes des tuiles de catégorie, en alternance (prototype). */
const CATEGORY_TONES = ["bg-mint text-forest", "bg-danger-bg text-terracotta-700", "bg-warning-bg text-warning"];

/** F-10 : catégories populaires (premier niveau, avec au moins un cours publié). */
async function PopularCategories() {
  await connection();
  const categories = (await getPublicCategories()).filter((c) => !c.isChild && c.courseCount > 0).slice(0, 6);
  if (categories.length === 0) return null;
  return (
    <section className="mx-auto w-full max-w-site px-5 pb-14" aria-labelledby="titre-categories">
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 id="titre-categories" className="text-[clamp(22px,3vw,30px)]">
          Catégories populaires
        </h2>
        <MoreLink href="/courses">
          Tout voir <Icon icon={faArrowRight} />
        </MoreLink>
      </div>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
        {categories.map((category, i) => (
          <li key={category.slug}>
            <Link
              href={`/courses?category=${category.slug}`}
              className="flex h-full flex-col gap-3 rounded-[18px] border border-line bg-white p-4 transition-colors hover:border-forest"
            >
              <span className={`grid size-[42px] place-items-center rounded-base text-[17px] ${CATEGORY_TONES[i % CATEGORY_TONES.length]}`}>
                <Icon icon={CATEGORY_ICON_DEFS[category.icon]} />
              </span>
              <span className="text-[15px] font-bold text-ink">{category.name}</span>
              <span className="-mt-2 text-[13px] text-muted">{plural(category.courseCount, "cours", "cours")}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** F-10 : derniers cours publiés. */
async function FeaturedCourses() {
  await connection();
  const courses = await getFeaturedCourses(4);
  if (courses.length === 0) {
    return <p className="rounded-2xl border border-dashed border-[#D9CFBF] bg-white px-5 py-10 text-center text-muted">Les premiers cours arrivent bientôt.</p>;
  }
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-[18px]">
      {courses.map((course) => (
        <CourseCard key={course.slug} course={course} />
      ))}
    </div>
  );
}

const FEATURES = [
  { icon: faCirclePlay, title: "Vidéo adaptative", text: "Lecture fluide en 360p, 720p ou 1080p selon votre connexion, avec reprise là où vous vous êtes arrêté." },
  { icon: faCode, title: "Code coloré", text: "Des blocs de code lisibles, numérotés et copiables en un clic, dans plus de 15 langages." },
  { icon: faFilePdf, title: "Supports PDF", text: "Fiches et supports consultables en ligne, téléchargeables quand le formateur l'autorise." },
  { icon: faAward, title: "Certificat vérifiable", text: "Un certificat PDF avec code unique et QR code à la fin de chaque cours." },
];

export default function HomePage() {
  return (
    <main>
      {/* Accroche */}
      <section className="mx-auto flex max-w-site flex-wrap items-center gap-[clamp(32px,5vw,64px)] px-5 pt-[clamp(32px,6vw,80px)] pb-[clamp(40px,6vw,72px)]">
        <div className="min-w-0 flex-[1_1_360px]">
          <span className="inline-flex items-center gap-2 rounded-full bg-warning-bg px-3.5 py-[7px] text-[13px] font-bold text-warning">
            <Icon icon={faCirclePlay} className="text-terracotta" />
            Vidéo, texte, code et PDF au même endroit
          </span>
          <h1 className="mt-5 mb-[18px] text-[clamp(36px,6vw,62px)] leading-[1.04] tracking-[-.035em] text-balance">
            Apprenez le numérique à votre rythme, <span className="text-terracotta">pas à pas.</span>
          </h1>
          <p className="mb-7 max-w-[520px] text-[clamp(16px,2vw,18px)] leading-relaxed text-pretty text-[#4E5F5C]">
            Des cours clairs, du code prêt à copier et un suivi de progression jusqu&apos;au certificat. Payez par Orange Money, MTN MoMo ou carte bancaire.
          </p>
          <form
            action="/courses"
            role="search"
            className="flex max-w-[520px] gap-2 rounded-full border border-line-strong bg-white py-1.5 pr-1.5 pl-5 shadow-[0_10px_30px_-18px_rgba(15,61,58,.35)] focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-gold"
          >
            <Icon icon={faMagnifyingGlass} className="self-center text-subtle" />
            <input
              name="q"
              type="search"
              placeholder="JavaScript, Python, SQL…"
              aria-label="Rechercher un cours"
              className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none focus-visible:outline-none"
            />
            <button type="submit" className={buttonStyles.primary}>
              Rechercher
            </button>
          </form>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link href="/courses" className={buttonStyles.accent}>
              Explorer le catalogue <Icon icon={faArrowRight} />
            </Link>
            <Link href="/courses?price=free" className={buttonStyles.ghost}>
              Voir les cours gratuits
            </Link>
          </div>
        </div>
        <div className="relative min-w-0 flex-[1_1_360px]">
          <div className="relative aspect-[5/4] overflow-hidden rounded-[32px] bg-sand">
            <PhotoImage photo={PHOTOS.accueilApprenant} priority />
          </div>
          <div className="absolute bottom-5 left-0 flex w-[min(260px,80%)] items-center gap-3 rounded-[18px] bg-white px-4 py-3.5 shadow-[0_18px_40px_-16px_rgba(15,61,58,.4)]">
            <span className="grid size-10 shrink-0 place-items-center rounded-base bg-forest text-gold">
              <Icon icon={faCode} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold text-ink">JavaScript moderne</div>
              <ProgressBar value={68} label="Progression : 68 %" className="my-[7px] h-1.5" />
              <div className="text-xs text-muted">68 % terminé</div>
            </div>
          </div>
          <div className="absolute top-4 right-4 flex items-center gap-2 rounded-full bg-forest px-4 py-2.5 text-[13px] font-semibold text-sand shadow-[0_12px_30px_-14px_rgba(15,61,58,.6)]">
            <Icon icon={faAward} className="text-gold" />
            Certificat vérifiable
          </div>
        </div>
      </section>

      <Suspense fallback={null}>
        <PopularCategories />
      </Suspense>

      {/* Cours mis en avant */}
      <section className="mx-auto max-w-site px-5 pb-[72px]" aria-labelledby="titre-avant">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 id="titre-avant" className="mb-1.5 text-[clamp(22px,3vw,30px)]">
              Cours mis en avant
            </h2>
            <p className="text-[15px] text-muted">Les derniers cours publiés.</p>
          </div>
          <MoreLink href="/courses">
            Catalogue <Icon icon={faArrowRight} />
          </MoreLink>
        </div>
        <Suspense fallback={<p className="text-muted">Chargement des cours…</p>}>
          <FeaturedCourses />
        </Suspense>
      </section>

      {/* Atouts */}
      <section className="bg-forest text-sand" aria-labelledby="titre-atouts">
        <div className="mx-auto max-w-site px-5 py-[clamp(48px,7vw,88px)]">
          <h2 id="titre-atouts" className="mb-2.5 max-w-[620px] text-[clamp(26px,4vw,40px)] tracking-[-.03em] text-balance text-white">
            Pensé pour apprendre vraiment, même en 4G.
          </h2>
          <p className="mb-10 max-w-[560px] text-base leading-relaxed text-[#C9D8D4]">
            Tout le contenu d&apos;un cours au même endroit, avec une mise en forme soignée et un suivi clair.
          </p>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-7">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="flex flex-col gap-3 border-t border-sand/20 pt-5">
                <Icon icon={feature.icon} className="text-[22px] text-gold" />
                <h3 className="text-lg tracking-normal text-white">{feature.title}</h3>
                <p className="text-[15px] leading-relaxed text-[#C9D8D4]">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formateur */}
      <section className="mx-auto flex max-w-site flex-wrap items-center gap-[clamp(28px,5vw,56px)] px-5 py-[clamp(48px,7vw,88px)]" aria-labelledby="titre-formateur">
        <div className="relative aspect-square min-w-[240px] flex-[0_1_320px] overflow-hidden rounded-[28px] bg-sand">
          <PhotoImage photo={PHOTOS.accueilCode} />
        </div>
        <div className="min-w-0 flex-[1_1_360px]">
          <span className="text-[13px] font-bold tracking-[.08em] text-terracotta-700 uppercase">Votre formateur</span>
          <h2 id="titre-formateur" className="mt-2.5 mb-1.5 text-[clamp(26px,4vw,38px)] tracking-[-.03em]">
            {TRAINER.name}
          </h2>
          <p className="mb-[18px] font-semibold text-muted">{TRAINER.role}</p>
          <p className="mb-6 max-w-[560px] text-base leading-[1.7] text-pretty text-ink-700">{TRAINER.bio}</p>
          <Link href="/courses" className={`${buttonStyles.ghost} border-forest py-[13px]`}>
            Voir tous ses cours
          </Link>
        </div>
      </section>

      {/* Appel à l'action */}
      <section className="mx-auto w-full max-w-site px-5 pb-[72px]">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-[32px] bg-gold p-[clamp(28px,5vw,56px)]">
          <div className="flex-[1_1_320px]">
            <h2 className="mb-2 text-[clamp(24px,3.5vw,36px)] tracking-[-.03em] text-balance">Prêt à commencer ? Votre compte est gratuit.</h2>
            <p className="text-base text-[#3B3214]">Accédez aux leçons en aperçu et aux cours gratuits dès aujourd&apos;hui.</p>
          </div>
          <Link href="/register" className={`${buttonStyles.primary} px-[26px] py-4 text-base`}>
            Créer mon compte
          </Link>
        </div>
      </section>
    </main>
  );
}
