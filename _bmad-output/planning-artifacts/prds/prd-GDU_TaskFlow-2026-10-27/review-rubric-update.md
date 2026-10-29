# Revue qualité PRD — TaskFlow Mobile

Revue finale du PRD et de son addendum selon la grille BMad, après intégration des décisions confirmées. Périmètre : cohérence, caractère vérifiable, structure et traçabilité au cahier des charges fourni.

## Verdict global

Le PRD est cohérent avec les arbitrages consignés, présente un périmètre de démonstration compréhensible et donne des critères manuels utiles pour les parcours centraux. Il est exploitable pour poursuivre la conception, avec quelques précisions à apporter avant de traiter chaque FR comme une spécification entièrement vérifiable : surtout la règle de suppression physique selon l’historique d’une tâche, les états d’interface génériques et la mesure de performance.

## Décision et préparation — adequate

Les décisions majeures sont formulées comme des règles : les rôles et leurs droits (§5, FR-005 à FR-012, FR-031, FR-033 à FR-035), les cycles de vie projet/tâche, le calcul d’avancement, les données de démonstration et le choix de Gemini. Les décisions encore ouvertes sont affectées à l’architecture ou explicitement reportées (§8), ce qui convient à un MVP de démonstration. Le scénario distingue bien le projet préchargé interrogé par l’assistant du nouveau projet créé en direct avec deux tâches (FR-038; addendum, « Données de démonstration et assistant »).

La préparation à la décision reste partielle sur les seuils provisoires de performance : le protocole, l’appareil et le volume de données ne sont pas définis (§7). Ce report est indiqué honnêtement, mais signifie que ces chiffres ne peuvent pas encore être vérifiés de façon reproductible.

### Constats

- **medium — Définir les conditions de mesure de performance** (§7, §8) — Les objectifs « moins de 3 secondes » et « moins de 10 secondes au 95e percentile » ont des valeurs, mais appareil, jeu de données et protocole sont laissés à l’architecture. *Correction proposée :* conserver leur statut provisoire et faire de la fixation du protocole un jalon explicite avant l’implémentation ou l’acceptation de ces objectifs.

## Substance — strong

Le document décrit des parcours concrets propres à l’application : contrôle des droits entre trois rôles, suivi manuel, règles particulières d’annulation et assistant fondé sur les contenus de démonstration. Les personas restent limités aux trois rôles qui déterminent réellement les autorisations. Les critères de réussite (§3) portent sur des démonstrations et vérifications observables plutôt que sur des métriques d’usage sans rapport avec le MVP.

## Cohérence stratégique — adequate

Le fil directeur est lisible : démontrer la gestion de projet à plusieurs rôles, l’avancement visible et la recherche d’informations avec sources, en environnement de démonstration. Les fonctionnalités servent ces parcours et les limites de publication, de navigateur et de production sont explicites (§1, §3–4, §8–9). La thèse est toutefois présentée comme une hypothèse à éprouver, sans indicateur quantifié de qualité d’usage; ce niveau convient à la démonstration demandée, mais ne suffirait pas à mesurer la validation produit après celle-ci.

## Clarté du « terminé » — adequate

Les FR centraux disposent de conséquences vérifiables et plusieurs groupes ont des critères d’acceptation explicites (§5). Les règles de statut, de calcul, de suppression, de permissions, de rafraîchissement et d’absence de réponse IA sont suffisamment précises pour élaborer des scénarios manuels. Les FR-036 et FR-037 restent cependant qualitatifs (« indiquent comment corriger », « états compréhensibles »), et l’accessibilité (§7) repose sur « contraste suffisant » sans critère de vérification défini.

### Constats

- **medium — Rendre les états d’erreur et l’accessibilité contrôlables** (§5, FR-036–037; §7) — Les termes « compréhensibles » et « suffisant » laissent le résultat à l’appréciation de l’équipe. *Correction proposée :* définir dans les spécifications UX les états/formulaires attendus pour chaque parcours principal et des critères d’accessibilité mesurables ou une méthode de vérification manuelle; garder ici une référence explicite à ces critères.
- **medium — Préciser si la suppression dépend du statut courant ou de l’historique** (§5, FR-016; §6, règle 8) — Le texte interdit la suppression d’une tâche « commencée » ou « traitée », mais la condition directement vérifiable est qu’elle soit actuellement « Créée » et sans commentaire. Il ne dit pas si une tâche précédemment commencée puis remise à « Créée » resterait supprimable. *Correction proposée :* préciser que les tâches ayant déjà été commencées/traitées restent non supprimables, ou confirmer que seul le statut courant et la présence de commentaires comptent; dans le premier cas, définir comment l’historique est établi.

