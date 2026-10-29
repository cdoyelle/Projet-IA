---
title: "PRD — TaskFlow Mobile"
status: draft
created: 2026-10-27
updated: 2026-10-28
---

# PRD — TaskFlow Mobile

**Statut :** brouillon mis à jour après validation des décisions produit  
**Produit :** application mobile de gestion de projet pour les équipes TaskFlow  
**Source :** [Cahier des charges GDU](sources/cahier-des-charges.pdf) et décisions confirmées par le commanditaire le 28 octobre 2026.

## 1. Résumé

TaskFlow Mobile aide les équipes à organiser leurs projets, répartir les tâches et suivre l’avancement collectif et personnel depuis un téléphone ou une tablette. L’application comprend un assistant qui recherche dans les connaissances préchargées d’un projet et cite les sources utilisées.

Le MVP est une application React Native pour iOS et Android, utilisable sur téléphone et tablette. Il s’appuie sur Supabase, notamment Auth, PostgreSQL, les règles RLS, Storage au besoin et pgvector. Les réponses et embeddings sont générés par Gemini, côté serveur. Les modèles Gemini précis seront choisis durant la phase d’architecture, avant leur implémentation.

Le MVP vise une démonstration fonctionnelle en environnement de développement/démonstration. Il n’inclut ni accès navigateur, ni publication sur les boutiques. Un build installable permettra les essais sur simulateur ou appareil. Les listes et tableaux se rafraîchissent manuellement.

## 2. Utilisateurs et besoins

| Utilisateur | Besoin principal |
|---|---|
| Administrateur TaskFlow | Inviter et gérer les comptes, créer des projets et disposer des droits de propriétaire sur tous les projets. |
| Propriétaire d’un projet | Créer et gérer le projet, gérer ses membres et ses tâches, suivre l’avancement et commenter. |
| Membre d’un projet | Consulter le projet et ses tâches, changer le statut des tâches qui lui sont attribuées, commenter et suivre son avancement personnel. |

### Besoin principal

Une équipe doit pouvoir comprendre l’avancement global d’un projet, voir le travail attribué à chaque personne et retrouver une information déjà partagée. Le MVP met cette hypothèse à l’épreuve avec une démonstration menée du point de vue du propriétaire et d’un membre chargé d’une tâche.

## 3. Objectifs et critères de réussite

| Objectif | Critère observable pour la démonstration |
|---|---|
| Valider les droits des rôles | Trois comptes distincts — administrateur, propriétaire et membre — permettent de vérifier manuellement les droits et le cloisonnement des données. |
| Montrer la gestion d’un projet | Le propriétaire crée un projet pendant la démonstration, puis deux tâches obligatoires à échéance et les attribue. |
| Montrer la collaboration et le suivi | Le membre change le statut d’une tâche qui lui est attribuée. Après actualisation manuelle, les listes et les tableaux de bord présentent les nouvelles données. |
| Comprendre l’avancement | Tous les utilisateurs voient l’avancement global du projet et leur avancement personnel, ainsi que les compteurs globaux de tâches par statut et de tâches en retard. |
| Vérifier l’assistant | Une question sur les données fictives d’un projet de démonstration préchargé produit une réponse avec nom de source, extrait et lien si disponible. Sans information pertinente, l’assistant dit clairement qu’il n’a pas trouvé la réponse. |
| Préserver les données entre projets | Un membre ne peut consulter ni rechercher les données d’un projet dont il n’est pas membre, y compris par appel direct aux services de données. L’administrateur constitue l’exception globale autorisée. |

Le succès de la démonstration est l’exécution de ces parcours et la vérification manuelle des règles d’accès. Les objectifs provisoires de performance sont indiqués au § 7; la méthode détaillée de mesure sera définie en architecture.

## 4. Périmètre du MVP

### Inclus

