---
project: GDU_TaskFlow
status: final
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-GDU_TaskFlow-2026-10-27/prd.md
  - _bmad-output/planning-artifacts/prds/prd-GDU_TaskFlow-2026-10-27/addendum.md
  - _bmad-output/planning-artifacts/ux-designs/ux-GDU_TaskFlow-2026-10-29/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-GDU_TaskFlow-2026-10-29/EXPERIENCE.md
  - _bmad-output/planning-artifacts/architecture/architecture-GDU_TaskFlow-2026-11-02/architecture.md
  - _bmad-output/planning-artifacts/architecture/architecture-GDU_TaskFlow-2026-11-02/ARCHITECTURE-SPINE.md
---

# GDU TaskFlow — epics et stories de réalisation

## Vue d’ensemble

Ce document définit le découpage du MVP mobile TaskFlow en travaux vérifiables et leur ordre de réalisation recommandé. Les projets, les tâches et le tableau de bord constituent le cœur fonctionnel; l’assistant et la démonstration complète suivent.

Chaque story comporte 2 à 4 critères d’acceptation vérifiables à l’écran ou dans le support concerné (par exemple, la checklist de vérification ou le journal). Les vérifications techniques sont distinguées des critères visibles dans l’application. Aucun développement n’est inclus dans ce document.

## Décisions validées pour cette version

- Aucun courriel d’invitation ni de réinitialisation ne sera envoyé pour la démo. Les comptes de démonstration seront créés côté Supabase avec un mot de passe généré, remis à la personne par un moyen externe à l’application. Cette décision remplace le parcours par courriel prévu aux FR-001, FR-004 et FR-033 pour le MVP de démo.
- Le tout premier compte administrateur sera créé directement dans Supabase avant l’utilisation de l’application, au moyen de l’administration Supabase Auth. Ne pas insérer un mot de passe en clair dans une table applicative.
- Si une personne perd son mot de passe, l’administrateur suivra une procédure Supabase pour générer puis transmettre un nouveau mot de passe hors application.
- L’administrateur garde tous ses droits globaux. Les écrans de projet nomment le propriétaire du projet sans détailler les privilèges globaux de l’administrateur.
- Les contrôles d’accessibilité de base font partie du MVP et s’appliquent aux écrans. La mesure des objectifs de performance NFR-008 attend une phase ultérieure.
- Les règles techniques (RLS, droits, prévention des requêtes en double) sont vérifiées dans une checklist distincte des critères visibles de l’interface.

## Inventaire des exigences

### Exigences fonctionnelles

- **FR-001 :** Un administrateur invite une personne par courriel; elle active son compte avec une adresse unique et un mot de passe.
- **FR-002 :** La session reste active entre les ouvertures de l’application; la personne peut se déconnecter; une session expirée ou désactivée ne donne plus accès aux écrans protégés.
- **FR-003 :** Le compte a un profil avec prénom et nom obligatoires, modifiables par la personne; l’avatar est facultatif.
- **FR-004 :** Une personne peut demander un lien de réinitialisation de mot de passe par courriel.
- **FR-005 :** Un membre voit les projets auxquels il appartient; l’administrateur voit tous les projets.
- **FR-006 :** Le propriétaire gère son projet; l’administrateur peut créer et gérer tous les projets; un membre consulte sans modifier les informations du projet.
- **FR-007 :** Un projet a les statuts actif, clôturé et annulé; sa date de début est préremplie et ses dates suivent les règles définies au PRD.
- **FR-008 :** Le propriétaire et l’administrateur voient les membres et peuvent ajouter ou retirer un compte existant et actif; l’invitation ne se fait pas depuis l’écran des membres.
- **FR-009 :** Un projet clôturé reste consultable et ses champs sont en lecture seule jusqu’à sa réouverture; les commentaires restent permis et la date de clôture antérieure est conservée.
- **FR-010 :** Un projet n’est jamais supprimé physiquement; son annulation limite sa visibilité au propriétaire et à l’administrateur; sa réactivation efface la date de clôture.
- **FR-011 :** Le retrait d’un membre lui coupe immédiatement l’accès au projet et à son assistant; ses tâches restent et signalent qu’un membre doit être réattribué.
- **FR-012 :** Le propriétaire et l’administrateur gèrent les tâches; un membre ne change que le statut des tâches qui lui sont attribuées.
- **FR-013 :** Une tâche a un titre et une échéance obligatoires, et peut avoir une description, une priorité, une affectation et des tags du projet.
- **FR-014 :** Les statuts sont créée, en cours, terminée et annulée; une personne assignée peut terminer directement une tâche créée, puis remettre une tâche terminée en cours avant de modifier ses autres champs.
- **FR-015 :** Le propriétaire ou l’administrateur annule ou réactive une tâche; la réactivation restaure son statut antérieur et les commentaires restent possibles.
- **FR-016 :** Une tâche ne peut être supprimée physiquement que si elle est créée, jamais commencée et sans commentaire; sinon, elle peut être annulée par le propriétaire ou l’administrateur.
- **FR-017 :** Les tâches se filtrent par statut, priorité, membre, tag et échéance; elles se trient par échéance, priorité, date de création ou titre, dans les deux sens.
- **FR-018 :** Les listes et tableaux de bord s’actualisent à la demande par bouton ou geste; l’heure des dernières données est visible quand utile.
- **FR-019 :** Les membres commentent les projets et tâches visibles; l’auteur, le propriétaire et l’administrateur peuvent modifier ou supprimer selon les droits du PRD.
- **FR-020 :** Dans un projet clôturé, les champs des tâches sont en lecture seule pour les membres, mais les commentaires restent permis.
- **FR-021 :** Le tableau de bord montre l’avancement global et personnel; le propriétaire peut s’assigner des tâches.
- **FR-022 :** L’avancement attribue 0 à une tâche créée, 0,5 à une tâche en cours et 1 à une tâche terminée; les tâches annulées sont exclues.
- **FR-023 :** L’avancement est vide lorsqu’il n’y a aucune tâche admissible dans le calcul.
- **FR-024 :** Le tableau de bord affiche les compteurs créées, en cours, terminées et en retard, sans compteur annulées; le retard dépend de l’échéance et du statut.
- **FR-025 :** Chaque projet possède des connaissances fictives préchargées; l’import libre de fichiers par les utilisateurs n’est pas requis.
- **FR-026 :** Les connaissances sont découpées en passages, transformées en embeddings et stockées avec leurs métadonnées dans pgvector.
- **FR-027 :** Une personne pose une question en langage naturel sur un projet auquel elle a accès; la recherche respecte son rôle.
- **FR-028 :** Une réponse de l’assistant montre le nom de la source, l’extrait utilisé et un lien ouvrable s’il existe.
- **FR-029 :** Si les sources ne suffisent pas, l’assistant l’indique clairement et ne fabrique pas de réponse.
- **FR-030 :** Gemini fournit génération et embeddings; les appels et clés restent côté serveur.
- **FR-031 :** Un membre recherche uniquement dans ses projets; l’administrateur peut rechercher dans tous les projets; la base et le serveur appliquent cette règle.
- **FR-032 :** Le fournisseur de génération peut être remplacé côté serveur sans ajouter de choix fournisseur à l’application.
- **FR-033 :** L’administrateur invite une personne par courriel avec prénom et nom; le nouveau compte choisit son mot de passe; un propriétaire de projet ne peut choisir que des comptes existants.
- **FR-034 :** L’administrateur désactive un compte; celui-ci perd l’accès, ses relations projet et tâches sont conservées, et une nouvelle affectation lui est interdite.
- **FR-035 :** À la réactivation, la personne retrouve ses projets et ses tâches antérieures.
- **FR-036 :** Les formulaires signalent les champs invalides et empêchent l’envoi tant que les erreurs ne sont pas corrigées.
- **FR-037 :** Les parcours présentent chargement, succès, erreur réseau avec possibilité de réessayer, refus d’accès sans fuite de contenu et état vide.
- **FR-038 :** La démonstration montre un propriétaire qui crée un projet et deux tâches, un membre qui change le statut d’une tâche, puis les avancements actualisés; l’assistant utilise le projet fictif préchargé.
- **FR-039 :** Un build installable permet d’essayer l’application sans la publier dans une boutique.
- **FR-040 :** Des scénarios manuels couvrent les parcours principaux, les trois rôles et les règles d’accès RLS.
- **FR-041 :** Un journal synthétique consigne les intentions et prompts importants, décisions, erreurs corrigées et vérifications humaines.

