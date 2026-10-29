# Addendum — TaskFlow Mobile

Cette note rassemble les contraintes techniques et les livrables de réalisation du cahier des charges. Les besoins et règles visibles par les utilisateurs restent définis dans le PRD.

## Contraintes techniques confirmées

- **Application :** React Native; iOS et Android, téléphones et tablettes. Pas de version navigateur ni de publication dans les boutiques pour le MVP.
- **Backend :** Supabase PostgreSQL, Supabase Auth et RLS; Supabase Storage pour les avatars facultatifs; Supabase pgvector pour la recherche sémantique.
- **Assistant :** Gemini pour la génération des réponses et les embeddings dès le MVP. Les appels et secrets restent côté serveur. Le modèle précis de génération et le modèle d’embeddings seront choisis en architecture après comparaison de la qualité en français, du coût et de la rapidité.
- **Évolutivité IA :** conserver une interface côté serveur permettant de remplacer ultérieurement le fournisseur de génération sans modifier les écrans mobiles ni les fonctions métier. Les fournisseurs de génération et d’embeddings sont des choix séparables; changer le modèle d’embeddings peut exiger de recalculer et réindexer les contenus.
- **Actualisation :** actualisation manuelle des listes et tableaux de bord par commande « Actualiser » et geste de tirer vers le bas. Supabase Realtime n’est pas requis pour le MVP.
- **Réseau :** connexion Internet requise; aucun mode hors ligne ni synchronisation ultérieure.
- **Comptes :** invitations par e-mail, choix du mot de passe par la personne invitée, réinitialisation par e-mail, invalidation de session à la désactivation. SSO/MFA non requis au MVP.
- **Environnement :** développement/démonstration. Un build installable est attendu pour les essais, sans mise en production ni publication en boutique.

## Modèle de données et architecture à couvrir

Le cahier demande un modèle Supabase relationnel avec, au minimum, les concepts suivants ou leur équivalent justifié :

- Profils rattachés à Supabase Auth et créés lors de l’activation du compte.
- Projets, membres de projet, tâches, tags et relations tâche-tag.
- Commentaires attachés à un projet ou à une tâche.
- Comptes/état d’activation et rôles d’administrateur, propriétaire et membre.
- Contenus et passages de connaissances avec texte, embeddings, métadonnées et identifiant de projet.

Les clés primaires/étrangères, contraintes, valeurs par défaut et index doivent soutenir les règles du PRD. Les règles RLS doivent couvrir aussi les requêtes directes, les fonctions serveur et la recherche vectorielle. L’administrateur possède l’exception globale définie au PRD; les autres comptes sont limités par appartenance active. Aucun secret privilégié n’est embarqué dans l’application.

Le projet doit inclure les migrations SQL et documenter les variables d’environnement nécessaires. L’architecture distingue clairement interface, logique métier et accès aux données, et traite les états de chargement, réussite et erreur.

## Données de démonstration et assistant

- Les contenus sont fictifs et préchargés dans un projet de démonstration existant : descriptions, notes, tâches et documents de démonstration.
- Le scénario crée un second projet en direct et deux tâches; l’assistant répond sur le contenu préchargé du projet existant.
- Gemini génère les embeddings et les réponses; pgvector stocke et recherche les passages pertinents. Les modèles précis et le découpage sont choisis durant l’architecture.
- Le PRD exige que les réponses présentent le nom de source, l’extrait et un lien ouvrable lorsqu’il est disponible, et qu’elles indiquent l’absence de réponse quand les sources ne suffisent pas.
- L’import libre de fichiers par les utilisateurs n’est pas inclus au MVP.

## Réalisation, journal et essais du MVP

- Le développement suit une démarche de vibe coding par petites évolutions : intention, génération, relecture, essai manuel, correction et versionnement.
- Utiliser Git et GitHub, conformément au cahier des charges.
- Tenir un journal synthétique contenant les prompts importants, les choix retenus, les erreurs rencontrées et corrigées, ainsi que les vérifications humaines.
- Les tests manuels suffisent pour le MVP. Les scénarios couvrent les parcours principaux, les refus de droits et les politiques RLS avec trois comptes distincts : administrateur, propriétaire et membre.
- Fournir un build installable ou un moyen équivalent permettant de tester l’application sur simulateur ou appareil.

## Livrables reportés

Les sujets ci-dessous sont explicitement reportés à une étape ultérieure et ne constituent pas une promesse de livraison du MVP :

- Dossier d’environnements et déploiement en production, mise en service et retour arrière.
- Sauvegardes et continuité (RPO/RTO), supervision, journaux, métriques, alertes, procédures de support, SLA et registre de conformité/RGPD.
- Rapport formel d’évaluation de l’IA (pertinence, hallucinations, temps de réponse et estimation des coûts).
- Fiche complète sur les sources, le découpage, l’indexation, la mise à jour et les droits de l’index RAG.
- Dossier de garde-fous IA couvrant modération, données personnelles, journalisation, limites et traitement des incidents.

Ces reports ne retirent pas les exigences fonctionnelles du PRD concernant le cloisonnement des données, la protection des secrets, les sources visibles et l’absence de réponse lorsque les contenus ne suffisent pas.

## Glossaire

- **Backend :** partie serveur qui conserve les données et applique les règles d’accès.
- **Embedding :** représentation numérique du sens d’un texte, utilisée pour retrouver des passages proches d’une question.
- **Recherche sémantique :** recherche par le sens, même lorsque les mots de la question diffèrent de ceux du contenu.
- **RAG :** approche où les passages récupérés dans une base de connaissances servent de contexte à la génération d’une réponse.
- **pgvector :** extension PostgreSQL qui stocke et compare les embeddings.
- **RLS :** règles PostgreSQL/Supabase qui limitent les lignes accessibles à chaque rôle.
- **Actualisation manuelle :** action explicite qui relit les dernières données et remplace la mise à jour en temps réel pour le MVP.
- **MVP :** version minimale destinée ici à une démonstration fonctionnelle et à la validation manuelle des parcours.