- Invitations par e-mail et comptes avec authentification e-mail/mot de passe, session persistante, déconnexion, expiration de session et réinitialisation du mot de passe.
- Profil créé avec le compte : prénom et nom obligatoires, saisis par l’administrateur lors de l’invitation et modifiables ensuite; avatar facultatif.
- Rôles administrateur, propriétaire de projet et membre; droits appliqués côté serveur et par RLS.
- Projets avec statuts « Actif », « Clôturé » ou « Annulé », dates préremplies, membres et règles de réactivation.
- Tâches avec titre, description facultative, échéance obligatoire, priorité, statut, affectation et tags; commentaires sur les projets et les tâches.
- Filtres combinables, tris, tableau de bord avec avancement global/personnel et compteurs de projet.
- Actualisation manuelle de toutes les listes et des tableaux de bord, par bouton « Actualiser » ou geste de tirer vers le bas.
- Connaissances fictives préchargées dans un projet de démonstration; recherche et réponses sourcées avec Gemini et Supabase pgvector.
- Écrans adaptés aux téléphones et tablettes iOS/Android, thème suivant le réglage clair/sombre du système, états de chargement/réussite/erreur et validation des formulaires.
- Build installable pour les essais et démonstrations; scénarios de tests manuels sur trois profils; journal synthétique de vibe coding.

### Hors périmètre du MVP

- Publication sur l’App Store ou Google Play, version accessible dans un navigateur, notifications push et fonctionnement hors ligne.
- SSO et double authentification (MFA).
- Messagerie instantanée complète et import libre de fichiers par les utilisateurs.
- Environnement de production et dossiers d’exploitation, de continuité ou de conformité : ils sont reportés à une étape ultérieure.
- Rapport formel de tests IA, fiche détaillée sur les données et l’index RAG, et dossier documentant les garde-fous IA : ils sont reportés à une étape ultérieure. Les exigences fonctionnelles de réponse sourcée et de réponse d’incertitude restent dans le MVP.

## 5. Fonctionnalités et exigences fonctionnelles

Les identifiants FR sont stables et globaux. « Propriétaire » désigne le propriétaire du projet; l’administrateur possède des droits globaux tels que décrits ci-dessous.

### F1 — Authentification et profil

- **FR-001 — Exigence du cahier.** Une personne peut être invitée par e-mail et activer son compte avec une adresse e-mail et un mot de passe via Supabase Auth. L’adresse e-mail est unique.
- **FR-002 — Exigence du cahier.** L’application conserve la session, permet la déconnexion et demande une nouvelle connexion lorsqu’une session expire. Une session désactivée ne donne plus accès aux écrans protégés.
- **FR-003 — Exigence du cahier.** Le profil est créé avec le compte. Le prénom et le nom sont obligatoires; l’administrateur les renseigne lors de l’invitation. La personne peut ensuite les modifier. L’avatar est facultatif et peut être stocké dans Supabase Storage.
- **FR-004 — Ajout confirmé.** Une personne peut demander un lien de réinitialisation de mot de passe par e-mail.

**Critère d’acceptation :** l’administrateur invite un compte en renseignant prénom et nom; la personne active le compte, définit son mot de passe, corrige son profil si nécessaire, ferme et rouvre l’application, puis retrouve sa session. Une demande de réinitialisation déclenche l’envoi d’un lien. Après déconnexion ou expiration, un écran protégé demande une nouvelle authentification.

### F2 — Projets et membres

