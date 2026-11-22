import { faLayerGroup, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { createCategoryAction, deleteCategoryAction, updateCategoryAction } from "@/app/studio/actions";
import { CATEGORY_ICON_DEFS, Icon } from "@/components/icon";
import { ActionButton, SelectField, StudioForm, SubmitButton, TextField } from "@/components/studio/form";
import { StudioTopbar } from "@/components/studio/studio-shell";
import { EmptyState, Panel, StudioMain } from "@/components/studio/ui";
import { OwnerOnly } from "@/components/studio/owner-only";
import { listCategories } from "@/server/categories/categories.service";
import { CATEGORY_ICON_LABELS, CATEGORY_ICONS } from "@/shared/courses";
import { plural } from "@/shared/format";

export const metadata: Metadata = { title: "Catégories" };

const iconOptions = CATEGORY_ICONS.map((icon) => ({ value: icon, label: CATEGORY_ICON_LABELS[icon] }));

async function Categories() {
  await connection();
  const categories = await listCategories();
  const roots = categories.filter((c) => !c.parentId);

  return (
    <div className="flex flex-wrap items-start gap-4">
      <Panel className="min-w-0 flex-[3_1_520px] p-0" aria-labelledby="titre-liste">
        <h2 id="titre-liste" className="border-b border-[#EFE7DA] px-5 py-4 text-[17px] tracking-normal text-ink">
          {plural(categories.length, "catégorie")}
        </h2>
        {categories.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={faLayerGroup} title="Aucune catégorie">
              Créez les catégories de votre catalogue (deux niveaux possibles) avec le formulaire.
            </EmptyState>
          </div>
        ) : (
          <ul>
            {categories.map((c) => (
              <li key={c.id} className={`flex flex-wrap items-end gap-3 border-t border-inline-code px-5 py-3.5 first:border-t-0 ${c.parentId ? "pl-10" : ""}`}>
                <span className="mb-1.5 grid size-10 shrink-0 place-items-center rounded-base bg-mint text-forest">
                  <Icon icon={CATEGORY_ICON_DEFS[c.icon]} />
                </span>
                <StudioForm key={`${c.name}-${c.icon}`} action={updateCategoryAction.bind(null, c.id)} className="flex min-w-0 flex-1 flex-wrap items-end gap-2" aria-label={`Modifier « ${c.name} »`}>
                  <TextField name="name" label={c.parentName ? `Sous-catégorie de ${c.parentName}` : "Nom"} defaultValue={c.name} maxLength={80} required className="min-w-[160px] flex-1" />
                  <SelectField name="icon" label="Icône" options={iconOptions} defaultValue={c.icon} className="w-[160px]" />
                  <SubmitButton variant="secondary">Enregistrer</SubmitButton>
                </StudioForm>
                <div className="mb-1 flex flex-col items-end gap-1">
                  <span className="text-xs text-muted">{plural(c.courseCount, "cours", "cours")}</span>
                  <ActionButton
                    action={deleteCategoryAction.bind(null, c.id)}
                    label={`Supprimer « ${c.name} »`}
                    className="grid size-[34px] place-items-center rounded-sm border border-line-admin bg-white text-danger hover:border-danger"
                  >
                    <Icon icon={faTrashCan} />
                  </ActionButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel as="aside" className="min-w-0 flex-[1_1_300px]" aria-labelledby="titre-nouvelle">
        <h2 id="titre-nouvelle" className="mb-3 text-[17px] tracking-normal text-ink">
          Nouvelle catégorie
        </h2>
        <StudioForm resetOnSuccess action={createCategoryAction} className="flex flex-col gap-3">
          <TextField name="name" label="Nom" placeholder="Développement web" maxLength={80} required />
          <SelectField name="icon" label="Icône" options={iconOptions} />
          <SelectField name="parentId" label="Catégorie parente" options={[{ value: "", label: "Aucune (premier niveau)" }, ...roots.map((r) => ({ value: r.id, label: r.name }))]} />
          <SubmitButton className="self-start">Créer la catégorie</SubmitButton>
        </StudioForm>
      </Panel>
    </div>
  );
}

/** F-95 : catégories du catalogue (deux niveaux). */
export default function StudioCategoriesPage() {
  return (
    <>
      <StudioTopbar title="Catégories" />
      <StudioMain>
        <Suspense fallback={<p className="text-muted">Chargement des catégories…</p>}>
          <OwnerOnly>
            <Categories />
          </OwnerOnly>
        </Suspense>
      </StudioMain>
    </>
  );
}
