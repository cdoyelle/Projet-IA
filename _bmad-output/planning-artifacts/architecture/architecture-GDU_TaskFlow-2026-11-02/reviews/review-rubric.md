# Revue indépendante — Architecture TaskFlow Mobile

Date : 2026-11-04  
Périmètre : ARCHITECTURE-SPINE.md comparée au PRD, à son addendum, à EXPERIENCE.md et à DESIGN.md.  
Verdict : **base cohérente, validation conditionnelle**. Les principaux parcours et contraintes de sécurité ont une brique identifiable. Quelques exigences restent seulement implicites ou absentes du tableau de correspondance ; elles devraient être rendues visibles avant de considérer la couverture complète.

## Points à traiter avant validation

### Élevé — Le calcul précis du tableau de bord n’est pas fixé par l’architecture

FR-021 à FR-024 donnent les règles de calcul : valeurs 0 / 0,5 / 1, exclusion des tâches annulées, progression vide si le dénominateur est nul, compteurs et définition du retard. AD-3 dit que les valeurs sont dérivées de l’état persistant, mais ne choisit ni une source de calcul partagée (requête, vue ou fonction), ni ne reprend les règles exactes. Deux écrans ou requêtes pourraient donc afficher des résultats différents. Ajouter une règle commune de calcul côté base et y rattacher explicitement FR-021 à FR-024.

### Élevé — Les exigences de livrables FR-040 et FR-041 n’ont pas de brique

Le tableau « Capability → Architecture Map » s’arrête à FR-039. L’addendum demande des scénarios d’essais manuels couvrant les rôles et les politiques d’accès Supabase/RLS (FR-040), ainsi qu’un journal synthétique de réalisation (FR-041). Ce ne sont pas des fonctions de l’application, mais ce sont bien des livrables du MVP : leur emplacement et leur responsable restent à nommer, ou à déclarer explicitement hors du périmètre de l’architecture applicative.

### Moyen — L’invitation, le profil et l’administration des comptes sont trop condensés

FR-001 à FR-004 et FR-033 à FR-035 sont regroupés dans une ligne générale « Accounts, profiles and roles ». AD-5 sécurise les opérations privilégiées, mais ne distingue pas les responsabilités de Supabase Auth (connexion, activation, réinitialisation), de la table des profils (noms, avatar, actif/inactif), du stockage facultatif des avatars, ni des opérations serveur d’invitation/désactivation/réactivation. Le tableau UX prévoit un écran profil et administration des comptes. Nommer ces éléments dans la carte de couverture rendrait la brique de chaque exigence et de cet écran vérifiable.

### Moyen — Le modèle relationnel ne montre pas toutes les données demandées

L’addendum demande explicitement les tags et leur association aux tâches, les commentaires rattachés à un projet ou à une tâche, les profils et l’état de compte, ainsi que les contenus et passages de connaissance. Le diagramme montre plusieurs de ces entités, mais pas les tags, le rattachement polymorphe/équivalent des commentaires, ni les profils et leur état. Comme le document est un « spine » et doit rester bref, une liste des propriétaires/données clés ou des contraintes minimales suffit ; il n’est pas nécessaire de figer tout le schéma.

## Correspondance de couverture relevée

| Exigences / écrans | Brique annoncée dans le spine | État |
|---|---|---|
| FR-001–004, FR-033–035 ; connexion, mot de passe oublié, profil et administration des comptes | Supabase Auth, profils, fonction admin, RLS ; AD-2 et AD-5 | Partielle : les écrans et domaines sont regroupés, responsabilités à préciser |
| FR-005–011 ; liste et détail de projet, membres | Projets et appartenances PostgreSQL, écrans Expo ; AD-2 et AD-6 | Couvert, le retrait immédiat est protégé par l’appartenance active |
| FR-012–020 ; tâches, formulaires, commentaires, filtres et tri | PostgreSQL, fonction transactionnelle de mutation, écrans Expo ; AD-2, AD-3 et AD-6 | Couvert pour les règles de mutation ; détails de stockage des tags/commentaires absents du diagramme |
| FR-021–024 ; accueil/tableau de bord et Mes tâches | Lectures/vues PostgreSQL, écrans Expo ; AD-3 et AD-7 | Partiel : formule et cas sans tâches non fixés comme invariant partagé |
| FR-025–032 ; assistant, sources et citations | Edge Function, Gemini, pgvector et passages ; AD-2, AD-4, AD-5, AD-8 | Couvert ; les sources sont cloisonnées par projet et la séparation génération/embeddings est prévue |
| FR-036–039 ; formulaires, états, expérience et build installable | Expo et état UI partagé ; AD-1, AD-7, AD-9 | Couvert au niveau architectural ; accessibilité, français, thème et tablette sont des règles UX à conserver dans l’implémentation |
| FR-040–041 ; essais manuels et journal de réalisation | Aucune ligne dans la carte | Non représenté ; préciser les livrables et leur emplacement |
| Écrans UX : connexion, accueil, projets, détail, Mes tâches, Assistant, formulaires, membres, profil/admin | Navigation Expo Router et « project screens » | Les écrans centraux sont couverts, mais le profil/admin et les écrans de formulaire ne sont pas nommés individuellement dans la carte |

