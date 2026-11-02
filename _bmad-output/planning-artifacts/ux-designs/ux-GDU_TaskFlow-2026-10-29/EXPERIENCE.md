---
title: TaskFlow Mobile — Expérience
status: draft
sources:
  - ../../prds/prd-GDU_TaskFlow-2026-10-27/prd.md
  - ../../prds/prd-GDU_TaskFlow-2026-10-27/addendum.md
updated: 2026-10-29
---

# TaskFlow Mobile — contrat d'expérience

Ce document décrit le comportement, les écrans et les parcours. Les couleurs, formes, tailles et styles visuels de référence sont définis dans [DESIGN.md](DESIGN.md). En cas de différence, les règles écrites dans ces deux documents priment sur les maquettes.

## Foundation

Application native mobile React Native pour iOS et Android, téléphone et tablette. L'interface et les réponses de l'assistant sont en français. Le thème clair ou sombre suit le réglage de l'appareil. Une connexion Internet est nécessaire. Dans le MVP, une liste ou un tableau de bord ne se met à jour que lorsque la personne lance « Actualiser » ou tire la liste vers le bas ; afficher la date/heure de dernière actualisation lorsque cela aide à comprendre la fraîcheur.

Les maquettes statiques illustrent les décisions de présentation, pas des interactions fonctionnelles : [Tableau de bord](mockups/tableau-de-bord.html), [Projet et tâches](mockups/projet-taches.html), [Assistant et sources](mockups/assistant-sources.html).

## Information Architecture

| Écran | Accès | Fonction | Accès selon le rôle |
|---|---|---|---|
| Connexion / mot de passe oublié | Ouverture ou session expirée | Connexion e-mail/mot de passe et demande d'un lien de réinitialisation | Tous les comptes actifs |
| Accueil / tableau de bord | Onglet Accueil | Progression globale, progression personnelle, compteurs par statut, retards et actualisation | Membres de projet et administrateur ; synthèse sur les projets visibles |
| Projets | Onglet Projets | Liste des projets visibles, recherche/filtre si nécessaire, actualisation | Membre : projets auxquels il appartient ; propriétaire : projets possédés ; administrateur : tous |
| Détail du projet | Carte ou résultat de projet | Informations, membres, tâches, filtres, commentaires, progression | Les droits d'édition suivent le rôle et l'état du projet |
| Mes tâches | Onglet Mes tâches | Tâches attribuées à la personne, tri et filtres, changement de statut permis | Tous les membres ; l'administrateur voit sa propre liste comme membre s'il a des tâches |
| Assistant du projet | Onglet Assistant depuis un projet | Questions-réponses sur les connaissances du projet sélectionné et sources | Uniquement les membres actifs du projet et l'administrateur |
| Création / modification projet ou tâche | Bouton d'action depuis une liste/détail | Formulaire contextualisé avec champs requis, erreurs et confirmation | Propriétaire/admin selon règles du PRD ; membre peut seulement changer le statut d'une tâche assignée |
| Membres du projet | Détail du projet | Voir, ajouter ou retirer un compte existant actif | Propriétaire/admin |
| Profil et administration des comptes | Menu secondaire | Modifier profil ; administrateur : invitations, désactivation/réactivation et gestion des comptes | Profil : tous ; administration : administrateur |

La navigation principale est une barre d'onglets en haut de l'écran : Accueil, Projets, Mes tâches, Assistant. Elle reste visible sur les écrans principaux et conserve le contexte du projet lorsque l'Assistant est ouvert depuis son détail. Sur tablette, le détail peut se placer à côté de la liste. Les règles d'accès, l'ordre de lecture et les actions demeurent identiques.

## Voice and Tone

Utiliser une voix concise, calme, non technique et orientée vers l'étape suivante.

| Situation | Texte proposé |
|---|---|
| Vide, aucun projet | « Aucun projet pour le moment. » puis, si le rôle le permet, « Créer un projet » |
| Vide, tâche | « Aucune tâche ne correspond à ces filtres. » / « Vous n’avez pas de tâche attribuée. » |
| Actualisation réussie | « Mis à jour à 14:32. » |
| Échec réseau | « Impossible de récupérer les données. Vérifiez votre connexion, puis réessayez. » |
| Accès retiré / interdit | « Vous n’avez plus accès à ce projet. » sans révéler son contenu |
| Assistant sans réponse | « Je n’ai pas trouvé cette information dans les sources de ce projet. » |
| Envoi de question | « Recherche dans les sources du projet… » |

Éviter de blâmer la personne (« Vous avez oublié… »), de promettre un envoi en arrière-plan ou de laisser croire que l'assistant sait au-delà des sources récupérées.

## Component Patterns

