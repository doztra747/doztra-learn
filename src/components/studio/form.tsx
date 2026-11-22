"use client";

import { faCircleCheck, faCircleExclamation, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { createContext, startTransition, useActionState, useContext, useEffect, useId, useRef } from "react";
import { useFormStatus } from "react-dom";

import { Icon } from "@/components/icon";
import { type ActionState, initialActionState } from "@/shared/action-state";

type FormContextValue = { state: ActionState; formId: string; pending: boolean };
const FormContext = createContext<FormContextValue>({ state: initialActionState, formId: "f", pending: false });

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

/** Formulaire du studio : Server Action + useActionState ; fonctionne aussi sans JavaScript. */
export function StudioForm({
  action,
  children,
  className = "",
  successMessage,
  resetOnSuccess = false,
  "aria-label": ariaLabel,
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  /** Message affiché après un succès si l'action n'en renvoie pas. */
  successMessage?: string;
  /** Vide les champs après un succès (formulaires d'ajout), sans perdre le message. */
  resetOnSuccess?: boolean;
  "aria-label"?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (resetOnSuccess && state.ok) formRef.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <FormContext value={{ state, formId, pending }}>
      <form
        ref={formRef}
        action={formAction}
        // Avec JavaScript : envoi en transition, sans la remise à zéro automatique de React 19
        // (la saisie est conservée en cas d'erreur). Sans JavaScript : envoi natif via « action ».
        onSubmit={(event) => {
          event.preventDefault();
          const submitter = (event.nativeEvent as SubmitEvent).submitter;
          const data = new FormData(event.currentTarget, submitter instanceof HTMLElement ? submitter : undefined);
          startTransition(() => formAction(data));
        }}
        className={className}
        aria-label={ariaLabel}
        noValidate
      >
        {children}
        <FormMessage successMessage={successMessage} />
      </form>
    </FormContext>
  );
}

function FormMessage({ successMessage }: { successMessage?: string }) {
  const { state } = useContext(FormContext);
  const text = state.message ?? (state.ok ? successMessage : undefined);
  return (
    <p
      role={state.ok ? "status" : "alert"}
      aria-live="polite"
      className={`text-sm font-semibold empty:hidden ${state.ok ? "text-success" : "text-danger"}`}
    >
      {text ? (
        <>
          <Icon icon={state.ok ? faCircleCheck : faCircleExclamation} /> {text}
        </>
      ) : null}
    </p>
  );
}

/** Identifiants du message d'erreur d'un champ (pour aria-describedby). */
export function useFieldError(name: string) {
  const { state, formId } = useContext(FormContext);
  const error = state.fieldErrors?.[name];
  const errorId = `${formId}-${name}-erreur`;
  return { error, errorId, invalid: !!error };
}

export const fieldStyles =
  "w-full rounded-base border border-line-admin bg-paper px-[13px] py-[13px] text-[15px] text-ink placeholder:text-subtle aria-[invalid=true]:border-danger";

const labelStyles = "text-[13px] font-bold text-ink-700";

/** Aide et erreur d'un champ, hors du <label> : le nom accessible reste le libellé seul. */
function FieldExtras({ hint, hintId, error, errorId }: { hint?: string; hintId: string; error?: string; errorId: string }) {
  return (
    <>
      {hint ? (
        <span id={hintId} className="text-xs text-muted">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} className="text-xs font-semibold text-danger">
          {error}
        </span>
      ) : null}
    </>
  );
}

