---
name: doztra-learn-media-pipeline
description: Utiliser pour implémenter ou relire l'upload et le traitement des médias de Doztra-Learn — upload reprenable de vidéos (2 Go) et PDF, stockage S3 privé, worker BullMQ, transcodage FFmpeg en HLS, miniatures, sous-titres, visionneuse PDF, URL signées et purge.
---

# Doztra-Learn — pipeline médias

## Vue d'ensemble

```
Navigateur ──(1) POST /api/v1/media/uploads──▶ media.service : crée media(UPLOADING), renvoie URL(s) présignée(s) multipart
          ──(2) PUT parties ─────────▶ S3 privé : raw/<mediaId>/source (directement, sans passer par Next.js)
          ──(3) POST /api/v1/media/uploads/[id]/complete ▶ vérifie taille + magic bytes → QUEUED → job BullMQ
Worker ────(4) télécharge source → FFmpeg/pdftoppm → écrit les sorties dans S3 → READY | FAILED
Studio ────(5) Client Component interroge GET /api/v1/media/[id]/status toutes les 3 s
```

- Les fichiers ne transitent **jamais** par une Server Action ni par le corps d'un Route Handler (limites de taille, mémoire, délai) : uniquement des URL présignées vers S3.
- Les Route Handlers `/api/v1/media/**` sont dynamiques (lecture de session) et appellent `requireRole('OWNER')` (ou `assertCanAccessLesson` pour la lecture) ; jamais de `'use cache'`.
- Le traitement (FFmpeg, pdftoppm, sharp en lot) tourne uniquement dans le processus `worker/`, jamais dans Next.js.

## Upload (F-40, F-50, F-54)

- Multipart S3 présigné (parties de 10 Mo, 4 en parallèle) ou tus ; reprise après coupure réseau obligatoire (stocker `uploadId` et parties envoyées côté navigateur).
- Limites RG-21 vérifiées avant (taille annoncée) et après (`HeadObject`). Types acceptés : vidéo `mp4, mov, webm, mkv` ; PDF ; images `jpg, png, webp` ; ressources `zip, pdf, pptx, docx, xlsx, png, jpg`, code source en texte.
- Vérification magic bytes en lisant les 4 100 premiers octets (`file-type`). Échec → `FAILED` + suppression de l'objet.
- Uploads incomplets abandonnés : règle de cycle de vie S3 `AbortIncompleteMultipartUpload` à 1 jour.

## Transcodage vidéo (F-41, F-43, F-48)

- Job `video-transcode`, `jobId = transcode:<mediaId>`, concurrence 1 par worker (CPU), délai max 2 h.
- `ffprobe` d'abord : durée, résolution, présence d'un flux audio ; refuser durée > 4 h ou flux illisible.
- Échelle HLS (ne jamais agrandir la source) :

| Variante | Résolution | Débit vidéo | Audio |
| --- | --- | --- | --- |
| 360p | 640×360 | 800 kb/s | 96 kb/s AAC |
| 720p | 1280×720 | 2 500 kb/s | 128 kb/s AAC |
| 1080p | 1920×1080 | 5 000 kb/s | 128 kb/s AAC |

- H.264 `-preset veryfast -profile:v main`, GOP 2 s (`-g` = 2 × fps, `-sc_threshold 0`), segments de 6 s, `master.m3u8` + une playlist par variante, sortie `hls/<mediaId>/`.
- Progression : lire `-progress pipe:1`, publier `progress_percent` (en base toutes les 5 %).
- Appel par `spawn('ffmpeg', args)` avec tableau d'arguments ; `-protocol_whitelist file,crypto` ; répertoire temporaire unique supprimé dans `finally`.
- Échec : `FAILED` + `error_message` lisible par le formateur (« Format vidéo non pris en charge »), détail technique dans les logs ; bouton Relancer → nouveau job.
- Fin : `video_assets.duration_seconds`, `renditions`, puis recalcul de la durée du cours (RG-15). Source brute conservée 30 jours puis purgée (réglage).

## Miniatures (F-42)

- Trois propositions extraites à 10 %, 50 %, 90 % de la durée (`-ss` avant `-i`, une image), redimensionnées 1280×720 en WebP (+ JPEG), `source = AUTO`.
- Miniature personnalisée : image importée (JPG/PNG/WEBP), ré-encodée par `sharp` en 1280×720 (recadrage centré), `source = CUSTOM`.
- Exactement une miniature `is_selected` par vidéo (index unique partiel). Une vidéo sans miniature sélectionnée n'est pas publiable (RG-11).
- Écran studio (prototype `video`) : barre de progression d'upload (Client Component), statut du traitement (interrogation périodique arrêtée à `READY`/`FAILED`), grille des 3 propositions + « Importer une miniature ».

## Sous-titres (F-45)

Import WebVTT uniquement, validé (en-tête `WEBVTT`, horodatages cohérents), 1 Mo max, servi via URL signée ; langue indiquée (`fr` par défaut).

## Lecture (F-44, F-47)

- `GET /api/v1/lessons/[id]/playback` (Route Handler dynamique, `Cache-Control: private, no-store`) → `assertCanAccessLesson` → URL signée de `master.m3u8` (et des segments via cookies signés CDN ou réécriture de playlist présignée), durée 2 h.
- Lecteur Video.js + hls.js dans un Client Component chargé par `next/dynamic` (`ssr: false`) : qualité auto/manuelle, vitesses 0,5–2×, plein écran, raccourcis clavier, reprise à `last_position_seconds`, envoi de la position toutes les 15 s et à `pause`/`visibilitychange` (`navigator.sendBeacon`).
- Filigrane (option S) : e-mail de l'apprenant en surimpression CSS semi-transparente, position changeante.

## PDF (F-51 à F-53, F-55)

- Job `pdf-process` : `qpdf --check` (rejet des PDF corrompus), nombre de pages, miniature de la page 1 (`pdftoppm -png -r 72 -f 1 -l 1` puis `sharp` WebP), délai max 2 min.
- Visionneuse PDF.js (Client Component chargé par `next/dynamic`, `ssr: false`) chargeant le fichier par URL signée 5 min ; `allow_download = false` → pas de bouton de téléchargement et `Content-Disposition: inline` (protection dissuasive seulement : le dire au formateur dans l'interface).
- Extraction de texte (F-55, option C) : `pdftotext`, convertie en paragraphes Tiptap à relire.

## Stockage

- Bucket privé unique, préfixes : `raw/`, `hls/`, `img/`, `pdf/`, `res/`, `thumb/`, `cert/`, `trash/`.
- Corbeille RG-22 : `deleted_at` en base ; job quotidien `storage-purge` supprime les objets dont `deleted_at` > 30 jours.
- Calcul du stockage utilisé (somme `size_bytes` des médias non purgés) pour le tableau de bord et l'alerte à 80 %.

## Tests

- Petits fichiers d'essai dans `tests/fixtures/media` (vidéo 5 s, PDF 3 pages, image, faux MP4 renommé).
- Test d'intégration du worker avec MinIO et FFmpeg réels en CI (image Docker du worker).
- Cas obligatoires : fichier au mauvais type, taille dépassée, vidéo sans audio, source 480p (pas de 720p/1080p générés), relance après échec, accès non inscrit refusé à la signature.