- **FR-005 — Exigence du cahier.** Un membre consulte les projets auxquels il appartient. L’administrateur peut consulter tous les projets.
- **FR-006 — Règle de droits confirmée.** Le propriétaire crée et modifie son projet et en change le statut. L’administrateur peut créer des projets et exercer les droits de propriétaire sur tous les projets. Un membre consulte le projet sans en modifier les informations.
- **FR-007 — Règle de cycle de vie confirmée.** Un projet peut être « Actif », « Clôturé » ou « Annulé ». La date de début est préremplie lors de la création et la date de clôture lors de la clôture ou de l’annulation; le propriétaire ou l’administrateur peut modifier les dates lorsque le projet est actif.
- **FR-008 — Exigence du cahier, précision confirmée.** Le propriétaire et l’administrateur peuvent consulter les membres et ajouter ou retirer un compte existant et actif. Ils ne peuvent pas inviter une nouvelle personne depuis l’écran des membres du projet.
- **FR-009 — Règle de cycle de vie confirmée.** Un projet clôturé reste consultable. Les informations du projet et ses tâches sont en lecture seule jusqu’à sa réouverture par le propriétaire ou l’administrateur. Les commentaires restent permis. Lorsqu’un projet clôturé est rouvert, sa date de clôture précédente est conservée.
- **FR-010 — Règle de cycle de vie confirmée.** Un projet n’est jamais supprimé physiquement. Le propriétaire ou l’administrateur peut l’annuler; il n’est alors visible que par son propriétaire et les administrateurs. Le propriétaire ou l’administrateur peut le réactiver. À sa réactivation, la date de clôture est effacée. Les commentaires restent permis aux personnes qui peuvent voir le projet.
- **FR-011 — Règle de retrait confirmée.** Lorsqu’un membre est retiré d’un projet, il perd immédiatement l’accès à ce projet et à son assistant. Les tâches qui lui étaient attribuées restent dans le projet et affichent « Membre à attribuer » jusqu’à leur réattribution.

**Critère d’acceptation :** vérifier avec un propriétaire et un membre que le membre ne voit que ses projets et ne peut pas modifier les informations du projet. Vérifier qu’un propriétaire/admin peut ajouter un compte existant actif, mais pas inviter depuis le projet; qu’un projet clôturé est consultable et verrouillé sauf commentaires; qu’un projet annulé est accessible au propriétaire/admin, invisible aux autres membres et réactivable avec effacement de la date de clôture.

### F3 — Tâches, affectations et commentaires

- **FR-012 — Règle de droits confirmée.** Le propriétaire et l’administrateur peuvent créer, consulter, modifier et gérer les tâches du projet. Un membre peut consulter les tâches du projet et changer uniquement le statut des tâches qui lui sont attribuées.
- **FR-013 — Exigence du cahier, précision confirmée.** Une tâche comporte un titre obligatoire, une description facultative, une échéance obligatoire, une priorité (« Basse », « Normale », « Haute »), un statut et zéro ou plusieurs tags textuels propres au projet. Elle peut être affectée à un compte actif membre du projet.
- **FR-014 — Statuts confirmés.** Les statuts sont « Créée », « En cours », « Terminée » et « Annulée ». Une personne assignée peut faire passer une tâche directement de « Créée » à « Terminée » et remettre une tâche « Terminée » à « En cours ». Une tâche terminée doit repasser « En cours » avant que ses autres champs soient modifiés.
- **FR-015 — Règle d’annulation confirmée.** Seul le propriétaire ou l’administrateur peut annuler ou réactiver une tâche. Une tâche annulée est visible par tous les membres du projet, ne peut être modifiée par la personne assignée et reprend son statut antérieur lors de sa réactivation. Des commentaires peuvent encore y être ajoutés.
- **FR-016 — Règle de suppression confirmée.** La suppression physique d’une tâche est possible uniquement si elle est toujours « Créée », n’a jamais été commencée et n’a aucun commentaire. Une tâche commencée, traitée ou commentée ne peut pas être supprimée physiquement; elle peut seulement être annulée par le propriétaire ou l’administrateur.
- **FR-017 — Exigence du cahier, précision confirmée.** Les tâches peuvent être filtrées par statut, priorité, membre, tag et échéance. Les filtres sont combinables. Les tâches peuvent être triées par échéance, priorité, date de création ou titre, en ordre croissant ou décroissant.
- **FR-018 — Mise à jour confirmée pour le MVP.** Les listes de projets, membres, tâches et commentaires ainsi que les tableaux de bord s’actualisent manuellement par bouton « Actualiser » et par geste de tirer vers le bas. Une liste peut signaler que les données affichées datent de la dernière actualisation. Le MVP n’exige pas de mise à jour en temps réel.
- **FR-019 — Collaboration confirmée.** Les membres peuvent commenter les projets et les tâches. L’auteur du commentaire et le propriétaire du projet peuvent le modifier ou le supprimer; l’administrateur dispose des mêmes droits de propriétaire. Les commentaires peuvent être ajoutés sur un projet clôturé ou annulé et sur une tâche annulée, sous réserve des droits de visibilité du contenu.
- **FR-020 — Précision de cycle de vie confirmée.** Dans un projet clôturé, les membres ne peuvent pas modifier les champs des tâches jusqu’à la réouverture. Les commentaires restent permis.

