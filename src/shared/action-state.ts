/** État renvoyé par une Server Action à son formulaire (useActionState). */
export type ActionState = {
  ok: boolean;
  /** Message global (succès ou erreur), en français. */
  message?: string;
  /** Erreurs par champ (nom du champ → message). */
  fieldErrors?: Record<string, string>;
};

export const initialActionState: ActionState = { ok: false };
