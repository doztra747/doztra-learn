"use client";

import { faBell } from "@fortawesome/free-regular-svg-icons";
import { faBars, faChartLine, faXmark } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";

import { Icon } from "@/components/icon";
import { buttonStyles, Logo } from "@/components/ui";

const NAV = [
  { href: "/", label: "Accueil" },
  { href: "/courses", label: "Catalogue" },
  { href: "/my-courses", label: "Mes cours" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/my-courses") return pathname.startsWith("/my-") || pathname.startsWith("/learn");
  return pathname.startsWith(href);
}

type NavProps = { mobile: boolean; onNavigate?: () => void };

function NavLinks({ mobile, onNavigate, pathname }: NavProps & { pathname: string | null }) {
  return NAV.map((item) => {
    const active = pathname !== null && isActive(pathname, item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={
          mobile
            ? `rounded-base px-4 py-3.5 text-base font-semibold ${active ? "bg-forest text-white hover:text-white" : "text-ink"}`
            : `rounded-full px-3.5 py-2 text-sm font-semibold ${active ? "bg-forest text-white hover:text-white" : "text-ink hover:bg-white"}`
        }
      >
        {item.label}
      </Link>
    );
  });
}

/** Liens avec état actif : usePathname() est une donnée d'URL, lue sous <Suspense> pour garder l'en-tête prérendu. */
function ActiveNavLinks(props: NavProps) {
  return <NavLinks {...props} pathname={usePathname()} />;
}

function Nav(props: NavProps) {
  return (
    <Suspense fallback={<NavLinks {...props} pathname={null} />}>
      <ActiveNavLinks {...props} />
    </Suspense>
  );
}

/** En-tête du site apprenant. `user` absent = visiteur (démonstration jusqu'à la phase 3). */
export function SiteHeader({ user }: { user?: { initials: string; fullName: string } }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-site items-center gap-4 px-5 py-3">
        <Link href="/" aria-label="Doztra-Learn, accueil" className="shrink-0">
          <Logo />
        </Link>
        <nav aria-label="Navigation principale" className="ml-5 hidden gap-1 lg:flex">
          <Nav mobile={false} />
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {/* Espace formateur (prototype) : protégé par la connexion et le rôle OWNER. */}
          <Link href="/studio" className="hidden items-center gap-2 px-3 py-[9px] text-sm font-semibold text-muted lg:flex">
            <Icon icon={faChartLine} />
            Espace formateur
          </Link>
          {user ? (
            <>
              <button type="button" aria-label="Notifications (nouvelles)" className="relative grid size-[42px] place-items-center rounded-full border border-line bg-white text-forest">
                <Icon icon={faBell} />
                <span className="absolute top-[9px] right-2.5 size-2 rounded-full bg-terracotta" />
              </button>
              <Link
                href="/my-courses"
                aria-label={`Mon espace : ${user.fullName}`}
                className="grid size-[42px] place-items-center rounded-full bg-gold text-sm font-extrabold text-forest hover:text-forest"
              >
                {user.initials}
              </Link>
            </>
          ) : (
            <div className="hidden items-center gap-2 lg:flex">
              <Link href="/login" className={buttonStyles.outline}>
                Connexion
              </Link>
              <Link href="/register" className={`${buttonStyles.primary} px-[18px] py-[11px] text-sm`}>
                S&apos;inscrire
              </Link>
            </div>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            className="grid size-[42px] place-items-center rounded-base border border-line bg-white text-[17px] text-forest lg:hidden"
          >
            <Icon icon={open ? faXmark : faBars} />
          </button>
        </div>
      </div>
      {open ? (
        <nav id="menu-mobile" aria-label="Menu mobile" className="flex flex-col gap-1 border-t border-line bg-cream px-5 pt-3 pb-5 lg:hidden">
          <Nav mobile onNavigate={close} />
          <Link href="/studio" onClick={close} className="flex items-center gap-2.5 px-4 py-3.5 font-semibold text-muted">
            <Icon icon={faChartLine} />
            Espace formateur
          </Link>
          {user ? null : (
            <div className="mt-2 flex gap-2.5">
              <Link href="/login" onClick={close} className={`${buttonStyles.outline} flex-1 py-3.5 text-[15px]`}>
                Connexion
              </Link>
              <Link href="/register" onClick={close} className={`${buttonStyles.primary} flex-1 py-3.5`}>
                S&apos;inscrire
              </Link>
            </div>
          )}
        </nav>
      ) : null}
    </header>
  );
}