**Critère d’acceptation :** le propriétaire crée deux tâches avec les champs requis et assigne l’une au membre. Ce membre peut modifier le statut de sa tâche, y compris la terminer directement puis la remettre en cours, mais ne peut modifier ni titre, ni description, ni priorité, ni date, ni tags. Un compte désactivé ne peut être affecté. Vérifier les filtres combinés, les quatre tris et leurs deux directions, les règles de suppression/annulation, la réactivation au statut antérieur et les commentaires selon les droits ci-dessus.

### F4 — Tableau de bord et avancement

- **FR-021 — Exigence du cahier, précision confirmée.** Tous les utilisateurs du projet voient deux colonnes : « Avancement global » et « Avancement personnel ». Le propriétaire peut s’attribuer des tâches; sa colonne personnelle suit donc la même règle que celle d’un membre.
- **FR-022 — Calcul confirmé pour le MVP.** Chaque tâche non annulée contribue comme suit : « Créée » = 0; « En cours » = 0,5; « Terminée » = 1. L’avancement global est la somme des contributions des tâches non annulées divisée par leur nombre, exprimée en pourcentage. L’avancement personnel applique la même formule aux tâches non annulées affectées à l’utilisateur courant.
- **FR-023 — Calcul confirmé pour le MVP.** Si le projet ou l’utilisateur n’a aucune tâche non annulée dans le calcul concerné, la cellule d’avancement reste vide. Les tâches annulées sont exclues du numérateur et du dénominateur.
- **FR-024 — Exigence du cahier, précision confirmée.** Le tableau de bord montre à tous les membres les compteurs globaux du projet pour les tâches « Créées », « En cours », « Terminées » et « En retard ». Il n’affiche pas de compteur séparé des tâches annulées. Une tâche est en retard si son échéance est passée et son statut n’est ni « Terminée » ni « Annulée ».

**Critère d’acceptation :** avec des tâches aux quatre statuts, vérifier que les tâches annulées ne contribuent pas à l’avancement et qu’aucun compteur « Annulée » n’est affiché. Vérifier les valeurs globales et personnelles après actualisation manuelle; une tâche sans échéance ne peut pas être créée; une tâche terminée ou annulée n’est pas comptée en retard. Si le dénominateur est nul, la cellule est vide.

### F5 — Assistant IA et recherche sémantique

- **FR-025 — Exigence du cahier, précision confirmée.** L’espace de connaissances est propre à chaque projet et contient des descriptions, notes, tâches et documents de démonstration fictifs préchargés par l’équipe. L’import libre de fichiers par les utilisateurs n’est pas requis.
- **FR-026 — Exigence du cahier.** Les contenus utiles sont découpés en passages, convertis en embeddings et stockés avec leurs métadonnées et leur identifiant de projet dans Supabase pgvector.
- **FR-027 — Exigence du cahier.** Un utilisateur peut poser une question en langage naturel sur un projet auquel il a accès. La recherche retourne uniquement les contenus autorisés pour son rôle.
- **FR-028 — Exigence du cahier, précision confirmée.** L’assistant formule une réponse à partir des passages retrouvés et présente pour chaque source disponible son nom, l’extrait utilisé et un lien ouvrable lorsque la source peut être ouverte dans l’application.
- **FR-029 — Exigence du cahier, précision confirmée.** Si l’assistant ne trouve pas de source suffisamment pertinente, il dit clairement qu’il n’a pas trouvé la réponse à la question et ne fabrique pas de réponse.
- **FR-030 — Choix technique confirmé.** Gemini fournit la génération des réponses et les embeddings au lancement du MVP. Les appels sont effectués côté serveur; aucune clé secrète n’est embarquée dans l’application mobile.
- **FR-031 — Règle d’accès confirmée.** Un membre ne peut interroger que les contenus des projets dont il est membre. L’administrateur peut consulter et interroger tous les projets, y compris sans en être membre. Ces droits sont vérifiés côté serveur et dans les règles de la base, y compris pour la recherche vectorielle.
- **FR-032 — Choix confirmé.** L’architecture permet de remplacer ultérieurement le fournisseur de génération par des changements limités au serveur. Le MVP n’offre pas de sélection de fournisseur dans l’application.

