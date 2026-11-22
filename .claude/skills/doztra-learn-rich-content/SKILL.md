---
name: doztra-learn-rich-content
description: Utiliser pour implémenter ou relire l'éditeur de leçons textuelles de Doztra-Learn (Tiptap), le schéma JSON du contenu, le rendu HTML serveur, le nettoyage anti-XSS, les blocs de code colorés Shiki, les captures d'écran collées, les encadrés et l'import Markdown.
---

# Doztra-Learn — contenu riche

## Principe

Le navigateur édite, le serveur décide. L'éditeur Tiptap est un Client Component chargé par `next/dynamic` (`ssr: false`) uniquement sur la page d'édition de leçon du studio ; aucune dépendance Tiptap, ProseMirror ou Shiki dans les bundles du site apprenant. Le contenu est stocké en **JSON Tiptap** (`lesson_contents.content_json`) et rendu **une fois** côté serveur en HTML nettoyé (`content_html`) à l'enregistrement. L'apprenant reçoit le HTML stocké : aucun Tiptap ni coloration côté apprenant.

```
Éditeur (Client Component) ──Server Action saveLessonContent(JSON)──▶ editor.service
                                   1. valider contre le schéma partagé (src/shared/editor-schema)
                                   2. vérifier que chaque image/média référencé appartient au formateur et est READY
                                   3. rendre en HTML (@tiptap/html, generateHTML) + Shiki pour les codeBlock
                                   4. nettoyer (sanitize-html, liste blanche)
                                   5. calculer word_count, temps de lecture, sommaire (h2-h4)
                                   6. enregistrer une nouvelle version (10 conservées, RG-13)
```

## Schéma autorisé (F-30 à F-39)

Nœuds : `doc`, `paragraph`, `heading` (niveaux 2 à 4 seulement), `bulletList`, `orderedList`, `listItem`, `taskList`, `taskItem`, `blockquote`, `horizontalRule`, `table` (+ `tableRow`, `tableHeader`, `tableCell`), `image`, `codeBlock`, `callout`, `mediaEmbed`, `mathBlock` (option C), `hardBreak`.
Marques : `bold`, `italic`, `underline`, `strike`, `code`, `link`, `highlight` (couleurs de la liste blanche).

Tout nœud ou attribut hors schéma → rejet `422 CONTENT_INVALID` avec le chemin fautif. Limites : 2 Mo de JSON, 500 blocs, 200 lignes par bloc de code.

### Attributs contrôlés

| Nœud | Attributs | Contrôle |
| --- | --- | --- |
| `image` | `mediaId`, `alt`, `caption` | `mediaId` = média IMAGE du formateur ; **pas** d'URL libre ; `alt` obligatoire à la publication |
| `codeBlock` | `language`, `filename?`, `highlightLines?` (ex. `"2,4-6"`), `showLineNumbers` | `language` dans la liste blanche ; `filename` ≤ 80 caractères, sans `/..` |
| `callout` | `variant` ∈ `info`, `tip`, `warning`, `important` | icônes : voir skill UI |
| `mediaEmbed` | `mediaId`, `kind` ∈ `video`, `pdf` | média READY du formateur |
| `link` | `href` | `http(s)` ou `mailto` seulement ; liens internes relatifs autorisés |

Langages : `javascript`, `typescript`, `python`, `php`, `java`, `c`, `cpp`, `csharp`, `sql`, `html`, `css`, `bash`, `json`, `yaml`, `dart`, `kotlin`, `plaintext`.

## Blocs de code (F-33)

