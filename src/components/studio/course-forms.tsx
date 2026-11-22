"use client";

import {
  createCourseAction,
  updateCourseInfoAction,
  updateCoursePricingAction,
} from "@/app/studio/actions";
import { CheckboxField, SelectField, StudioForm, SubmitButton, TextArea, TextField } from "@/components/studio/form";
import { COURSE_LEVELS, LEVEL_LABELS } from "@/shared/courses";

type Option = { value: string; label: string };

const levelOptions = COURSE_LEVELS.map((l) => ({ value: l, label: LEVEL_LABELS[l] }));

export function NewCourseForm({ categories }: { categories: Option[] }) {
  return (
    <StudioForm action={createCourseAction} className="flex flex-col gap-4" aria-label="Nouveau cours">
      <TextField name="title" label="Titre du cours" required maxLength={160} placeholder="JavaScript moderne : de zéro à l'autonomie" autoFocus />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
        <SelectField name="categoryId" label="Catégorie" options={[{ value: "", label: "Choisir plus tard" }, ...categories]} />
        <SelectField name="level" label="Niveau" options={levelOptions} defaultValue="BEGINNER" />
      </div>
      <SubmitButton className="self-start">Créer le cours</SubmitButton>
    </StudioForm>
  );
}

export function CourseInfoForm({
  courseId,
  categories,
  values,
  slug,
  slugLocked,
}: {
  courseId: string;
  categories: Option[];
  values: { title: string; subtitle: string; categoryId: string; level: string; description: string; objectives: string; prerequisites: string };
  slug: string;
  slugLocked: boolean;
}) {
  return (
    <StudioForm action={updateCourseInfoAction.bind(null, courseId)} className="flex flex-col gap-4" successMessage="Informations enregistrées.">
      <TextField
        name="title"
        label="Titre"
        required
        maxLength={160}
        defaultValue={values.title}
        hint={`Adresse : /courses/${slug}${slugLocked ? " (figée depuis la publication)" : " (suit le titre tant que le cours n'est pas publié)"}`}
      />
      <TextField name="subtitle" label="Sous-titre" maxLength={240} defaultValue={values.subtitle} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
        <SelectField name="categoryId" label="Catégorie" options={[{ value: "", label: "Aucune" }, ...categories]} defaultValue={values.categoryId} />
        <SelectField name="level" label="Niveau" options={levelOptions} defaultValue={values.level} />
      </div>
      <TextArea
        name="description"
        label="Description"
        rows={6}
        maxLength={5000}
        defaultValue={values.description}
        hint="Séparez les paragraphes par une ligne vide. La mise en forme riche arrivera avec l'éditeur de leçons."
      />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3">
        <TextArea name="objectives" label="Ce que l'apprenant va apprendre" rows={5} defaultValue={values.objectives} hint="Un objectif par ligne (12 maximum)." />
        <TextArea name="prerequisites" label="Prérequis" rows={5} defaultValue={values.prerequisites} hint="Un prérequis par ligne (12 maximum)." />
      </div>
      <SubmitButton className="self-start">Enregistrer</SubmitButton>
    </StudioForm>
  );
}

export function CoursePricingForm({ courseId, price, compareAtPrice }: { courseId: string; price: string; compareAtPrice: string }) {
  return (
    <StudioForm
      action={updateCoursePricingAction.bind(null, courseId)}
      className="grid max-w-[720px] grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 rounded-xl border border-line-admin bg-white p-5"
      successMessage="Prix enregistré."
    >
      <TextField name="price" label="Prix (GNF)" inputMode="numeric" defaultValue={price} placeholder="250 000" />
      <TextField name="compareAtPrice" label="Prix barré (optionnel)" inputMode="numeric" defaultValue={compareAtPrice} placeholder="350 000" />
      <CheckboxField name="free" label="Cours gratuit (inscription en un clic)" defaultChecked={price === "0"} className="col-span-full" />
      <p className="col-span-full -mt-2 text-xs text-muted">Montants en francs guinéens, sans décimales. Le prix est figé dans chaque commande au moment de l&apos;achat.</p>
      <SubmitButton className="col-span-full justify-self-start">Enregistrer le prix</SubmitButton>
    </StudioForm>
  );
}
