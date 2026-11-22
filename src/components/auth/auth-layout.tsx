import { type Photo, PhotoImage } from "@/components/ui";

/** Mise en page des écrans d'authentification : carte formulaire + visuel (prototype « auth »). */
export function AuthLayout({ title, intro, photo, children }: { title: string; intro: string; photo: Photo; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-site flex-wrap items-stretch gap-6 px-5 pt-[clamp(16px,3vw,32px)] pb-14">
      <div className="flex min-w-0 flex-[1_1_380px] flex-col justify-center rounded-[28px] border border-line bg-white p-[clamp(24px,5vw,56px)]">
        <div className="mx-auto w-full max-w-[400px]">
          <h1 className="mb-2 text-[clamp(28px,4vw,36px)] tracking-[-.03em]">{title}</h1>
          <p className="mb-7 text-[15px] text-muted">{intro}</p>
          {children}
        </div>
      </div>
      <div className="relative min-h-[420px] min-w-0 flex-[1_1_380px] overflow-hidden rounded-[28px] bg-sand">
        <PhotoImage photo={photo} priority />
        <div className="absolute right-4 bottom-4 left-4 rounded-[20px] bg-forest/92 p-[22px] text-sand">
          <h2 className="mb-2 text-[22px] tracking-normal text-white">Votre progression vous suit partout</h2>
          <p className="text-[15px] leading-relaxed text-[#C9D8D4]">
            Commencez sur ordinateur, reprenez sur téléphone : la vidéo repart à la bonne seconde.
          </p>
        </div>
      </div>
    </main>
  );
}