**Critère d’acceptation :** depuis le projet préchargé, poser une question dont la réponse figure dans les données et vérifier la réponse, le nom de source, l’extrait et le lien disponible. Poser une question sans réponse dans les sources et vérifier le message explicite d’absence de réponse. Vérifier qu’un membre non autorisé ne peut obtenir les passages d’un autre projet, tandis que l’administrateur peut les consulter.

### F6 — Administration des comptes

- **FR-033 — Ajout confirmé.** L’administrateur peut inviter une personne par e-mail en saisissant son prénom et son nom. La personne invitée choisit son mot de passe à l’activation, puis peut corriger son profil. Un propriétaire de projet ne peut sélectionner que des comptes déjà existants en base.
- **FR-034 — Ajout confirmé.** L’administrateur peut désactiver un compte. La personne ne peut alors plus se connecter et ses sessions actives sont invalidées. Ses appartenances aux projets et ses tâches sont conservées; ses tâches affichent « Utilisateur désactivé » jusqu’à réattribution. Un compte désactivé ne peut être ajouté à un projet ni recevoir une nouvelle tâche.
- **FR-035 — Ajout confirmé.** L’administrateur peut réactiver un compte. La personne retrouve ses appartenances aux projets et ses tâches antérieures.

**Critère d’acceptation :** vérifier qu’un compte désactivé ne peut ouvrir une nouvelle session ni continuer une session existante; qu’il ne peut recevoir de nouvelle appartenance ou affectation; que ses tâches restent visibles avec la mention prévue; puis qu’après réactivation ses relations de projet et tâches antérieures sont restaurées.

### F7 — Expérience, erreurs et livrables de démonstration

- **FR-036 — Exigence du cahier.** Les formulaires valident les champs obligatoires et le format des informations avant envoi. Le champ invalide indique ce qui doit être corrigé; le formulaire n’est pas envoyé tant que l’erreur persiste.
- **FR-037 — Exigence du cahier.** Les parcours principaux présentent les états suivants : chargement pendant une demande; confirmation après création, modification ou commentaire réussi; message d’erreur et possibilité de réessayer après une erreur réseau; message de droits insuffisants sans afficher le contenu protégé; état vide lorsqu’aucune donnée n’est disponible.
- **FR-038 — Scénario de démonstration confirmé.** Le propriétaire et un membre présentent chacun leur point de vue. Le propriétaire crée un projet et deux tâches pendant la démonstration; le membre change le statut de la tâche qui lui est attribuée; les tableaux de bord évoluent après actualisation manuelle. L’assistant est interrogé sur les données préchargées d’un projet de démonstration existant.
- **FR-039 — Livrable de réalisation.** Un build installable permet de lancer l’application sur un simulateur ou un appareil, sans publication dans une boutique.
- **FR-040 — Livrable de réalisation.** Le projet comporte des scénarios de tests manuels pour les parcours principaux, les trois rôles et les politiques d’accès Supabase/RLS.
- **FR-041 — Livrable de réalisation.** Un journal synthétique de vibe coding décrit les intentions et prompts importants, les décisions, les erreurs corrigées et les vérifications humaines.

## 6. Règles métier importantes