## Honnêteté du périmètre — strong

Les reports sont nommés plutôt que masqués : production et exploitation, continuité, conformité, rapport d’évaluation IA, fiche d’index RAG et dossier de garde-fous IA (§4, §8; addendum, « Livrables reportés »). Le texte rappelle que ces reports ne lèvent pas les exigences produit de cloisonnement, protection des secrets, citation des sources et abstention de réponse. Aucune hypothèse non confirmée n’est présentée comme une décision; le choix des modèles Gemini et les détails d’architecture sont correctement marqués comme différés.

## Utilisabilité en aval — adequate

Les FR sont continus de FR-001 à FR-041, les groupes fonctionnels sont clairement séparés, et les règles importantes sont reprises dans une section métier. Le glossaire de l’addendum explique les principaux termes techniques. Les critères d’acceptation groupés par fonctionnalité permettent une extraction vers des scénarios d’essai.

La traçabilité au PDF est au niveau des sections et du document source : le PRD distingue les « Exigences du cahier » des ajouts confirmés et référence `sources/cahier-des-charges.pdf` (§5, §11). Il n’y a pas de référence aux pages ou exigences précises du PDF; ce n’est pas bloquant pour le périmètre actuel, mais rendrait plus coûteuse une vérification exhaustive ou une mise à jour du cahier.

### Constats

- **low — Ajouter des références page/section pour les exigences du cahier** (§5, §11; addendum) — La qualification « Exigence du cahier » et le lien vers le PDF assurent une traçabilité générale, sans permettre de retrouver rapidement l’origine de chaque exigence. *Correction proposée :* ajouter les numéros de page/section aux exigences principales si le PRD doit servir de matrice de conformité; sinon conserver la traçabilité actuelle pour le MVP.

## Adaptation de forme — strong

La forme d’un PRD produit est pertinente : utilisateurs, objectifs de démonstration, périmètre, FR par capacité, règles métier, NFR, risques et décisions différées. Les sept groupes FR couvrent le produit et ses livrables de démonstration sans imposer un excès de parcours narratifs. L’addendum garde séparées les contraintes techniques et les livrables pédagogiques.

## Notes mécaniques

- **Identifiants :** FR-001 à FR-041 sont uniques et continus. Aucun identifiant de parcours ou de métrique n’est utilisé, donc pas de rupture de ce type à relever.
- **Sections :** les sections numérotées du PRD vont de 1 à 11; les critères d’acceptation sont rattachés aux groupes de FR.
- **Terminologie :** « membre », « propriétaire », « administrateur », « Clôturé », « Annulé » et « Membre à attribuer » sont utilisés de façon stable. La formulation de FR-016/règle 8 mérite la clarification d’historique ci-dessus.
- **Hypothèses et questions ouvertes :** pas de balises `[ASSUMPTION]` ni de rubrique « Open Questions »; les choix différés sont inventoriés au §8 et ne sont pas présentés comme confirmés.
- **Écart de statut à surveiller :** le PRD est encore intitulé « brouillon » (§10/frontmatter). La validation décrite concerne les décisions produit; les choix d’architecture différés restent en attente, ce qui rend ce statut cohérent.

## Corrections restantes

1. Clarifier l’application de la règle « commencée/traitée » lors d’une éventuelle remise au statut « Créée » avant suppression.
2. Définir les critères de vérification des messages d’erreur/formulaires et des exigences d’accessibilité dans les spécifications UX ou les scénarios manuels.
3. Fixer le protocole de mesure des objectifs de performance avant de les considérer comme critères d’acceptation.
4. Facultatif selon l’usage attendu : ajouter les pages/sections du PDF aux exigences qui en proviennent.
