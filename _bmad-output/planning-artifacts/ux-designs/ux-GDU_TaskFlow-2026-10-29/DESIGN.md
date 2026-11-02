---
name: TaskFlow Mobile
description: Interface mobile de travail calme et lisible pour organiser les projets, les tâches et le savoir partagé d'une équipe.
status: draft
sources:
  - ../../prds/prd-GDU_TaskFlow-2026-10-27/prd.md
  - ../../prds/prd-GDU_TaskFlow-2026-10-27/addendum.md
updated: 2026-10-29
colors:
  primary: '#2457A7'
  primary-pressed: '#194481'
  on-primary: '#FFFFFF'
  accent: '#087F83'
  on-accent: '#FFFFFF'
  surface: '#F6F8FB'
  surface-raised: '#FFFFFF'
  surface-subtle: '#EAF0F7'
  ink: '#182334'
  ink-muted: '#58677A'
  border: '#D9E1EA'
  success: '#26734D'
  warning: '#9A5A00'
  danger: '#B33C43'
  focus: '#1769AA'
  primary-dark: '#8CB7FF'
  primary-pressed-dark: '#A8C9FF'
  on-primary-dark: '#10213C'
  accent-dark: '#61D2CD'
  on-accent-dark: '#062C2D'
  surface-dark: '#111923'
  surface-raised-dark: '#1B2735'
  surface-subtle-dark: '#263548'
  ink-dark: '#EDF3FA'
  ink-muted-dark: '#B0BECE'
  border-dark: '#39495B'
  success-dark: '#78D6A3'
  warning-dark: '#FFC66F'
  danger-dark: '#FF9A9F'
  focus-dark: '#8CB7FF'
typography:
  title:
    note: 'Style natif : titre de page iOS / Android, poids demi-gras'
  heading:
    note: 'Style natif : titre secondaire iOS / Android, poids demi-gras'
  body:
    note: 'Style natif : texte courant iOS / Android, taille adaptable'
  label:
    note: 'Style natif : libellé de commande iOS / Android, poids moyen'
  meta:
    note: 'Style natif : texte secondaire iOS / Android, jamais sous 12 pt sans raison'
rounded:
  sm: 8px
  md: 12px
  lg: 18px
  xl: 24px
  full: 9999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 24px
  '6': 32px
  page-gutter-phone: 16px
  page-gutter-tablet: 28px
components:
  button-primary:
    background: '{colors.primary}'
    foreground: '{colors.on-primary}'
    radius: '{rounded.md}'
    minimum-height: 48px
  button-secondary:
    background: '{colors.surface-subtle}'
    foreground: '{colors.ink}'
    radius: '{rounded.md}'
    minimum-height: 48px
  input:
    background: '{colors.surface-raised}'
    foreground: '{colors.ink}'
    border: '{colors.border}'
    radius: '{rounded.md}'
    minimum-height: 48px
  card:
    background: '{colors.surface-raised}'
    foreground: '{colors.ink}'
    border: '{colors.border}'
    radius: '{rounded.lg}'
  status-active:
    foreground: '{colors.success}'
  status-progress:
    foreground: '{colors.primary}'
  status-late:
    foreground: '{colors.danger}'
---

## Brand & Style

TaskFlow est un outil d'équipe posé et pratique. Son interface aide à répondre rapidement à trois questions : où en est le projet, qu'est-ce que je dois faire, et où trouver l'information partagée ? Elle met les libellés et les chiffres avant la décoration. Le bleu indique les actions et la navigation active ; le turquoise souligne l'aide et les repères de collaboration. Le thème suit le réglage clair ou sombre du téléphone.

## Colors

- Le **bleu principal** (`{colors.primary}`) sert aux actions principales, liens et sélection de navigation. Il indique une commande disponible, pas un état de tâche.
- Le **turquoise** (`{colors.accent}`) sert aux repères d'assistant et aux informations secondaires de collaboration. Il complète le bleu sans remplacer les libellés.
- Les surfaces claires et sombres séparent le fond du contenu. Les cartes utilisent une surface distincte et une bordure légère, plutôt qu'une ombre lourde.
- Le vert, l'ambre et le rouge indiquent respectivement réussite/en cours d'achèvement, attention/retard et erreur/annulation. Chaque état garde son texte explicite : la couleur seule n'est jamais suffisante.
- En mode sombre, utiliser les tokens `*-dark` correspondants ; garder les mêmes significations et la même hiérarchie.