### Exigences non fonctionnelles

- **NFR-001 — Sécurité :** Auth et RLS contrôlent les données pour les trois rôles, y compris les appels directs, fonctions serveur, fichiers et recherche vectorielle.
- **NFR-002 — Secrets :** les clés privilégiées Supabase et Gemini restent côté serveur et ne sont jamais embarquées dans l’application.
- **NFR-003 — Sessions :** la session est conservée en lieu sécurisé; expiration, déconnexion et désactivation coupent l’accès aux écrans protégés.
- **NFR-004 — Ergonomie et accessibilité :** téléphones et tablettes iOS/Android, thème clair/sombre système, VoiceOver/TalkBack, texte agrandissable, contraste lisible et commandes tactiles utilisables.
- **NFR-005 — Actualisation :** une commande met à jour les données sans recharger toute l’application; aucune mise à jour temps réel n’est promise.
- **NFR-006 — Langue :** interface et réponses de l’assistant en français.
- **NFR-007 — Disponibilité :** connexion Internet requise; pas de mode hors ligne.
- **NFR-008 — Performance provisoire :** écrans usuels sous 3 secondes et assistant sous 10 secondes au 95e percentile, à mesurer sur appareils, réseau, corpus et questions de référence.
- **NFR-009 — Données de démo :** les données projet et le corpus IA sont fictifs; aucune donnée personnelle ou sensible réelle n’est nécessaire.

### Exigences complémentaires de l’architecture

- Découpage en couches : application Expo/React Native, adaptateur Supabase, base PostgreSQL comme source de vérité et fonctions serveur pour opérations protégées.
- Stack retenue : Expo SDK 58, React Native 0.88, TypeScript, Expo Router, SecureStore, Supabase Auth/PostgreSQL/RLS/Storage/Edge Functions, pgvector, Gemini `gemini-3.5-flash-lite` et `gemini-embedding-2` à 768 dimensions.
- Toutes les tables/fichiers accessibles par l’application sont protégés par RLS; les rôles globaux sont modifiables uniquement côté serveur.
- Les mutations de tâches, projets, appartenance et commentaires suivent une règle serveur/transaction commune; le tableau de bord utilise le même calcul partagé.
- Le serveur vérifie l’identité, l’état actif, la session et les droits avant les appels privilégiés; les erreurs utilisent un contrat stable et n’exposent ni secret ni contenu interdit.
- Les réponses IA ne reçoivent que les extraits du projet autorisé; sources et passages sont liés au même projet, et les citations affichent nom, extrait et destination si disponible.
- Limites initiales de démo : 10 questions IA par compte et 50 au total par jour; compteur quotidien PostgreSQL mis à jour atomiquement; dépassement ou quota Gemini atteint = `AI_UNAVAILABLE`, sans bascule payante.
- Cible de dépense : 0 €/mois; Supabase Free et EAS Free peuvent imposer veille/quotas. Gemini doit rester sans facturation liée. Resend Free peut gérer les e-mails Auth si un domaine d’envoi déjà détenu est vérifiable; sans cela, les invitations externes restent une limite à valider.
- Builds EAS; APK Android comme voie installable sans frais; iOS autonome sur appareil physique hors scénario 0 €; Expo Go possible si les fonctions sont compatibles.
- Aucune base web Next.js à prolonger, aucun service temps réel, aucune synchro hors ligne ni environnement de production dans le MVP.
- Les cibles et la méthode de mesure de performance sont conservées comme référence d’architecture, mais reportées hors du MVP.

### Exigences UX

- **UX-DR-001 — Identité visuelle :** appliquer les couleurs bleu et turquoise, surfaces claires/sombres, styles de texte système et espacements définis dans DESIGN.md; les statuts utilisent toujours un libellé, pas la couleur seule.
- **UX-DR-002 — Navigation :** afficher en haut les onglets Accueil, Projets, Mes tâches et Assistant; conserver le projet courant à l’ouverture de son assistant.
- **UX-DR-003 — Tableau de bord :** montrer clairement les progressions globale/personnelle, compteurs requis et heure d’actualisation; ne pas présenter de chiffres avant chargement.
- **UX-DR-004 — Projets :** cartes lisibles avec statut, progression, dates et nombre de tâches; masquer les projets annulés aux rôles non autorisés.
- **UX-DR-005 — Tablettes :** utiliser l’espace supplémentaire pour présenter la liste et son détail/panneau de synthèse côte à côte sans étirer les lignes de texte.
- **UX-DR-006 — Tâches :** montrer titre, statut, échéance, priorité et personne assignée; n’exposer que les commandes autorisées selon rôle, affectation et état.
- **UX-DR-007 — Recherche de tâches :** filtres cumulables par statut, priorité, membre, tag et échéance; afficher le nombre de filtres et une commande pour les effacer; proposer tri et sens de tri.
- **UX-DR-008 — Formulaires :** garder les libellés visibles, associer l’erreur au champ, conserver les saisies, bloquer les doubles envois et confirmer l’enregistrement réussi.
- **UX-DR-009 — Commentaires et actions destructives :** montrer auteur/date; respecter les droits d’édition/suppression; expliquer et confirmer annulation, retrait de membre ou suppression autorisée.
- **UX-DR-010 — Actualisation :** proposer bouton nommé et geste tirer-vers-le-bas, dédupliquer les demandes, conserver les données visibles pendant le chargement et n’actualiser l’horodatage qu’après réussite.
- **UX-DR-011 — États d’écran :** différencier chargement initial, actualisation, vide général, vide filtré, erreur réseau, erreur de formulaire, refus de droit, succès et expiration de session; conserver les données saisies pertinentes.
- **UX-DR-012 — Assistant :** afficher le message de recherche, éviter les envois multiples, associer chaque réponse à ses sources, proposer reformulation si aucune source ne répond et conserver la question si l’API échoue.
- **UX-DR-013 — Accessibilité :** nommer commandes, champs, sélections et erreurs pour VoiceOver/TalkBack; ordre de lecture cohérent; texte système agrandissable; cibles d’au moins 44 pt iOS/48 dp Android; respecter réduire les animations.
- **UX-DR-014 — Thèmes :** suivre automatiquement le thème clair ou sombre du système en conservant contraste et sens des couleurs.
- **UX-DR-015 — Ton :** employer des messages français courts, calmes et orientés vers la prochaine action; ne pas blâmer la personne ni promettre du travail en arrière-plan ou du temps réel.
- **UX-DR-016 — Profil et administration :** placer profil, préférences et gestion des comptes dans un accès secondaire; l’emplacement exact reste à préciser pendant la conception.