function useFieldIds(name: string, hint?: string) {
  const { error, errorId, invalid } = useFieldError(name);
  const inputId = `${errorId}-champ`;
  const hintId = `${errorId}-aide`;
  const describedBy = [hint ? hintId : "", invalid ? errorId : ""].filter(Boolean).join(" ") || undefined;
  return { error, errorId, invalid, inputId, hintId, describedBy };
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { name: string; label: string; hint?: string };

/** Champ texte avec libellé, aide et erreur liée (WCAG : label for, aria-describedby, aria-invalid). */
export function TextField({ name, label, hint, className = "", ...props }: InputProps) {
  const f = useFieldIds(name, hint);
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={f.inputId} className={labelStyles}>
        {label}
      </label>
      <input id={f.inputId} name={name} aria-invalid={f.invalid} aria-describedby={f.describedBy} className={fieldStyles} {...props} />
      <FieldExtras hint={hint} hintId={f.hintId} error={f.error} errorId={f.errorId} />
    </div>
  );
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { name: string; label: string; hint?: string };

export function TextArea({ name, label, hint, className = "", ...props }: TextareaProps) {
  const f = useFieldIds(name, hint);
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={f.inputId} className={labelStyles}>
        {label}
      </label>
      <textarea
        id={f.inputId}
        name={name}
        aria-invalid={f.invalid}
        aria-describedby={f.describedBy}
        className={`${fieldStyles} resize-y leading-relaxed`}
        {...props}
      />
      <FieldExtras hint={hint} hintId={f.hintId} error={f.error} errorId={f.errorId} />
    </div>
  );
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  name: string;
  label: string;
  options: { value: string; label: string }[];
};

export function SelectField({ name, label, options, className = "", ...props }: SelectProps) {
  const f = useFieldIds(name);
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={f.inputId} className={labelStyles}>
        {label}
      </label>
      <select id={f.inputId} name={name} aria-invalid={f.invalid} aria-describedby={f.describedBy} className={fieldStyles} {...props}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <FieldExtras hintId={f.hintId} error={f.error} errorId={f.errorId} />
    </div>
  );
}

type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & { name: string; label: string };

/** Case à cocher avec erreur liée. */
export function CheckboxField({ name, label, className = "", ...props }: CheckboxProps) {
  const f = useFieldIds(name);
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="flex items-center gap-2.5 text-sm text-[#2B3B38]">
        <input id={f.inputId} type="checkbox" name={name} aria-invalid={f.invalid} aria-describedby={f.describedBy} className="size-[18px] accent-forest" {...props} />
        <label htmlFor={f.inputId}>{label}</label>
      </span>
      <FieldExtras hintId={f.hintId} error={f.error} errorId={f.errorId} />
    </div>
  );
}

/** Bouton d'envoi : désactivé et annoncé pendant l'envoi. */
export function SubmitButton({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "accent" }) {
  const status = useFormStatus();
  const pending = useContext(FormContext).pending || status.pending;
  const variants = {
    primary: "border-0 bg-forest text-white",
    accent: "border-0 bg-gold text-forest",
    secondary: "border border-line-admin bg-white text-forest",
    danger: "border border-danger/30 bg-danger-bg text-danger",
  };
  return (
    <button
      type="submit"
      disabled={pending || props.disabled}
      aria-busy={pending}
      className={`inline-flex items-center justify-center gap-2 rounded-base px-4 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {pending ? <Icon icon={faSpinner} spin /> : null}
      {children}
    </button>
  );
}

/** Petit formulaire à un seul bouton (déplacer, supprimer, basculer) avec message d'erreur discret. */
export function ActionButton({
  action,
  children,
  label,
  className = "",
  name,
  value,
}: {
  action: Action;
  children: React.ReactNode;
  /** Nom accessible du bouton (bouton à icône seule). */
  label?: string;
  className?: string;
  name?: string;
  value?: string;
}) {
  const [state, formAction] = useActionState(action, initialActionState);
  return (
    <form action={formAction} className="contents">
      <PendingButton label={label} className={className} name={name} value={value}>
        {children}
      </PendingButton>
      {!state.ok && state.message ? (
        <span role="alert" className="basis-full text-xs font-semibold text-danger">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}

function PendingButton({ children, label, className, name, value }: { children: React.ReactNode; label?: string; className: string; name?: string; value?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" name={name} value={value} aria-label={label} disabled={pending} aria-busy={pending} className={`disabled:opacity-50 ${className}`}>
      {pending ? <Icon icon={faSpinner} spin /> : children}
    </button>
  );
}