## Typography

Utiliser la typographie système iOS ou Android. Cela évite de charger une police et suit les préférences de lecture du téléphone. Titres de page courts et visibles ; le corps de texte reste confortable ; les dates, métadonnées et aides sont secondaires sans devenir minuscules. Respecter l'agrandissement du texte du système et permettre aux libellés de passer sur plusieurs lignes.

## Layout & Spacing

Sur téléphone, une colonne avec marges latérales `{spacing.page-gutter-phone}`. Une barre d'onglets en haut donne accès à Accueil, Projets, Mes tâches et Assistant. Les actions propres à une page restent dans son en-tête ou près du contenu concerné. Sur tablette, utiliser la largeur supplémentaire pour afficher un panneau de synthèse à côté de la liste ; ne pas étirer les textes sur toute la largeur. Espacements basés sur une unité de 4 px, avec des intervalles plus larges entre les groupes.

## Elevation & Depth

La hiérarchie vient des surfaces et de l'espacement. Une ombre discrète peut distinguer une feuille ou une boîte de dialogue du contenu dessous ; les cartes ordinaires utilisent une bordure et un fond. Ne pas empiler des panneaux flottants.

## Shapes

Les contrôles ont des coins moyens (`{rounded.md}`) ; les cartes ont des coins plus doux (`{rounded.lg}`). Les pastilles de statut peuvent être arrondies, mais elles conservent un libellé. Les zones tactiles restent larges, carrées ou rectangulaires.

## Components

- **Bouton principal** : fond bleu, texte blanc, libellé avec verbe (« Créer le projet », « Enregistrer »). Une seule action principale dominante par zone. Hauteur minimale 48 px.
- **Bouton secondaire** : fond discret ou contour. Annuler et retour ne prennent jamais le même poids visuel que l'action principale.
- **Bouton destructif** : rouge, avec nom de l'objet et confirmation pour une annulation ou suppression. Expliquer l'effet avant validation.
- **Champ de formulaire** : libellé toujours visible au-dessus, exemple ou aide facultative en dessous ; erreur sous le champ et correction attendue expliquée en mots.
- **Carte de projet** : nom, statut, progression, date utile et nombre de tâches. Toucher ouvre le détail.
- **Ligne de tâche** : titre, statut, échéance, priorité et personne assignée. Le membre ne voit une commande de changement de statut que pour une tâche qui lui est attribuée ; le propriétaire/admin dispose des commandes de gestion.
- **Indicateur de statut** : texte accompagné d'une couleur, forme ou icône accessible ; distinguer créé, en cours, terminé, annulé et en retard.
- **Barre d'onglets supérieure** : quatre destinations principales, placées sous l'en-tête de l'application. L'onglet actif est annoncé comme sélectionné par le lecteur d'écran. Garder les quatre libellés visibles sur téléphone.
- **Sources de l'assistant** : cartes compactes montrant le nom de la source, un extrait et, si disponible, un lien ouvrable.
- **Commentaires** : auteur, date et texte dans l'ordre de lecture ; les commandes modifier/supprimer sont accessibles selon les droits.

## Do's and Don'ts

| À faire | À éviter |
|---|---|
| Associer couleur et texte pour exprimer les états. | Coder un statut uniquement par la couleur. |
| Montrer la date de dernière actualisation près des données qui peuvent être périmées. | Donner l'impression que les changements apparaissent en temps réel. |
| Garder les actions cohérentes avec le rôle et l'état du projet. | Montrer une commande que le rôle ne peut pas utiliser. |
| Employer des phrases françaises directes et des verbes d'action. | Jargon, formulations vagues ou tonalité culpabilisante. |
| Respecter les commandes système et l'agrandissement de texte. | Petites cibles tactiles, texte tronqué ou animations nécessaires pour comprendre. |

## Hypothèses à confirmer

- [ASSUMPTION] Aucun logo existant n'est fourni ; le nom TaskFlow sert de repère de marque dans les maquettes.
- [ASSUMPTION] Profil, préférences et gestion des comptes restent dans une zone secondaire accessible depuis l'en-tête ou un menu.