### Carte de couverture des FR

| FR | Story(s) de couverture | Résumé |
|---|---|---|
| FR-001, FR-033 | 1.1 | Recevoir l’invitation et activer son compte. |
| FR-002 | 1.2 | Connexion, session persistante, déconnexion et expiration. |
| FR-003 | 1.3 | Consulter et modifier son profil. |
| FR-004 | 1.4 | Réinitialiser son mot de passe. |
| FR-034, FR-035 | 1.5 | Désactiver et réactiver un compte en conservant ses liens. |
| FR-005 | 2.1 | Voir les projets autorisés selon le rôle. |
| FR-006, FR-007 | 2.2, 2.3 | Créer et modifier le projet actif et ses dates. |
| FR-008, FR-011 | 2.4 | Gérer les membres et couper l’accès au retrait. |
| FR-009 | 2.5 | Clôturer et rouvrir en conservant la date précédente. |
| FR-010 | 2.6 | Annuler/réactiver sans supprimer physiquement. |
| FR-018 | 2.7, 3.9, 4.3 | Actualiser listes de projets, tâches/commentaires et tableau de bord. |
| FR-012, FR-013 | 3.1, 3.3 | Créer, affecter et modifier des tâches selon les droits. |
| FR-014 | 3.2, 3.3 | Appliquer les transitions et verrouiller les champs terminés. |
| FR-015 | 3.4 | Annuler/réactiver et restaurer le statut précédent. |
| FR-016 | 3.5 | Supprimer seulement une tâche encore vierge. |
| FR-017 | 3.6 | Filtrer et trier les tâches. |
| FR-019, FR-020 | 2.5, 3.7, 3.8 | Commenter projets et tâches visibles, y compris selon leur état. |
| FR-021 à FR-023 | 4.1 | Voir la progression globale/personnelle avec les calculs établis. |
| FR-024 | 4.2 | Lire les compteurs et retards. |
| FR-025 à FR-027, FR-030, FR-031, FR-032 | 5.1 | Interroger le corpus autorisé avec les adaptateurs serveur. |
| FR-028 | 5.2 | Vérifier les citations et leurs liens. |
| FR-029 | 5.3 | Réponse explicite quand aucune source ne répond. |
| FR-036, FR-037 | 1.1–6.4 selon le parcours | Validation des formulaires et états de chargement/succès/erreur/refus/absence. |
| FR-038 | 6.1 | Parcours de démonstration avec propriétaire, membre et projet préchargé. |
| FR-039 | 6.2 | Installer un build sans publication en boutique. |
| FR-040 | 6.3 | Vérifier les trois rôles et les règles RLS. |
| FR-041 | 6.4 | Consigner les prompts, décisions, erreurs et contrôles humains. |

### Carte de couverture des exigences UX

| UX-DR | Stories prévues |
|---|---|
| UX-DR-001, UX-DR-014, UX-DR-015 | Règles communes appliquées à toutes les stories d’écran (thème, langage, couleurs et ton). |
| UX-DR-002, UX-DR-005 | Story 2.1 et navigation entre écrans; affichage liste/détail adapté à la tablette. |
| UX-DR-003 | Stories de tableau de bord (Epic 4). |
| UX-DR-004 | Stories de liste et cycle de vie des projets (Epic 2). |
| UX-DR-006 à UX-DR-008 | Stories de tâches, filtres, commentaires et formulaires (Epics 2 et 3). |
| UX-DR-009 | Stories de commentaires, annulation, retrait et suppression (Epics 2 et 3). |
| UX-DR-010 | Stories d’actualisation des projets, tâches et tableau de bord (Epics 2 à 4). |
| UX-DR-011 | Critères d’écran dans les stories des Epics 1 à 6. |
| UX-DR-012 | Stories d’assistant et de sources (Epic 5). |
| UX-DR-013 | Critères d’accessibilité dans toutes les stories d’écran. |
| UX-DR-016 | Stories de profil et administration (Epic 1). |

### Couverture des exigences non fonctionnelles

| NFR | Couverture prévue |
|---|---|
| NFR-001 — Sécurité et droits | Stories 1.2, 1.5, 2.1, 2.4, 3.1–3.5, 5.1–5.2 et 6.3 vérifient les rôles, RLS et refus d’accès. |
| NFR-002 — Secrets côté serveur | Repères d’architecture des stories 1.1 et 5.1; aucune clé privilégiée dans l’application. |
| NFR-003 — Sessions sécurisées | Stories 1.2 et 1.5. |
| NFR-004 — Accessibilité et appareils | Règles communes de chaque story d’écran; stories 2.1, 4.1 et 6.2 couvrent aussi tablette, thèmes et appareils. |
| NFR-005 — Actualisation manuelle | Stories 2.7, 3.9 et 4.3. |
| NFR-006 — Français | Toutes les stories d’écran; interface et assistant donnent les messages en français. |
| NFR-007 — Réseau requis, sans hors-ligne | Stories 2.7, 3.9 et 5.3 couvrent les erreurs réseau et la reprise. |
| NFR-008 — Performance | Hors MVP : la mesure des objectifs de délai est reportée à une phase ultérieure. |
| NFR-009 — Données fictives | Stories 5.1 et 6.1 vérifient le corpus et le parcours de démo. |

### Liste des epics

Les priorités donnent l’ordre conseillé pour le MVP. **P0** est nécessaire pour ouvrir l’application et protéger les comptes; **P1** correspond au cœur demandé (projets, tâches, tableau de bord); **P2** peut attendre que ce cœur soit utilisable, mais reste requis pour la démonstration complète décrite par le PRD.

### Epic 1 — Accéder à TaskFlow et gérer son compte — P0

**Résultat utilisateur :** chaque personne invitée peut ouvrir son compte, rester connectée en sécurité et retrouver son profil; l’administrateur gère l’accès.

**FR couverts :** FR-001 à FR-004, FR-033 à FR-035; critères transversaux FR-036 et FR-037 pour les écrans de compte.

**Dépendances :** première capacité livrable; les epics suivants s’appuient sur l’identité et les rôles établis ici.

### Epic 2 — Organiser les projets et leurs membres — P1

**Résultat utilisateur :** propriétaire et administrateur créent, consultent et font évoluer les projets; les membres ne voient que les projets auxquels ils ont accès.