1. **Rôles.** Le propriétaire gère le projet et ses tâches; le membre consulte le projet et ne change que le statut des tâches qui lui sont affectées. L’administrateur a les droits du propriétaire sur tous les projets et peut gérer les comptes.
2. **Accès projet.** L’appartenance active est nécessaire pour qu’un membre consulte un projet et ses données. L’administrateur est explicitement autorisé à accéder à tous les projets et à leurs contenus IA.
3. **Comptes désactivés.** L’accès est immédiatement bloqué, les sessions sont invalidées et les relations de projet/tâche sont conservées. La réactivation restaure l’accès à ces relations.
4. **Projet clôturé.** Il reste consultable; seuls les commentaires restent modifiables/ajoutables jusqu’à la réouverture par propriétaire ou administrateur. La date de clôture précédente est conservée lors de la réouverture.
5. **Projet annulé.** Il n’est pas supprimé physiquement. Seuls le propriétaire et l’administrateur le voient; ils peuvent le réactiver. La date de clôture est effacée lors de la réactivation.
6. **Tâches et affectation.** Une tâche est affectée à un compte actif membre du projet. Si le membre est retiré, l’affectation devient « Membre à attribuer » et le membre retiré perd l’accès au projet.
7. **Statut d’une tâche.** Les contributions à l’avancement sont 0, 0,5, 1 et 0 pour « Créée », « En cours », « Terminée » et « Annulée ». Les tâches annulées sont exclues du calcul.
8. **Verrouillage et suppression d’une tâche.** Une tâche terminée doit repasser « En cours » avant modification de ses autres champs. La suppression physique n’est permise que pour une tâche toujours « Créée », jamais commencée et sans commentaire; autrement, seul le statut « Annulée » permet de la retirer du travail actif.
9. **Tâche annulée.** Seul le propriétaire ou l’administrateur peut l’annuler/réactiver. Elle reste visible aux membres du projet, peut recevoir des commentaires et reprend son statut antérieur à sa réactivation.
10. **Commentaires.** Les membres peuvent commenter les projets et tâches visibles. L’auteur et le propriétaire peuvent modifier/supprimer un commentaire; l’administrateur détient les droits du propriétaire.
11. **Retard.** Une tâche est en retard lorsque son échéance est passée et qu’elle n’est ni terminée ni annulée.
12. **Rafraîchissement.** Pour le MVP, les listes et tableaux se mettent à jour sur action explicite ou geste de tirer vers le bas; aucune fraîcheur en temps réel n’est promise.
13. **Données de démonstration.** Les contenus utilisés par l’assistant sont fictifs et préchargés. Les deux tâches créées pendant la démonstration appartiennent au nouveau projet et ne remplacent pas le projet existant qui porte les données de connaissances.

## 7. Exigences non fonctionnelles

- **Sécurité et confidentialité.** Authentifier les utilisateurs; appliquer les autorisations sur les projets, membres, profils, tâches, commentaires, avatars et passages vectoriels. Les règles s’appliquent aussi aux accès directs et aux fonctions serveur. L’administrateur dispose de l’exception globale définie dans ce PRD.
- **Protection des secrets.** Les clés Gemini et Supabase privilégiées sont conservées côté serveur, jamais dans l’application mobile.
- **Session.** Conserver la session de manière sécurisée, gérer expiration et déconnexion; invalider toute session lors de la désactivation du compte.
- **Ergonomie et accessibilité.** Parcours principaux utilisables sur téléphones et tablettes iOS/Android; le thème clair/sombre suit le réglage système de l’appareil. Vérification manuelle sur les deux plateformes et thèmes : les champs et actions ont des libellés lus par le lecteur d’écran, l’ordre de lecture est cohérent, le texte peut être agrandi sans masquer les actions, le contraste permet de lire textes et états, et les commandes tactiles restent utilisables.
- **Mises à jour.** Une action manuelle rafraîchit toutes les listes et les tableaux de bord sans rechargement global de l’application.
- **Langue.** Interface et assistant en français au lancement du MVP.
- **Disponibilité.** Une connexion Internet est requise pour les fonctions métier; aucun mode hors ligne n’est prévu.
- **Performance provisoire.** Sur une connexion stable et un jeu de données de démonstration, les écrans usuels s’affichent en moins de 3 secondes et une réponse IA revient en moins de 10 secondes au 95e percentile. En phase d’architecture, avant de retenir ces valeurs comme critères d’acceptation, fixer un appareil de référence par plateforme, un jeu de données, une connexion de référence et un protocole reproductible couvrant l’ouverture d’écran et un ensemble de questions de démonstration.
- **Données de démonstration.** Les données projet utilisées dans le MVP sont fictives. Aucun contenu réel ou personnel de projet ne doit être nécessaire aux parcours de démonstration.

