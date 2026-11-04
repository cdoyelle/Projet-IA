# Validation de l’architecture — TaskFlow Mobile

Date : 4 novembre 2026  
Documents examinés : `ARCHITECTURE-SPINE.md`, PRD et addendum du 27 octobre, `EXPERIENCE.md`, `DESIGN.md`.  
Verdict initial : **base cohérente, validation conditionnelle**. Le commanditaire a validé les corrections le 4 novembre 2026; elles ont été intégrées dans `ARCHITECTURE-SPINE.md`, relintées, puis examinées par les revues indépendantes de suivi. Le spine est maintenant final. Les rapports sont conservés dans `reviews/`.

## En langage simple

L’architecture choisit une application mobile Expo pour iPhone/iPad et Android, avec Supabase pour les comptes et les données, et Gemini appelé depuis le serveur pour l’assistant. Les accès sont contrôlés dans la base, et les règles de statut des tâches sont vérifiées au moment de l’enregistrement. C’est une base cohérente avec le PRD.

Avant de la valider, il faut rendre visibles quelques raccords importants : comment les deux colonnes du tableau de bord sont calculées, comment l’application mobile et le serveur se mettent d’accord sur les réponses, comment on représente une personne retirée/désactivée qui avait des tâches, et où se trouvent les livrables de tests manuels et le journal de réalisation. Le schéma illustré ne montre pas non plus les tags ni le lien des commentaires vers un projet ou une tâche.

## Couverture des fonctionnalités du PRD

| Exigences | Composants prévus | État |
|---|---|---|
| FR-001–004, FR-033–035 — connexion, invitations, profil, réinitialisation et administration des comptes | Supabase Auth, profils, stockage d’avatar éventuel, fonction serveur admin, RLS | Partiel : briques présentes mais l’architecture ne dit pas clairement qui gère activation, profil/avatar et chaque écran admin. |
| FR-005–011 — projets, cycle de vie, membres | Tables projets/appartenances, écrans Expo, règles RLS et cycle de vie | Couvert dans l’ensemble. Préciser la frontière d’écriture pour clôture, annulation, réactivation et retrait/ajout de membres. |
| FR-012–020 — tâches, filtres, commentaires, affectations | PostgreSQL, fonction transactionnelle de tâche, écrans Expo, règles de droits | Couvert dans l’ensemble. Tags et rattachement des commentaires manquent au schéma illustré; représentation des comptes inactifs/retirés à clarifier. |
| FR-021–024 — tableau de bord et progression | Lectures/vues PostgreSQL, écran Accueil, AD-3/AD-7 | Partiel : centraliser la formule exacte du PRD afin que toutes les vues donnent les mêmes résultats. |
| FR-025–032 — assistant, recherche et citations | Fonction Edge, Gemini, pgvector, sources/passages isolés par projet | Couvert. Il reste à fixer le format commun entre l’écran et la fonction serveur, et la forme stable d’une source/citation. |
| FR-036–039 — formulaires, états, accessibilité et build installable | Expo, navigation et états d’interface partagés, EAS | Couvert au niveau de l’architecture. Garder les exigences françaises, tablette, clair/sombre et accessibilité lors de la réalisation. |
| FR-040–041 — tests manuels et journal de réalisation | Aucun emplacement/porteur nommé dans la carte actuelle | Non représenté. Ajouter un point de rattachement et nommer leur emplacement convenu. |

## Couverture des écrans UX

Les écrans identifiés dans `EXPERIENCE.md` ont tous une destination plausible dans les briques décrites, mais plusieurs ne sont regroupés que sous « écrans de projet » ou « comptes ». Le tableau d’architecture devrait les nommer pour qu’on puisse vérifier leur propriétaire sans interprétation.

| Écran UX | Brique attendue | État actuel |
|---|---|---|
| Connexion / mot de passe oublié | Supabase Auth + écran Expo | Implicite dans « comptes » |
| Accueil / tableau de bord | Vue/calculs PostgreSQL + écran Expo | Présent, calculs précis à centraliser |
| Projets | Projets/RLS + écran Expo | Couvert |
| Détail du projet | Projet, membres, tâches et commentaires + écran Expo | Couvert en bloc |
| Mes tâches | Affectations/statuts + écran Expo | Couvert en bloc |
| Assistant du projet | Fonction Edge, pgvector/Gemini et citations + écran Expo | Couvert, contrat mobile/serveur à préciser |
| Création/modification projet ou tâche | Formulaires Expo + limites d’écriture serveur/base | Présent en bloc; formulaires non nommés |
| Membres du projet | Appartenances/RLS + écran Expo | Présent en bloc; règle de changement à préciser |
| Profil et administration des comptes | Auth, profils, avatars éventuels, fonction admin + écrans Expo | Implicite, à détailler |

`DESIGN.md` définit surtout l’apparence et l’accessibilité. Ces choix relèvent des composants d’interface; ils ne justifient pas de nouvelles briques serveur.

## Modifications proposées avant validation

1. Ajouter à la règle du tableau de bord la formule précise déjà confirmée dans le PRD et dire qu’elle est calculée au même endroit pour tous les écrans.
2. Compléter la carte par écran et par domaine de compte; ajouter tags, relations tâche-tag, commentaires projet/tâche et état de compte au schéma conceptuel (sans figer tout le schéma SQL).
3. Décrire la règle commune pour ajouter/retirer un membre et fermer/annuler/réactiver un projet. Rendre explicite le sort d’une affectation après retrait ou désactivation, selon le PRD.
4. Définir le contrat commun entre l’application et les fonctions serveur pour les erreurs, réponses IA, sources et cas « aucune source pertinente ».
5. Nommer le lieu des tests manuels (FR-040) et du journal de réalisation (FR-041), et le script/jeu de données de démonstration nécessaires au scénario FR-038.
6. Garder l’upload d’avatar comme choix à confirmer ou à reporter. Le PRD le rend facultatif; l’import de documents par les utilisateurs est hors MVP.