**FR couverts :** FR-005 à FR-011, FR-018 pour l’actualisation des vues de projets; critères transversaux FR-036 et FR-037.

**Dépendances :** nécessite Epic 1; cette epic reste utile sans les tâches ni l’assistant.

### Epic 3 — Créer les tâches et suivre le travail — P1

**Résultat utilisateur :** le propriétaire répartit les tâches; la personne assignée met à jour son statut, filtre son travail et échange des commentaires selon ses droits.

**FR couverts :** FR-012 à FR-020, avec FR-018 pour l’actualisation des vues de tâches; critères transversaux FR-036 et FR-037.

**Dépendances :** nécessite Epic 1 et Epic 2 pour l’identité et le projet auquel rattacher les tâches.

### Epic 4 — Comprendre l’avancement dans le tableau de bord — P1

**Résultat utilisateur :** tous les rôles lisent d’un coup d’œil l’avancement global et personnel ainsi que les compteurs de tâches; l’affichage suit les données actualisées.

**FR couverts :** FR-021 à FR-024 et FR-018 pour l’actualisation du tableau de bord; critères transversaux FR-036 et FR-037.

**Dépendances :** nécessite Epic 2 et Epic 3, qui fournissent projets et tâches; c’est la priorité fonctionnelle mise en avant après ces prérequis.

### Epic 5 — Retrouver une information dans les sources du projet — P2

**Résultat utilisateur :** membre ou administrateur pose une question et obtient une réponse vérifiable dans les documents fictifs auxquels son rôle lui donne accès.

**FR couverts :** FR-025 à FR-032; critères transversaux FR-036 et FR-037.

**Dépendances :** nécessite Epic 1 et Epic 2 pour les rôles et le contexte projet; peut attendre après le cœur projets/tâches/tableau de bord.

### Epic 6 — Présenter et vérifier une démo complète — P2

**Résultat utilisateur :** une personne peut installer TaskFlow et suivre le parcours de démonstration complet; l’équipe peut vérifier les droits et retracer les décisions de réalisation.

**FR couverts :** FR-038 à FR-041; les états d’écran FR-036 et FR-037 restent appliqués au parcours complet.

**Dépendances :** assemblage de fin de MVP après les parcours de comptes, projets, tâches et tableau de bord; l’assistant est inclus dans la démo complète si Epic 5 est achevée.

## Stories

Les règles d’interface s’appliquent à chaque story d’écran : textes en français, couleurs et thèmes prévus dans DESIGN.md, commandes accessibles avec VoiceOver/TalkBack, ordre de lecture cohérent, taille de texte système respectée, cibles tactiles minimales de 44 pt sur iOS et 48 dp sur Android, et aucun état réservé aux rôles non autorisés. La story 6.3 contient une checklist commune pour vérifier ces points; les tests techniques de droits sont consignés séparément des critères visibles à l’écran. Chaque story est découpée pour une seule séance de réalisation et ne dépend pas d’une story située après elle.

Les données et écrans se construisent au moment où une story les utilise; il n’y a pas de story initiale « construire toute la base ». Le partage de composants entre epics est volontaire : projets, tâches puis tableau de bord sont trois résultats visibles différents; les parcours projets et tâches restent complets même si le tableau de bord n’est pas encore livré.

## Epic 1 — Accéder à TaskFlow et gérer son compte

### Story 1.1 — Créer un compte de démonstration et recevoir son mot de passe

En tant qu’administrateur, je veux créer un compte de démonstration avec un mot de passe généré, afin que la personne puisse se connecter sans recevoir de courriel.

**FR :** le parcours par courriel de FR-001 et FR-033 est remplacé pour le MVP de démo par la décision validée ci-dessus. **Repères d’architecture :** créer le compte avec Supabase Auth; ne jamais enregistrer le mot de passe en clair dans une table applicative.

**Critères d’acceptation :**

- **Étant donné** la procédure de création d’un compte de démonstration dans Supabase Auth, **quand** l’administrateur crée le compte, **alors** un mot de passe généré est associé au compte sans qu’un courriel soit envoyé.
- **Étant donné** le mot de passe généré, **quand** l’administrateur le remet à la personne par un moyen externe à l’application, **alors** celle-ci peut se connecter avec son adresse et ce mot de passe.
- **Étant donné** un compte déjà existant ou une erreur de création, **quand** l’administrateur suit la procédure, **alors** le compte n’est pas présenté comme créé et le message indique la prochaine action sans exposer de détails techniques.

### Story 1.2 — Me connecter et retrouver ma session

En tant que membre, je veux me connecter, fermer puis rouvrir l’application, afin de retrouver mes écrans sans me reconnecter à chaque fois.

**FR :** FR-002, FR-037. **Repères d’architecture :** stocker la session dans Expo SecureStore; RLS et fonctions serveur refusent immédiatement l’accès applicatif d’un compte/session désactivé.

**Critères d’acceptation :**

- **Étant donné** un compte actif, **quand** je saisis la bonne adresse et le bon mot de passe, **alors** l’écran d’accueil apparaît.
- **Étant donné** une session encore valide, **quand** je ferme puis rouvre l’application, **alors** je retrouve mon écran protégé sans nouvelle saisie du mot de passe.
- **Étant donné** un mot de passe erroné ou une session expirée, **quand** j’ouvre un écran protégé, **alors** l’application affiche un message simple et me propose la connexion.
- **Étant donné** ma session ouverte, **quand** je choisis « Se déconnecter », **alors** l’écran de connexion apparaît et les écrans protégés ne sont plus accessibles.

### Story 1.3 — Consulter et modifier mon profil

En tant que personne connectée, je veux corriger mon prénom et mon nom, afin que mon équipe m’identifie correctement.

**FR :** FR-003, FR-036–037. **Repères UX :** profil dans la zone secondaire; avatar facultatif.

**Critères d’acceptation :**

- **Étant donné** mon écran de profil, **quand** je l’ouvre, **alors** mon prénom et mon nom actuels sont affichés.
- **Étant donné** un prénom et un nom valides, **quand** j’enregistre leur modification, **alors** le nouveau nom apparaît sur mon profil et dans les listes concernées.
- **Étant donné** un champ obligatoire vide, **quand** j’essaie d’enregistrer, **alors** l’erreur est affichée sous le champ et les autres valeurs saisies sont conservées.

### Story 1.4 — Retrouver mon accès avec l’aide de l’administrateur

En tant que personne qui ne peut plus se connecter, je veux que l’administrateur réinitialise mon mot de passe, afin de retrouver mon compte sans courriel.

**FR :** le lien de réinitialisation par courriel de FR-004 est remplacé pour le MVP de démo par la procédure Supabase validée ci-dessus.

**Critères d’acceptation :**

- **Étant donné** une demande de réinitialisation, **quand** l’administrateur suit la procédure dans Supabase Auth, **alors** un nouveau mot de passe est généré et associé au compte sans courriel.
- **Étant donné** le nouveau mot de passe, **quand** l’administrateur le remet à la personne par un moyen externe à l’application, **alors** celle-ci peut se connecter avec ce mot de passe.
- **Étant donné** une personne qui ne peut plus se connecter, **quand** elle consulte l’aide de connexion, **alors** l’application lui indique de contacter l’administrateur au lieu de promettre l’envoi d’un courriel.