| Élément | Comportement |
|---|---|
| Onglets principaux | Placés en haut de l'écran sous l'en-tête de l'application. Ouvrent Accueil, Projets, Mes tâches ou Assistant. Garder le contexte du projet lorsque l'Assistant est ouvert depuis son détail. |
| Actualiser | Bouton explicite dans la barre de page et geste tirer-vers-le-bas sur les listes compatibles. Désactiver ou dédupliquer pendant une requête active. Afficher la date de succès précédente et la mettre à jour seulement après réussite. |
| Carte de projet | Ouvre le projet. Statut, progression et dates sont lisibles sans ouvrir le détail. Les projets annulés restent masqués aux membres qui n'ont pas le droit de les voir. |
| Ligne de tâche | Ouvre le détail/commentaires. Seul le membre assigné peut changer le statut ; seul propriétaire/admin peut modifier les autres champs et gérer annulation/réactivation. Projet clôturé : champs en lecture seule pour les membres, commentaires permis. |
| Filtres et tri | Filtres cumulables par statut, priorité, membre, tag et échéance. Indiquer combien de filtres sont actifs ; action « Effacer les filtres ». La liste vide après filtre n'est pas une erreur. |
| Formulaire | Valider les champs avant envoi, signaler l'erreur au champ concerné, conserver les autres champs saisis. Pendant l'envoi, empêcher les doubles soumissions. Après succès, fermer ou afficher le résultat enregistré et rafraîchir les données concernées. |
| Commentaire | Composer et envoyer explicitement. Conserver le texte en cas d'erreur ; afficher auteur/date. Modifier/supprimer uniquement si auteur ou propriétaire/admin. |
| Assistant et citation | Chaque réponse affiche les extraits utilisés. Un lien n'est proposé que si la source fournit une destination ouvrable. Aucun contenu pertinent : annoncer l'absence et proposer de reformuler. |
| Annulation/suppression | Résumer l'objet et l'effet, demander confirmation pour une action destructive. La suppression physique est proposée seulement pour la tâche créée, jamais commencée et sans commentaire. Sinon, le propriétaire/admin peut l'annuler. |

## State Patterns

Toutes les vues principales prennent en charge les états ci-dessous. L'interface distingue une absence normale de contenu d'une erreur réseau ou de droits.

| État | Traitement |
|---|---|
| Chargement initial | Conserver la structure de la page, afficher une indication de chargement annoncée aux lecteurs d'écran. Éviter les chiffres ou faux contenus présentés comme chargés. |
| Actualisation | Garder la liste visible, indiquer « Actualisation… » et empêcher une seconde requête identique. Ne pas vider l'écran. |
| Vide général | Expliquer qu'aucun contenu n'existe encore ; proposer une action seulement si le rôle a le droit de la faire. |
| Vide filtré | « Aucune tâche ne correspond à ces filtres. » Permettre d'effacer les filtres. |
| Erreur réseau | Garder les dernières données en mémoire si disponibles, les marquer comme anciennes, expliquer que l'actualisation a échoué et proposer « Réessayer ». Pas de promesse hors ligne. |
| Erreur de formulaire | Message au champ concerné, explication concrète et focus déplacé au premier champ invalide. Ne pas envoyer tant que l'erreur persiste. |
| Erreur de droits | Message neutre sans nom ni détail du contenu protégé ; retirer immédiatement le contenu de la vue si l'accès vient d'être révoqué. |
| Succès / complet | Confirmer la création ou mise à jour par un message bref ; afficher les nouvelles données après l'action. Après mise à jour du statut de tâche, indiquer le nouveau statut et permettre l'actualisation du tableau de bord. |
| Session expirée | Interrompre l'accès protégé, afficher la connexion et reprendre le parcours après authentification si cela reste sûr. |
| Assistant en recherche | Afficher « Recherche dans les sources du projet… » et empêcher les envois accidentels multiples. |
| Assistant sans source pertinente | Réponse explicite d'incertitude sans réponse inventée ; laisser reformuler ou poser une autre question. |
| Assistant en erreur | Conserver la question, décrire l'échec et permettre une nouvelle tentative. |

## Interaction Primitives

- Toucher une ligne ou carte ouvre son détail ; les boutons internes gardent leurs actions propres et ne déclenchent pas l'ouverture par erreur.
- Utiliser les composants de navigation et retours natifs de la plateforme. Éviter les gestes cachés comme seule façon d'accéder à une action.
- Tirer vers le bas actualise les vues de liste ; le bouton « Actualiser » fournit la même action visible et nommée.
- Après une action, refléter les données serveur confirmées. En cas de refus d'autorisation ou d'échec réseau, rétablir l'état confirmé et expliquer comment réessayer.
- Confirmer les actions irréversibles ou qui changent fortement la visibilité : annulation de projet, retrait de membre, suppression autorisée.
- Un membre peut aller de « Créée » à « Terminée » directement, ou remettre une tâche terminée « En cours ». Les changements de statut autorisés suivent les règles métier ; les champs d'une tâche terminée sont verrouillés jusqu'à son retour « En cours ».
- Ne pas afficher de commande qui laisse penser qu'une mise à jour est en temps réel. L'utilisateur actualise explicitement pour voir les modifications faites par les autres.