- **Shiki** côté serveur avec le thème personnalisé `doztra-forest` (couleurs dans `doztra-learn-ui/references/theme.css`) ; initialiser un seul `highlighter` (singleton paresseux conservé sur `globalThis`, module `server-only`) avec les langages de la liste blanche ; Shiki ne doit jamais se retrouver dans un bundle client.
- Gabarit rendu (conforme au prototype) : en-tête `bg-forest` avec `fa-solid fa-code`, nom de fichier en mono, badge du langage (or sur or 18 %), bouton « Copier » (`fa-regular fa-copy` → `fa-solid fa-check` « Copié ») ; corps `bg-code-bg`, `font-mono text-sm leading-[1.75]`, défilement horizontal, numéros de ligne non sélectionnables (`select-none`), lignes mises en évidence avec bordure gauche or 3 px.
- Le bouton Copier copie le **texte source** (attribut `data-code` encodé ou nœud `<pre hidden>`), pas le HTML coloré.
- Code en ligne : `font-mono bg-inline-code px-1.5 py-0.5 rounded-[6px]`.
- Côté apprenant, le HTML stocké est inséré par un Server Component (`<div className="dzl-content" dangerouslySetInnerHTML={{ __html: contentHtml }} />`, seule utilisation autorisée de `dangerouslySetInnerHTML`). Les comportements (Copier, lightbox) sont branchés par un petit Client Component qui écoute les clics sur ce conteneur (délégation d'événements), sans réécrire le HTML.
- CSP : la sortie Shiki par défaut utilise des attributs `style` (interdits par la CSP sans `'unsafe-inline'`). Générer des classes (transformateur Shiki qui remplace les couleurs par `dzl-tok-*`, feuille de style du thème dans `globals.css`) plutôt que d'assouplir la CSP.
- Le texte du code est échappé par Shiki ; ne jamais réinjecter le code brut dans un attribut sans échappement.

## Images et captures d'écran (F-34)

- Glisser-déposer, sélecteur de fichier **et** collage `Ctrl+V` : l'éditeur intercepte `paste`, extrait le `File` de `clipboardData`, l'envoie par URL présignée obtenue de `POST /api/v1/media/uploads` (kind `IMAGE`), insère un nœud `image` en état « chargement » puis le `mediaId` définitif.
- Côté serveur : vérification du type réel, ré-encodage `sharp` en WebP (+ JPEG de repli), largeur max 1600 px, variantes 480/960/1600 pour `srcset`, suppression des métadonnées.
- Rendu : `<figure>` + `<img loading="lazy" decoding="async" srcset sizes alt>` + `<figcaption>` ; clic → lightbox (Client Component) accessible au clavier, fermeture `Échap`.

## Nettoyage HTML

`sanitize-html` avec liste blanche explicite :
- balises : `p h2 h3 h4 ul ol li blockquote hr table thead tbody tr th td figure figcaption img pre code span strong em u s mark a br div button input(type=checkbox, disabled)` ;
- attributs : `class` (préfixes autorisés `dzl-`, `shiki`, `line`, classes Tailwind générées par nos gabarits de rendu serveur), `href`, `rel`, `target`, `src`/`srcset`/`sizes` (uniquement l'origine du CDN), `alt`, `loading`, `decoding`, `data-code`, `data-line`, `aria-*` ;
- `style` : aucun (les couleurs Shiki passent par des classes `dzl-tok-*`, voir « Blocs de code ») ;
- aucun gestionnaire `on*`, aucun `javascript:`, aucun `iframe` (les vidéos passent par `mediaEmbed` rendu en composant interne).

Un test de non-régression XSS charge des charges utiles connues (OWASP XSS cheat sheet) dans chaque type de nœud et vérifie qu'elles ressortent inertes.

## Autres fonctions

- **Sommaire et temps de lecture** (F-39) : extraits des `heading`, ancres `id` générées (slug + suffixe unique).
- **Import Markdown** (F-38) : `markdown-it` → HTML → `generateJSON` Tiptap → même validation de schéma ; images distantes non importées (signalées au formateur).
- **Historique** (F-26) : 10 versions, restauration = nouvelle version copiée de l'ancienne.
- **Brouillon automatique** (F-22) : Server Action débouncée toutes les 10 s avec numéro de version attendu ; conflit → retour `{ ok: false, code: 'VERSION_CONFLICT' }` et proposition de rechargement.
- **Questions/réponses** : même pipeline avec un schéma réduit (`paragraph`, `codeBlock`, `code`, `bold`, `italic`, `link`, `image`, listes).