### Story 1.5 — Désactiver ou réactiver un compte

En tant qu’administrateur, je veux désactiver ou réactiver un compte, afin de contrôler l’accès sans perdre ses projets et tâches.

**FR :** FR-034–035. **Repères d’architecture :** état de profil contrôlé côté serveur et par RLS; les relations de projet et de tâche sont conservées.

**Critères d’acceptation :**

- **Étant donné** la liste des comptes, **quand** je désactive un compte, **alors** son état « Désactivé » est visible et son accès aux écrans protégés est refusé.
- **Étant donné** un compte désactivé, **quand** un propriétaire consulte une tâche qui lui était attribuée, **alors** la tâche reste visible avec la mention « Utilisateur désactivé » et le compte ne peut pas recevoir de nouvelle tâche.
- **Étant donné** ce compte désactivé, **quand** je le réactive, **alors** son état devient « Actif » et ses projets et tâches antérieurs réapparaissent à la personne.

## Epic 2 — Organiser les projets et leurs membres

### Story 2.1 — Voir les projets qui me concernent

En tant qu’utilisateur, je veux voir les projets accessibles selon mon rôle, afin de retrouver rapidement le projet à gérer.

**FR :** FR-005, FR-036–037. **Repères d’architecture :** RLS applique les droits membre/propriétaire/administrateur; la liste respecte le thème et la disposition tablette.

**Critères d’acceptation :**

- **Étant donné** un membre connecté, **quand** il ouvre « Projets », **alors** seules ses cartes de projets apparaissent avec nom, statut, progression, date utile et nombre de tâches.
- **Étant donné** un administrateur, **quand** il ouvre « Projets », **alors** il voit tous les projets; un membre ne voit pas les projets dont il a été retiré.
- **Étant donné** qu’aucun projet n’est visible, **quand** la liste finit de charger, **alors** le message « Aucun projet pour le moment » apparaît et une action n’est affichée que si son rôle le permet.
- **Étant donné** une tablette, **quand** j’ouvre un projet, **alors** la liste et le détail peuvent apparaître côte à côte sans étirer les lignes de texte.

### Story 2.2 — Créer un projet

En tant que propriétaire ou administrateur, je veux créer un projet avec une date de début proposée, afin d’organiser le travail d’une équipe.

**FR :** FR-006–007, FR-036–037. **Repères d’architecture :** l’enregistrement respecte les règles transactionnelles et les statuts définis.

**Critères d’acceptation :**

- **Étant donné** que j’ai le droit de créer un projet, **quand** j’ouvre le formulaire, **alors** la date du jour est proposée comme date de début et peut être modifiée.
- **Étant donné** les informations valides du projet, **quand** je choisis « Créer le projet », **alors** un message confirme la création, le projet reçoit le statut « Actif » et son détail s’ouvre.
- **Étant donné** un champ invalide, **quand** je tente l’enregistrement, **alors** le champ affiche l’erreur et le reste du formulaire conserve mes saisies.

### Story 2.3 — Modifier un projet actif

En tant que propriétaire ou administrateur, je veux modifier le nom et les dates d’un projet actif, afin de garder ses informations à jour.

**FR :** FR-006–007, FR-009, FR-020. **Repères d’architecture :** le serveur contrôle rôle et état du projet; un projet clôturé reste verrouillé pour les membres.

**Critères d’acceptation :**

- **Étant donné** un projet actif que je possède, **quand** j’enregistre de nouvelles informations valides, **alors** le détail affiche les valeurs confirmées.
- **Étant donné** un projet consulté comme membre, **quand** j’ouvre son détail, **alors** les champs ne proposent pas de modification.
- **Étant donné** un projet clôturé, **quand** un membre ouvre son détail, **alors** les informations et tâches sont en lecture seule.

### Story 2.4 — Ajouter ou retirer un membre du projet

En tant que propriétaire, je veux ajouter ou retirer un compte actif, afin de donner l’accès aux bonnes personnes.

**FR :** FR-008, FR-011. **Repères d’architecture :** une mutation transactionnelle retire immédiatement l’accès et enlève l’affectation des tâches conservées.

**Critères d’acceptation :**

- **Étant donné** la liste des membres d’un projet, **quand** je sélectionne un compte actif existant, **alors** ce compte apparaît comme membre du projet.
- **Étant donné** un compte inactif ou inconnu, **quand** je le recherche pour l’ajouter, **alors** il ne peut pas être sélectionné et aucun bouton d’invitation n’apparaît dans cet écran.
- **Étant donné** un membre retiré qui avait une tâche, **quand** je consulte la tâche, **alors** elle reste visible avec la mention « Membre à attribuer » et l’ancien membre ne voit plus le projet ni son assistant.

### Story 2.5 — Clôturer et rouvrir un projet

En tant que propriétaire ou administrateur, je veux clôturer puis rouvrir un projet, afin de marquer une période terminée tout en conservant son historique.

**FR :** FR-009, FR-020. **Repères d’architecture :** conserver la date de clôture précédente; les commentaires restent autorisés selon le rôle.

**Critères d’acceptation :**

- **Étant donné** un projet actif, **quand** je le clôture, **alors** sa date de clôture apparaît et les champs du projet et des tâches sont en lecture seule pour les membres.
- **Étant donné** un projet clôturé, **quand** un membre ajoute un commentaire, **alors** le commentaire est affiché sans rendre les champs modifiables.
- **Étant donné** un projet clôturé, **quand** je le rouvre, **alors** sa date de clôture précédente est conservée et les champs redeviennent modifiables selon le rôle.

### Story 2.6 — Annuler ou réactiver un projet

En tant que propriétaire ou administrateur, je veux annuler ou réactiver un projet, afin de retirer un projet arrêté tout en gardant son historique.

**FR :** FR-010, FR-019. **Repères d’architecture :** ne jamais supprimer physiquement le projet; la visibilité change selon le statut et le rôle.

**Critères d’acceptation :**

- **Étant donné** un projet actif, **quand** je choisis « Annuler », **alors** une confirmation précise l’effet avant l’action et, après validation, le projet affiche « Annulé » avec sa date de clôture.
- **Étant donné** un projet annulé, **quand** un membre ordinaire consulte sa liste, **alors** ce projet n’y apparaît pas; le propriétaire et l’administrateur le voient.
- **Étant donné** un projet annulé, **quand** je le réactive, **alors** il redevient visible aux membres autorisés et la date de clôture est effacée.

### Story 2.7 — Actualiser les projets et les membres

En tant qu’utilisateur, je veux actualiser mes listes de projets et de membres, afin de voir les changements récents.

**FR :** FR-018, FR-037. **Repères UX :** bouton et geste de rafraîchissement; aucune mise à jour en temps réel n’est promise.

**Critères d’acceptation :**