Ces changements reprennent les exigences existantes; ils ne changent pas le périmètre produit.

## Ce que ces choix imposent pour la suite

- Il faudra construire et maintenir une application mobile distincte; le site Next.js déjà présent n’est pas la cible du MVP.
- Les règles d’accès et les transitions importantes devront être implémentées dans Supabase, pas seulement en cachant des boutons dans l’application.
- Les listes resteront anciennes jusqu’à une actualisation manuelle. Il faut donc afficher la dernière heure de mise à jour et traiter les refus/erreurs sans montrer des données auxquelles la personne n’a plus accès.
- Gemini ne sera appelé que depuis le serveur. La démo doit disposer d’un jeu de données fictif déjà chargé pour fournir des réponses sourcées.

## Coûts et moment où ils commencent

Tarifs consultés dans les pages officielles le 4 novembre 2026. Montants en USD, avant taxes; l’usage et les tarifs peuvent évoluer.

| Élément | Début possible du coût | Ce qu’on sait |
|---|---|---|
| Supabase | Quand il faut garder la démo disponible sans pause automatique, ou dépasser les limites gratuites | Gratuit pour commencer; un projet gratuit peu actif peut être mis en pause après une semaine. Pro commence à 25 USD/mois; usage ou ressources additionnelles peuvent s’ajouter. [Tarifs](https://supabase.com/pricing), [pause des projets gratuits](https://supabase.com/docs/guides/platform/free-project-pausing). |
| Expo EAS | Après le quota mensuel gratuit, ou si l’on veut des builds prioritaires | Gratuit inclut 15 builds Android et 15 iOS par mois. Starter est 19 USD/mois; le build local peut éviter de consommer les builds cloud si l’équipe peut le faire. [Tarifs](https://expo.dev/pricing), [plans et limites](https://docs.expo.dev/billing/plans/). |
| Gemini | Dès que les appels passent par un modèle/compte facturé ou dépassent le quota gratuit applicable | Le coût dépend du modèle et du volume. Ne pas promettre un coût nul : choisir le modèle final, activer la facturation si nécessaire et surveiller les limites avant la démo. [Tarifs API](https://ai.google.dev/gemini-api/docs/pricing). |
| Apple Developer | Si le mode de distribution iOS choisi le demande, notamment TestFlight ou distribution par les services Apple | 99 USD/an; le besoin dépend du chemin d’installation retenu. Le PRD ne demande pas de publication en boutique. [Programme Apple](https://developer.apple.com/programs/). |
| SMTP externe | Si l’envoi de courriels inclus ne convient plus | Dépend du fournisseur choisi; non chiffré et évitable au démarrage si l’envoi Supabase suffit. |

**Lecture pratique :** une première démo peut démarrer sans abonnement en restant dans les offres gratuites, mais Supabase peut se mettre en pause, les builds EAS sont limités, et les appels Gemini doivent être surveillés. Le coût fixe le plus probable est Supabase Pro (25 USD/mois) si la démo doit rester toujours active. EAS Starter et Apple ne sont pas automatiquement nécessaires au MVP.

## Ce qui serait difficile à changer plus tard

- **Supabase comme base et gardien des droits :** le remplacer toucherait les données, les comptes, les règles d’accès, les fonctions serveur et l’assistant.
- **Application mobile plutôt que navigateur :** ajouter une version web ensuite demandera au minimum une nouvelle interface.
- **Règles de cycle de vie des projets/tâches :** après utilisation des données, modifier suppression, annulation ou réactivation demandera des migrations et des changements d’écran.
- **Modèle d’embeddings :** en changer demande de recalculer et recharger les représentations de tous les contenus.
- **Génération des réponses :** le remplacement est moins coûteux, car l’architecture prévoit une interface serveur séparée.

## Hypothèses non confirmées

- Utiliser l’envoi de courriels Supabase pour le début, puis SMTP si nécessaire.
- Modèle final de génération Gemini : le document nomme `gemini-3.5-flash-lite` comme candidat. L’embedding, ses 768 dimensions, le découpage et le seuil de pertinence restent à confirmer par essai.
- Le stockage d’avatar est facultatif; sa mise en œuvre n’est pas décidée.
- Le mode d’installation iOS de la démo n’est pas encore décidé, donc l’abonnement Apple n’est pas confirmé comme nécessaire.
- Les 10 comptes et 5 utilisateurs simultanés sont une cible indicative, pas un test de charge formel.
- Le budget mensuel réel dépend de la disponibilité attendue, du nombre de builds et du volume de questions IA.
- Les appareils minimums et le protocole mesurable pour les objectifs de performance restent à fixer.

## Décision prise et points à suivre

Le commanditaire a validé les six corrections proposées. Elles sont intégrées au spine. Le lint final ne relève aucune erreur. Les reviewers de suivi confirment que la couverture PRD/UX est traçable et qu’aucun blocage technique ne reste. Les détails ci-dessous restent à fixer avant les travaux concernés : statut du projet autorisant les changements de membres, chemins à vérifier contre le futur espace d’implémentation, budget disponible une fois taux et taxes inclus, et méthode de distribution iOS.

## Rapports détaillés

- `reviews/review-rubric.md` — rapprochement PRD/UX et checklist d’architecture.
- `reviews/review-adversarial.md` — tests de cohérence entre unités indépendantes.
- `reviews/review-tech.md` — versions, fournisseurs et coûts vérifiés.