## 8. Décisions différées

Les sujets suivants ne bloquent pas le cadrage des parcours validés et seront traités à l’étape indiquée :

| Sujet | Traitement prévu |
|---|---|
| Modèles Gemini précis | Comparer la qualité en français, le coût et la rapidité durant l’architecture, avant l’implémentation IA. |
| Version minimale d’iOS/Android et protocole de performance | À fixer lors de la conception des builds installables; mesurer sur un appareil de référence et un jeu de données de démonstration stable avant de transformer les objectifs provisoires en critères d’acceptation. |
| Déploiement serveur, environnements, mise en production et retour arrière | Reporté à une étape ultérieure; le MVP reste en environnement développement/démonstration. |
| Sauvegardes, RPO/RTO, supervision, journaux, alertes, support, SLA et dossier RGPD/conformité | Reportés à une étape ultérieure avec le dossier d’exploitation. |
| Rapport formel d’évaluation IA (pertinence, hallucinations, délai et estimation du coût) | Reporté à une étape ultérieure; les critères fonctionnels de réponse sourcée et d’absence de réponse restent requis au MVP. |
| Fiche détaillée des données et de l’index RAG (sources, découpage, mise à jour, droits) | Reportée à une étape ultérieure; les contenus préchargés et les règles d’accès sont définis ici. |
| Dossier de garde-fous IA (modération, données personnelles, journaux, limites et incidents) | Reporté à une étape ultérieure. Les données de démonstration restent fictives. |
| MFA et SSO | Non nécessaires au MVP; l’accès initial se fait par invitation e-mail et mot de passe. |
| Déploiement Edge Function ou service serveur équivalent | Choix à arrêter en architecture; le traitement IA reste côté serveur. |

## 9. Limites et risques du MVP

- La qualité des réponses dépend des données fictives préchargées, du découpage, du modèle d’embeddings et du seuil de pertinence.
- Le rafraîchissement manuel signifie que les listes peuvent rester périmées jusqu’à l’action de l’utilisateur; l’interface doit rendre cette situation compréhensible.
- Les modèles Gemini précis et leurs paramètres sont sélectionnés après comparaison durant l’architecture.
- Le MVP n’est pas publié dans les boutiques et ne comprend pas d’interface navigateur ni d’environnement de production.
- La mise en place des dossiers d’exploitation, de continuité, de conformité et des rapports IA est reportée comme indiqué au § 8.

## 10. Validation attendue

Les décisions produit présentées dans ce brouillon ont été confirmées par le commanditaire au cours de la validation du 28 octobre 2026. Les modèles précis, les versions minimales des systèmes mobiles et les choix de déploiement serveur restent à traiter durant la phase d’architecture ou les étapes ultérieures indiquées au § 8.

## 11. Références et décisions confirmées

- Cahier des charges pédagogique GDU fourni par le commanditaire : [sources/cahier-des-charges.pdf](sources/cahier-des-charges.pdf). Repères : exigences d’authentification, projets, tâches et tableau de bord p. 2; IA et backend Supabase p. 3; contraintes techniques, interfaces et critères de réussite p. 4; livrables de déploiement/exploitation p. 5; livrables IA p. 5–6.
- Choix mobile : React Native; cibles iOS et Android, téléphones et tablettes; pas de version navigateur ni publication boutique au MVP.
- Choix backend et recherche : Supabase, Auth/RLS, pgvector; Gemini pour génération et embeddings; modèles précis reportés à l’architecture.
- Décisions métier : rôles administrateur/propriétaire/membre, droits, statuts projet/tâche, calculs du tableau de bord, commentaires, actualisation manuelle, comptes désactivés et règles de suppression décrits dans les FR et règles métier ci-dessus.
- Réalisation : démonstration en environnement dev/démo, build installable, données fictives, trois comptes de rôles et tests manuels; journal de vibe coding.