- **Étant donné** une liste de projets ou de membres, **quand** je touche « Actualiser » ou tire la liste vers le bas, **alors** une indication de chargement apparaît sans vider la liste et une seconde requête identique n’est pas lancée.
- **Étant donné** une actualisation réussie, **quand** les données sont affichées, **alors** l’heure de mise à jour est visible et reflète la dernière réussite.
- **Étant donné** une erreur réseau, **quand** l’actualisation échoue, **alors** les données précédentes restent visibles, sont indiquées comme anciennes et un bouton « Réessayer » apparaît.

## Epic 3 — Créer les tâches et suivre le travail

### Story 3.1 — Créer et affecter une tâche

En tant que propriétaire ou administrateur, je veux créer une tâche avec une échéance et une personne responsable, afin de répartir le travail clairement.

**FR :** FR-012–013, FR-036–037. **Repères d’architecture :** l’écriture est transactionnelle; l’assigné doit être un compte actif membre du projet ou son propriétaire.

**Critères d’acceptation :**

- **Étant donné** un projet actif, **quand** j’ouvre « Nouvelle tâche », **alors** le formulaire affiche titre et échéance obligatoires, puis description facultative, priorité, tags et affectation facultatifs.
- **Étant donné** un titre, une échéance et une priorité valide parmi « Basse », « Normale » ou « Haute », **quand** j’enregistre, **alors** la tâche apparaît dans le projet avec statut « Créée » et les informations saisies.
- **Étant donné** un compte inactif ou qui n’est ni membre du projet ni propriétaire, **quand** je tente de l’affecter, **alors** il n’est pas proposé comme responsable.
- **Étant donné** un champ obligatoire manquant, **quand** je tente l’enregistrement, **alors** son erreur est visible et les autres valeurs saisies restent présentes.

### Story 3.2 — Changer le statut de ma tâche

En tant que membre assigné, je veux changer le statut de ma tâche, afin que l’équipe sache où en est le travail.

**FR :** FR-012, FR-014. **Repères d’architecture :** la base est la source de vérité des transitions autorisées.

**Critères d’acceptation :**

- **Étant donné** une tâche assignée à moi et créée, **quand** j’ouvre ses actions, **alors** je peux la passer en cours ou directement terminée.
- **Étant donné** une tâche terminée qui m’est assignée, **quand** je la remets en cours, **alors** son nouveau statut apparaît après confirmation du serveur.
- **Étant donné** une tâche non assignée à moi, **quand** j’ouvre son détail, **alors** aucune commande de changement de statut ne m’est proposée.

### Story 3.3 — Modifier une tâche que je gère

En tant que propriétaire ou administrateur, je veux modifier les détails d’une tâche, afin de corriger les informations du travail.

**FR :** FR-012, FR-014, FR-020. **Repères d’architecture :** les champs restent verrouillés jusqu’au retour d’une tâche terminée à « En cours ».

**Critères d’acceptation :**

- **Étant donné** une tâche non terminée d’un projet actif, **quand** je modifie ses champs et enregistre, **alors** le détail montre les valeurs enregistrées.
- **Étant donné** une tâche terminée, **quand** je l’ouvre, **alors** ses champs sont verrouillés et l’action « Remettre en cours » est proposée au rôle autorisé.
- **Étant donné** une tâche terminée remise en cours, **quand** je rouvre son édition, **alors** ses champs peuvent être modifiés.

### Story 3.4 — Annuler ou réactiver une tâche

En tant que propriétaire ou administrateur, je veux annuler ou réactiver une tâche, afin de retirer un travail arrêté sans perdre son statut précédent.

**FR :** FR-015. **Repères d’architecture :** l’ancien statut est conservé puis restauré par une mutation serveur atomique.

**Critères d’acceptation :**

- **Étant donné** une tâche visible dans un projet, **quand** je choisis « Annuler », **alors** une confirmation affiche l’effet et le statut devient « Annulée » après validation.
- **Étant donné** une tâche annulée, **quand** je la réactive, **alors** son ancien statut est restauré dans la liste et le détail.
- **Étant donné** une tâche annulée, **quand** un membre autorisé ouvre son détail, **alors** il peut encore lire son contenu et ajouter un commentaire, sans modifier son statut.

### Story 3.5 — Supprimer seulement une tâche encore vierge

En tant que propriétaire, je veux supprimer une tâche jamais commencée et sans commentaire, afin de retirer une erreur de saisie.

**FR :** FR-016. **Repères UX :** confirmation avant action destructive; tâche commencée ou commentée = annulation, pas suppression. L’écran met en avant le propriétaire du projet; l’administrateur conserve ses droits globaux sans qu’ils aient à être détaillés dans cet écran.

**Critères d’acceptation :**

- **Étant donné** une tâche créée, jamais commencée et sans commentaire, **quand** je choisis « Supprimer », **alors** l’écran demande confirmation et la tâche disparaît après validation.
- **Étant donné** une tâche commencée, terminée ou commentée, **quand** j’ouvre ses actions, **alors** « Supprimer » n’est pas proposé et l’annulation reste la seule action de retrait disponible au propriétaire/admin.

### Story 3.6 — Filtrer et trier les tâches

En tant qu’utilisateur, je veux filtrer et trier les tâches, afin de retrouver le travail qui m’intéresse.

**FR :** FR-017. **Repères UX :** filtres combinables, compte visible, effacement simple et quatre tris dans les deux sens.

**Critères d’acceptation :**

- **Étant donné** une liste de tâches, **quand** je choisis plusieurs filtres parmi statut, priorité, membre, tag et échéance, **alors** seules les tâches qui respectent tous les filtres apparaissent.
- **Étant donné** des filtres actifs, **quand** j’ouvre la liste, **alors** leur nombre est visible et « Effacer les filtres » rétablit la liste complète.
- **Étant donné** la liste filtrée ou complète, **quand** je sélectionne échéance, priorité, date de création ou titre et un sens, **alors** l’ordre visible correspond au tri choisi.
- **Étant donné** qu’aucune tâche ne correspond, **quand** les résultats finissent de charger, **alors** l’écran indique qu’aucune tâche ne correspond et propose d’effacer les filtres.

### Story 3.7 — Commenter un projet

En tant que membre, je veux ajouter un commentaire à un projet visible, afin de partager une information avec l’équipe.

**FR :** FR-019–020. **Repères d’architecture :** commentaires possibles sur projet clôturé/annulé; auteur, propriétaire ou administrateur modifient/suppriment selon leurs droits.

**Critères d’acceptation :**

- **Étant donné** un projet que je peux consulter, **quand** j’envoie un commentaire, **alors** le texte apparaît avec mon nom et la date.
- **Étant donné** un commentaire que j’ai écrit, **quand** je choisis de le modifier ou de le supprimer, **alors** le changement est confirmé et visible dans la liste.
- **Étant donné** un commentaire d’une autre personne, **quand** un membre le consulte, **alors** il ne voit pas de commande pour le modifier ou le supprimer; le propriétaire et l’administrateur peuvent le gérer selon leurs droits.
- **Étant donné** un projet clôturé ou annulé que mon rôle me permet encore de voir, **quand** j’ajoute un commentaire autorisé, **alors** il apparaît sans réactiver le projet.

### Story 3.8 — Commenter une tâche

