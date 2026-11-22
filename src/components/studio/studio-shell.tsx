"use client";

import { faComments } from "@fortawesome/free-regular-svg-icons";
import {
  faArrowUpRightFromSquare,
  faBars,
  faBookOpen,
  faChartLine,
  faCloudArrowUp,
  faGraduationCap,
  faLayerGroup,
  faMobileScreenButton,
  faPlus,
  faRightFromBracket,
  faUserGraduate,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

import { logoutAction } from "@/app/auth-actions";
import { usePathname } from "next/navigation";
import { createContext, Suspense, useContext, useEffect, useRef, useState } from "react";

import { Icon } from "@/components/icon";

const NAV_GROUPS = [
  { title: "Pilotage", items: [{ href: "/studio", label: "Tableau de bord", icon: faChartLine, exact: true }] },
  {
    title: "Contenus",
    items: [
      { href: "/studio/courses", label: "Mes cours", icon: faBookOpen },
      { href: "/studio/categories", label: "Catégories", icon: faLayerGroup },
      { href: "/studio/media", label: "Import vidéo", icon: faCloudArrowUp },
    ],
  },
  {
    title: "Communauté",
    items: [
      { href: "/studio/students", label: "Apprenants", icon: faUserGraduate },
      { href: "/studio/questions", label: "Questions et avis", icon: faComments },
    ],
  },
  { title: "Ventes", items: [{ href: "/studio/payments", label: "Paiements et coupons", icon: faMobileScreenButton }] },
];

type NavItem = (typeof NAV_GROUPS)[number]["items"][number] & { exact?: boolean };

const MenuContext = createContext<{ open: () => void }>({ open: () => {} });

function NavLinks({ pathname, onNavigate }: { pathname: string | null; onNavigate: () => void }) {
  return NAV_GROUPS.map((group) => (
    <div key={group.title} className="mb-3.5">
      <p className="px-2.5 pb-2 text-[11px] font-bold tracking-[.12em] text-[#7E9994] uppercase">{group.title}</p>
      <ul>
        {group.items.map((item: NavItem) => {
          const active = pathname !== null && (item.exact ? pathname === item.href : pathname.startsWith(item.href));
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`flex w-full items-center gap-3 rounded-base px-3 py-[11px] text-sm font-semibold ${
                  active ? "bg-gold/16 text-gold hover:text-gold" : "text-[#C9D8D4] hover:bg-white/7 hover:text-white"
                }`}
              >
                <Icon icon={item.icon} className="w-[18px]" />
                <span className="flex-1">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  ));
}

/** usePathname() est une donnée d'URL : lue sous <Suspense> pour que la coquille reste prérendue. */
function ActiveNavLinks({ onNavigate }: { onNavigate: () => void }) {
  return <NavLinks pathname={usePathname()} onNavigate={onNavigate} />;
}

/** Coquille de l'espace formateur (prototype Admin) : barre latérale 268 px, tiroir sous 1024 px. */
export function StudioShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const close = () => setOpen(false);

  // Tiroir mobile : Échap ferme, le focus va au bouton de fermeture.
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <MenuContext value={{ open: () => setOpen(true) }}>
      <div className="flex min-h-screen bg-linen">
        <aside
          id="studio-nav"
          aria-label="Espace formateur"
          className={`${open ? "fixed inset-y-0 left-0 z-60 flex" : "hidden"} h-screen w-[268px] shrink-0 flex-col overflow-y-auto bg-forest px-3.5 py-5 text-[#C9D8D4] lg:sticky lg:top-0 lg:flex`}
        >
          <div className="flex items-center gap-2.5 px-2 pt-1 pb-[22px]">
            <span className="grid size-[38px] place-items-center rounded-[11px] bg-gold text-[17px] text-forest">
              <Icon icon={faGraduationCap} />
            </span>
            <div className="flex-1">
              <p className="text-[17px] font-extrabold tracking-tight text-white">Doztra-Learn</p>
              <p className="text-xs text-[#9FB8B3]">Espace formateur</p>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              aria-label="Fermer le menu"
              className="grid size-9 place-items-center rounded-[10px] bg-white/8 text-white lg:hidden"
            >
              <Icon icon={faXmark} />
            </button>
          </div>
          <nav aria-label="Navigation du studio">
            <Suspense fallback={<NavLinks pathname={null} onNavigate={close} />}>
              <ActiveNavLinks onNavigate={close} />
            </Suspense>
          </nav>
          <div className="mt-auto flex flex-col gap-1 border-t border-white/10 pt-3">
            <Link href="/" className="flex items-center gap-2.5 rounded-base px-3 py-2.5 text-sm font-semibold text-[#C9D8D4] hover:bg-white/7 hover:text-white">
              <Icon icon={faArrowUpRightFromSquare} className="w-[18px]" />
              Voir le site
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="flex w-full items-center gap-2.5 rounded-base px-3 py-2.5 text-left text-sm font-semibold text-[#C9D8D4] hover:bg-white/7 hover:text-white">
                <Icon icon={faRightFromBracket} className="w-[18px]" />
                Se déconnecter
              </button>
            </form>
          </div>
        </aside>
        {open ? <div aria-hidden="true" onClick={close} className="fixed inset-0 z-55 bg-forest-900/50 lg:hidden" /> : null}
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </MenuContext>
  );
}

/** Barre supérieure d'une page du studio : bouton menu (mobile), titre, « Nouveau cours ». */
export function StudioTopbar({ title }: { title: string }) {
  const { open } = useContext(MenuContext);
  return (
    <header className="sticky top-0 z-30 border-b border-line-admin bg-linen/95 backdrop-blur-md">
      <div className="flex items-center gap-3 px-[clamp(16px,3vw,32px)] py-3.5">
        <button
          type="button"
          onClick={open}
          aria-label="Ouvrir le menu"
          aria-controls="studio-nav"
          className="grid size-[42px] place-items-center rounded-base border border-line-admin bg-white text-base text-forest lg:hidden"
        >
          <Icon icon={faBars} />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-[clamp(19px,2.4vw,24px)] tracking-tight">{title}</h1>
        <Link
          href="/studio/courses/new"
          className="flex items-center gap-2 rounded-base bg-forest px-4 py-3 text-sm font-bold whitespace-nowrap text-white hover:bg-forest-900 hover:text-white"
        >
          <Icon icon={faPlus} />
          <span className="hidden sm:inline">Nouveau cours</span>
          <span className="sr-only sm:hidden">Nouveau cours</span>
        </Link>
      </div>
    </header>
  );
}