## Accessibility Floor

- Toutes les commandes, champs, états de sélection et erreurs ont un nom compréhensible avec VoiceOver et TalkBack ; l'ordre de lecture suit la hiérarchie visuelle.
- Contraste lisible en thèmes clair et sombre. Les statuts sont annoncés en texte, pas uniquement par une couleur ou une icône.
- Respecter la taille de texte système ; les contenus et boutons peuvent grandir sans perdre l'action principale ou couper un statut.
- Cibles tactiles d'au moins 44 pt sur iOS et 48 dp sur Android. Espacer les commandes destructives des actions ordinaires.
- Donner un retour à la réussite, au chargement, à l'erreur, au résultat vide et à la recherche de l'assistant, sans dépendre d'une animation.
- Respecter l'option Réduire les animations. Le mouvement n'est jamais requis pour comprendre une mise à jour.

## Key Flows

### 1. Créer un projet et répartir les premières tâches — Samira, propriétaire

1. Samira ouvre TaskFlow et arrive sur le tableau de bord avec les projets qu'elle possède, les chiffres disponibles et l'heure de la dernière actualisation.
2. Elle touche « Créer un projet ». Le formulaire demande les informations prévues par le PRD ; la date de début est préremplie et peut être modifiée.
3. Elle enregistre. Une confirmation annonce la création et ouvre le nouveau projet.
4. Depuis le projet, elle crée ses deux premières tâches, saisit chaque titre et échéance obligatoires, puis précise priorité, description, tag et personne assignée si utile.
5. Le formulaire signale les champs manquants au bon endroit et garde ce qui est déjà saisi. À la réussite, les tâches apparaissent dans la liste.
6. **Moment clé :** Samira voit les deux tâches dans le contexte du projet, avec leur échéance, leur statut et leur personne assignée ; le résumé de progression donne un point de départ compréhensible.

Si une requête échoue, garder les champs saisis, annoncer l'erreur et proposer de réessayer. Si une personne assignable n'est plus active/membre, ne pas l'enregistrer comme responsable et demander une nouvelle sélection.

### 2. Mettre à jour ma tâche — Noé, membre

1. Noé ouvre « Mes tâches » et voit ses affectations et échéances connues au dernier chargement.
2. Il ouvre une tâche assignée à lui. Il peut lire le projet, les commentaires et le détail, mais pas éditer titre, priorité ou affectation.
3. Il choisit « En cours » ou « Terminée » selon le travail. Le nouveau statut est confirmé par le serveur.
4. Il revient à l'accueil et touche « Actualiser » (ou tire vers le bas) pour actualiser le tableau de bord.
5. **Moment clé :** son progrès personnel et la progression du projet reflètent le statut confirmé, avec une heure d'actualisation récente.

Une tâche non assignée à Noé ne présente pas la commande de changement de statut. En cas de refus ou d'échec, restaurer le statut précédent, l'expliquer et permettre une nouvelle tentative.

### 3. Retrouver une information du projet — Léa, membre

1. Léa ouvre un projet auquel elle appartient, puis son onglet Assistant.
2. Elle pose une question sur les notes fictives déjà chargées dans ce projet de démonstration.
3. L'écran montre que les sources sont recherchées, puis présente une réponse concise.
4. La réponse est suivie du nom de la source, d'un extrait pertinent et d'un lien ouvrable si disponible.
5. **Moment clé :** Léa peut vérifier la réponse dans la source et ouvrir cette référence sans quitter le contexte par surprise.

Si les sources ne permettent pas de répondre, l'assistant le dit clairement et invite à reformuler. Si la requête échoue, garder le texte de la question. Si Léa perd son appartenance pendant le parcours, retirer la réponse et ses sources et annoncer qu'elle n'a plus accès au projet.

## Hypothèses et points à confirmer

- [ASSUMPTION] Les trois maquettes demandées représentent les surfaces les plus utiles pour la démonstration du PRD ; elles peuvent être remplacées si vous préférez d'autres écrans.
- [ASSUMPTION] Le contenu de démonstration des maquettes (noms, projet, tâche et source) est fictif.
- [ASSUMPTION] Le PRD décrit les rôles et leurs droits ; les emplacements précis des commandes de compte et préférences ne sont pas tranchés. Ils sont placés dans une zone secondaire jusqu'à la décision d'architecture/implémentation.