En tant que membre, je veux commenter une tâche que je peux consulter, afin de transmettre une précision sur ce travail.

**FR :** FR-015, FR-019. **Repères d’architecture :** une tâche annulée reste commentable si elle est visible; le commentaire et sa tâche doivent appartenir au même projet.

**Critères d’acceptation :**

- **Étant donné** une tâche d’un projet visible, **quand** j’envoie un commentaire, **alors** le texte apparaît avec le nom de l’auteur et la date.
- **Étant donné** un commentaire que j’ai écrit, **quand** je le modifie ou le supprime, **alors** le changement confirmé apparaît dans la liste.
- **Étant donné** un commentaire d’une autre personne, **quand** je le consulte comme membre, **alors** je ne peux pas le modifier; le propriétaire du projet et l’administrateur disposent des droits de gestion définis au PRD.
- **Étant donné** une tâche annulée visible, **quand** j’ajoute un commentaire autorisé, **alors** le commentaire apparaît et la tâche reste annulée.

### Story 3.9 — Actualiser les tâches et commentaires

En tant qu’utilisateur, je veux actualiser mes tâches et commentaires, afin de voir les changements confirmés par l’équipe.

**FR :** FR-018, FR-037. **Repères UX :** conserver l’écran pendant le chargement et distinguer données anciennes d’une liste vide.

**Critères d’acceptation :**

- **Étant donné** une liste de tâches ou commentaires, **quand** je touche « Actualiser » ou tire vers le bas, **alors** le contenu reste visible pendant le chargement.
- **Étant donné** une mise à jour confirmée, **quand** l’actualisation réussit, **alors** la dernière heure de mise à jour apparaît près de la liste.
- **Étant donné** une erreur réseau, **quand** la liste ne peut pas être actualisée, **alors** le contenu saisi n’est pas perdu, les anciennes données sont identifiées et « Réessayer » est disponible.

## Epic 4 — Comprendre l’avancement dans le tableau de bord

### Story 4.1 — Voir l’avancement global et personnel

En tant que membre du projet, je veux comparer l’avancement du projet au mien, afin de comprendre ma contribution.

**FR :** FR-021–023. **Repères d’architecture :** une lecture/calcul partagé dans PostgreSQL sert les deux progressions et leurs règles identiques.

**Critères d’acceptation :**

- **Étant donné** un projet avec tâches créées, en cours, terminées et annulées, **quand** j’ouvre le tableau de bord, **alors** l’avancement global affiche la moyenne des contributions 0, 0,5 ou 1 par statut et exclut les tâches annulées.
- **Étant donné** des tâches qui me sont attribuées, **quand** je consulte « Avancement personnel », **alors** le même calcul porte seulement sur mes tâches non annulées, y compris pour un propriétaire qui s’est assigné une tâche.
- **Étant donné** qu’aucune tâche admissible n’existe pour le calcul global ou personnel, **quand** le tableau de bord s’affiche, **alors** la progression concernée reste vide plutôt que d’afficher 0 %.
- **Étant donné** le tableau de bord sur téléphone ou tablette, **quand** je le consulte en thème clair ou sombre, **alors** les deux intitulés restent visibles et lisibles.

### Story 4.2 — Voir les tâches par statut et les retards

En tant qu’utilisateur du projet, je veux lire les compteurs de tâches, afin de repérer le travail terminé et celui en retard.

**FR :** FR-024. **Repères d’architecture :** aucun compteur « Annulées »; les tâches terminées et annulées ne sont pas en retard.

**Critères d’acceptation :**

- **Étant donné** un projet avec des tâches dans plusieurs statuts, **quand** le tableau de bord est chargé, **alors** il affiche les compteurs créées, en cours et terminées.
- **Étant donné** des échéances passées, **quand** les compteurs sont affichés, **alors** « En retard » exclut les tâches terminées et annulées.
- **Étant donné** des tâches annulées, **quand** le tableau de bord est affiché, **alors** aucun compteur « Annulées » n’apparaît.

### Story 4.3 — Actualiser le tableau de bord

En tant qu’utilisateur, je veux actualiser le tableau de bord après un changement de tâche, afin de voir les chiffres confirmés.

**FR :** FR-018, FR-021–024. **Repères UX :** actualisation explicite et heure de dernière réussite; aucun affichage temps réel.

**Critères d’acceptation :**

- **Étant donné** le tableau de bord, **quand** je touche « Actualiser », **alors** une indication de chargement apparaît sans effacer les chiffres présents.
- **Étant donné** qu’un membre vient de terminer une tâche, **quand** je rafraîchis avec le bouton ou le geste vers le bas, **alors** les chiffres reflètent son statut confirmé.
- **Étant donné** une actualisation réussie ou échouée, **quand** le tableau de bord revient à l’écran, **alors** il montre l’heure de dernière réussite ou indique que les chiffres visibles sont anciens avec une action pour réessayer.

## Epic 5 — Retrouver une information dans les sources du projet

### Story 5.1 — Poser une question sur les connaissances du projet

En tant que membre d’un projet, je veux poser une question sur ses notes préchargées, afin de retrouver une information sans parcourir tous les documents.

**FR :** FR-025–027, FR-030–032. **Repères d’architecture :** index fictif préparé par Gemini Embeddings dans pgvector; Edge Function applique l’accès RLS du projet puis appelle les interfaces serveur `EmbeddingProvider` et `TextGenerator`; aucun secret dans le client.

**Critères d’acceptation :**

- **Étant donné** un projet de démo avec descriptions, notes, tâches et documents fictifs préchargés, **quand** je pose en français une question dont les mots diffèrent de ceux du passage mais dont le sens y figure, **alors** l’assistant retrouve ce passage et présente une réponse.
- **Étant donné** un membre du projet ou un administrateur, **quand** il interroge l’assistant, **alors** il ne voit que les sources autorisées; un membre hors projet ne peut ni ouvrir cet assistant ni obtenir ses passages.
- **Étant donné** une évolution du fournisseur de génération côté serveur, **quand** la configuration du modèle change, **alors** l’écran garde le même parcours, les mêmes citations et les mêmes messages en français.

### Story 5.2 — Vérifier les sources d’une réponse

En tant que personne qui lit une réponse de l’assistant, je veux voir ses sources, afin de vérifier l’information avant de l’utiliser.

**FR :** FR-028. **Repères d’architecture :** une contrainte lie chaque passage à une source du même projet autorisé.

**Critères d’acceptation :**

- **Étant donné** une réponse appuyée sur un passage retrouvé, **quand** elle apparaît, **alors** une carte affiche le nom de la source et l’extrait utilisé.
- **Étant donné** une source qui possède une destination ouvrable, **quand** je touche son lien, **alors** le contenu s’ouvre dans l’application ou dans la vue prévue sans perdre le contexte du projet.
- **Étant donné** un lien absent de la source, **quand** la citation apparaît, **alors** aucun faux lien n’est affiché.

### Story 5.3 — Comprendre une absence de réponse ou une limite IA

En tant que membre, je veux savoir si l’assistant n’a pas trouvé de réponse ou si son quota est temporairement atteint, afin de décider quoi faire ensuite.