## Hypothèses et éléments non confirmés

- Le fournisseur d’envoi d’e-mails reste une hypothèse : Supabase intégré pour la démo, SMTP éventuellement plus tard. Cela affecte invitations et réinitialisations.
- Le modèle Gemini de génération est encore candidat ; le modèle d’embedding et sa dimension sont proposés dans le tableau Stack et doivent être confirmés par comparaison de qualité, coût et rapidité demandée par le PRD.
- La taille des passages, le seuil de pertinence et le protocole de qualité des réponses restent différés.
- Les versions Expo, React Native, React, SecureStore, Supabase JS et les modèles Gemini sont nommés dans le spine ; cette revue ne valide pas leur actualité par une vérification documentaire web. La liste d’examen de versions configurée demande une telle vérification.
- La cible de coût et la règle « 10 comptes / 5 utilisateurs simultanés » apparaissent dans le memlog et le spine, mais le coût mensuel réel dépend du maintien du projet Supabase éveillé, de l’usage IA, des builds EAS et des options de distribution iOS. Le document décrit des coûts possibles, sans budget consolidé ni seuil d’activation.
- Le traitement de l’avatar est facultatif dans le PRD et évoqué par RLS/Storage, mais son stockage et ses règles de lecture/écriture ne sont pas explicités.

## Changements difficiles à faire plus tard

- Changer de modèle d’embeddings exige de recalculer et réindexer le corpus ; le spine le signale déjà.
- Remplacer le fournisseur de génération reste relativement contenu côté serveur si l’interface TextGenerator est respectée.
- Remplacer Supabase ou changer l’autorité des droits serait coûteux : données, Auth, règles RLS, fonctions SQL, Storage, fonctions Edge et recherche vectorielle sont imbriqués dans la solution.
- Le choix d’une application Expo/React Native plutôt qu’une application web fixe les cibles de plateforme et les parcours natifs ; une version navigateur ultérieure demanderait un client distinct ou une refonte de présentation.
- Les règles de conservation des projets/tâches et les statuts persistés structurent migrations, historique et affichage. Modifier les règles de suppression ou de réactivation après chargement des données de démonstration demandera migrations et mise à jour des écrans.

## Coûts à expliciter pour le commanditaire

- Supabase peut commencer sur une offre gratuite pour les essais, avec le risque de mise en veille mentionné dans le memlog ; garder la démo disponible en continu peut déclencher un abonnement payant.
- Les requêtes Gemini peuvent avoir un coût selon les modèles, quotas et volumes en vigueur ; le coût commence avec l’usage dépassant les quotas gratuits applicables.
- Les builds cloud Expo EAS peuvent rester dans les quotas gratuits ou devenir payants si l’utilisation dépasse l’offre applicable.
- Les essais iOS sur appareils physiques et la distribution privée via les services Apple peuvent nécessiter un abonnement développeur annuel ; la distribution Android en APK ne nécessite pas ce compte.
- Un serveur SMTP externe pourrait ajouter un coût si l’envoi intégré ne suffit plus.

## Suite suggérée

Lors de la mise à jour, préciser la formule dashboard commune, rendre les lignes de couverture FR-040/041 explicites, détailler la correspondance Auth/profil/admin/avatars, et compléter le schéma conceptuel pour tags et commentaires. Garder les autres incertitudes sous forme d’hypothèses ou de décisions différées jusqu’à leur validation.