**FR :** FR-029, FR-037. **Repères d’architecture :** plafonds atomiques PostgreSQL de 10 questions par compte et 50 par jour au total; épuisement gratuit = `AI_UNAVAILABLE`, sans appel payant.

**Critères d’acceptation :**

- **Étant donné** une question sans source assez pertinente, **quand** la recherche finit, **alors** l’assistant dit qu’il n’a pas trouvé la réponse et propose de reformuler.
- **Étant donné** une question en cours, **quand** l’assistant cherche, **alors** le message « Recherche dans les sources du projet… » apparaît et un second envoi identique est empêché.
- **Étant donné** une erreur réseau ou le quota quotidien atteint, **quand** la réponse ne peut pas être obtenue, **alors** la question reste affichée, un message simple explique l’indisponibilité et « Réessayer » est proposé; aucune réponse de remplacement inventée n’apparaît.

## Epic 6 — Présenter et vérifier une démo complète

### Story 6.1 — Suivre le parcours de démonstration

En tant que personne qui présente TaskFlow, je veux montrer un propriétaire et un membre accomplissant leur parcours, afin de vérifier l’utilité du produit.

**FR :** FR-038. **Repères d’architecture :** le corpus du projet de démonstration existant reste distinct du nouveau projet créé en direct.

**Critères d’acceptation :**

- **Étant donné** les comptes de démonstration de propriétaire et de membre, **quand** le propriétaire crée un nouveau projet et deux tâches avec échéances, **alors** le projet et les tâches sont visibles dans leurs écrans selon leurs droits.
- **Étant donné** une tâche affectée au membre, **quand** celui-ci la termine puis le présentateur actualise le tableau de bord, **alors** les listes et les chiffres affichent le statut confirmé.
- **Étant donné** le projet préchargé distinct, **quand** le présentateur pose une question à l’assistant, **alors** la réponse cite ses sources sans confondre ce projet avec le nouveau projet.

### Story 6.2 — Installer l’application pour la démo

En tant que personne qui teste TaskFlow, je veux installer un build de démonstration, afin d’essayer l’application sur un appareil sans passer par une boutique.

**FR :** FR-039. **Repères d’architecture :** EAS Free; APK Android pour l’installation sans adhésion payante; Expo Go sur iOS si compatible.

**Critères d’acceptation :**

- **Étant donné** un appareil Android pris en charge, **quand** j’installe l’APK fourni, **alors** l’application s’ouvre sur l’écran de connexion et permet d’utiliser un compte de démo.
- **Étant donné** un appareil iOS, **quand** le parcours utilise Expo Go compatible, **alors** les écrans prévus s’ouvrent sans publication App Store.
- **Étant donné** un nouveau build demandé après l’épuisement du quota EAS gratuit, **quand** le quota n’est pas renouvelé, **alors** aucun dépassement payant n’est déclenché et l’équipe voit qu’elle doit attendre son renouvellement.

### Story 6.3 — Vérifier les droits avec les trois rôles

En tant que responsable de démo, je veux suivre une liste de vérifications sur trois comptes, afin de confirmer que les données restent protégées.

**FR :** FR-040. **Repères d’architecture :** checklist couvre RLS, droits de trois rôles et cloisonnement des sources IA.

**Critères d’acceptation :**

- **Étant donné** les comptes administrateur, propriétaire et membre, **quand** j’ouvre la checklist de vérification, **alors** elle présente les parcours et les écrans attendus pour chaque rôle.
- **Étant donné** un membre sans accès à un autre projet ou un compte désactivé, **quand** je suis les scénarios concernés, **alors** la checklist vérifie l’absence de fuite de données, le refus d’accès et la conservation des tâches après réactivation.
- **Étant donné** les écrans principaux, **quand** l’équipe suit la checklist commune, **alors** elle vérifie les libellés VoiceOver/TalkBack, l’ordre de lecture, le texte agrandi et la taille des commandes tactiles.
- **Étant donné** les règles de sécurité et d’actualisation, **quand** l’équipe suit la checklist technique, **alors** elle vérifie les droits RLS y compris par appel direct et confirme qu’une actualisation ne lance pas de requêtes identiques en double.

### Story 6.4 — Consigner les décisions et vérifications de réalisation

En tant que personne qui relit le développement, je veux consulter un journal de réalisation, afin de comprendre les prompts, choix, erreurs corrigées et contrôles humains.

**FR :** FR-041. **Repères de réalisation :** le journal synthétique versionné est consultable dans le dépôt.

**Critères d’acceptation :**

- **Étant donné** le journal de réalisation ouvert dans le dépôt, **quand** je consulte une entrée de travail terminée, **alors** elle distingue l’intention, le prompt important, la décision et la vérification humaine.
- **Étant donné** une erreur corrigée pendant le travail, **quand** je consulte son entrée, **alors** le problème, la correction et le résultat de la vérification sont lisibles.

## Priorités et éléments pouvant attendre

1. **P0 — Epic 1 :** ouvrir et sécuriser les comptes; sans rôle fiable, les écrans suivants ne peuvent pas afficher les bonnes données.
2. **P1 — Epics 2 et 3 :** gérer les projets puis leurs tâches, membres, filtres et commentaires.
3. **P1 — Epic 4 :** livrer le tableau de bord juste après les projets et tâches; c’est l’un des objectifs les plus importants, mais il dépend de ces données.
4. **P2 — Epic 5 :** l’assistant et les citations peuvent attendre que le cœur projets/tâches/tableau de bord soit démontrable.
5. **P2 — Epic 6 :** finaliser le build, les scénarios manuels complets et le journal après les parcours principaux; ces éléments sont requis avant la démonstration complète.

Les fonctions hors périmètre du MVP listées dans le PRD — publication en boutique, navigateur, hors ligne, notifications, SSO/MFA, messagerie instantanée, import libre, production et exploitation avancée — peuvent attendre une phase ultérieure.

## Ordre de réalisation recommandé

Le premier compte administrateur est créé dans Supabase avant les parcours de l’application. Construire ensuite les stories dans cet ordre, en gardant les dépendances entre projets, tâches et tableau de bord :

1. **P0 — Accès et comptes :** 1.1, 1.2, 1.3, 1.4, 1.5.
2. **P1 — Projets et membres :** 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7.
3. **P1 — Tâches et collaboration :** 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9.
4. **P1 — Tableau de bord :** 4.1, 4.2, 4.3.
5. **P2 — Assistant :** 5.1, 5.2, 5.3.
6. **P2 — Démonstration et vérification :** 6.2, 6.1, 6.3.

La story 6.4 (journal de réalisation) commence dès le début du développement et est tenue à jour au fil des stories; sa vérification finale se fait avec l’Epic 6. Les parcours principaux peuvent être vérifiés au fur et à mesure, tandis que le build installable et la checklist complète sont finalisés avant la démonstration complète. La mesure des objectifs de performance provisoires du NFR-008 est reportée après le MVP.

Les déploiements en production, publication en boutique, fonctionnement hors ligne, notifications, SSO/MFA, import libre de fichiers, sauvegardes et supervision restent hors MVP selon le PRD; ils ne sont pas transformés en epics.

