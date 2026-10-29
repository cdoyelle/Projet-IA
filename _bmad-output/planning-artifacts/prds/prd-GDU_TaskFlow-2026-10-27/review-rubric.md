# Revue qualité du PRD — TaskFlow Mobile

## Verdict général

Le PRD est déjà un brouillon substantiel : le MVP, les rôles envisagés, les parcours métier principaux, les règles de cloisonnement et plusieurs décisions confirmées sont décrits avec des critères vérifiables. Il n’est toutefois pas encore prêt à servir de feu vert de réalisation : des choix structurants restent ouverts, les indicateurs de réussite valident surtout le fonctionnement des fonctions et peu la valeur du produit, et certaines exigences revendiquées comme venant du cahier ne sont pas assez précises ou semblent relever d’hypothèses.

## Décision pour agir — thin

Le document expose plusieurs arbitrages qui empêchent une lecture univoque par l’équipe : rôle exact du propriétaire, portée des droits CRUD sur les projets, suppression et conservation, plateformes mobiles cibles, langues, modèle et embeddings IA, et attentes de performance. Il les identifie généralement bien comme ouverts, mais les critères « avant production » ne distinguent pas ce qui bloque déjà la conception UX, l’architecture ou la création des histoires. La source citée comme « cahier des charges fourni » n’est pas présente parmi les fichiers du dossier de travail consultés ; je ne peux donc pas vérifier que les éléments étiquetés « exigence du cahier » ont réellement été demandés.

### Constats
- **[high] Séparer exigences confirmées et choix déduits** (§§ 2, 5 F2, 8, 11) — FR-006 est qualifiée d’exigence du cahier alors qu’elle promet création, modification et suppression « selon les droits attribués », sans matrice de droits établie. FR-009 reconnaît ensuite que ces droits sont des hypothèses. La référence au cahier source n’est pas disponible ici pour arbitrer. *Correction proposée :* fournir/relier le cahier source et attribuer à chaque point un statut cohérent ; préciser les droits confirmés et déplacer le reste en décisions à confirmer.
- **[high] Identifier les décisions bloquantes avant le découpage** (§§ 8, 9, 10) — l’incertitude sur qui peut modifier/supprimer un projet, la suppression des données, les plateformes, la gestion des commentaires et le traitement des données par le fournisseur IA n’a ni responsable ni échéance ni condition de résolution. Certaines touchent directement les parcours, le modèle d’autorisations et le stockage. *Correction proposée :* pour chaque question ouverte, indiquer responsable, moment limite et étape aval bloquée ; marquer explicitement les décisions à trancher avant UX/architecture, celles qui peuvent attendre le lancement et celles qui sont hors MVP.
- **[medium] Compléter les indicateurs de réussite produit** (§ 3) — les critères sont principalement des scénarios de recette fonctionnelle (connexion, affichage, recherche) et aucune cible ne mesure si les équipes comprennent mieux l’avancement ou retrouvent plus vite l’information. Les seuls seuils chiffrés sont des NFR provisoires en § 7. *Correction proposée :* choisir quelques indicateurs de résultat adaptés à la démonstration (par exemple taux de tâches correctement retrouvées/assignées, temps pour obtenir une réponse appuyée, taux de réponses avec source pertinente) et définir méthode, population/jeu d’essai et seuils à confirmer. Ajouter une contre-mesure pour les réponses IA sans preuve ou les fuites inter-projets.

## Substance plutôt que décor — adequate

Le document évite de multiplier les personas et n’invente pas de différenciation de marché. Le résumé décrit une utilité réelle, mais la vision et le besoin principal restent génériques pour un outil de gestion d’équipe ; ils n’expliquent pas pourquoi le MVP réunit tâches, commentaires, tableau de bord et assistant IA, ni quelle valeur doit être démontrée en premier. Les exigences de sécurité sont propres à ce produit, mais les NFR de sécurité et d’ergonomie restent en partie des formulations d’intention.

### Constats
- **[medium] Donner une thèse de MVP** (§§ 1–4) — le périmètre réunit gestion de tâches, commentaires, tableaux de bord et recherche IA, mais aucun problème prioritaire ou hypothèse de valeur ne permet de juger si cette combinaison est nécessaire à la démonstration. *Correction proposée :* ajouter une phrase sur l’utilisateur cible, le problème prioritaire et l’hypothèse que le MVP doit valider ; ordonner les fonctions selon cette hypothèse.

## Cohérence stratégique — thin

Les besoins forment un fil compréhensible autour du suivi de projet et de l’accès mobile à l’information. Cependant, la section « Objectifs et indicateurs » ne contient pas de métriques de résultat mesurables et ne relie pas les choix de périmètre à une thèse. Le caractère « démonstration » du MVP n’est pas défini (à qui, dans quel contexte, avec quel jeu de données, et quel résultat rendrait la démonstration concluante). Les exclusions d’exploitation à grande échelle et de publication en boutique coexistent avec des exigences de session, confidentialité et performances sans distinguer démonstrateur et usage réel.

### Constats
- **[high] Définir le succès de la démonstration et son contexte** (§§ 3–4, 9) — « première version utilisable pour une démonstration mobile » n’indique ni utilisateur/observateur, ni scénario, ni données, ni critère de succès. Les critères actuels sont des recettes de fonctions. *Correction proposée :* préciser l’audience et le scénario de démonstration, les données fictives ou réelles, et quelques résultats attendus ; expliciter ce qui est seulement démontré et ce qui doit être robuste pour un usage réel.
- **[medium] Clarifier le périmètre de la synthèse du tableau de bord** (§§ 3, 4, FR-021–022) — « synthèse par membre ou projet » laisse indécis si l’écran doit présenter les deux regroupements ou si l’un est optionnel. L’exemple d’acceptation ne couvre qu’un projet et aucun regroupement par membre. *Correction proposée :* choisir les vues obligatoires du MVP, préciser leurs dimensions et fournir un exemple de calcul/acceptation pour chacune.

## Clarté du “terminé” — thin

Chaque fonctionnalité a des critères d’acceptation groupés, plusieurs quantifiés, notamment le calcul d’avancement, le délai de mise à jour et le cloisonnement IA. Mais ces critères ne couvrent pas chaque FR et certains termes restent indéfinis : « tri » (champs et ordre), « filtres demandés », « actualisation maîtrisée », « résultat assez pertinent », « mise à jour récente », et ce que signifie « visible seulement par les membres » pour les commentaires. Le seuil de pertinence IA est une décision centrale : l’exigence de ne pas inventer une réponse ne donne ni comportement mesurable ni cas de référence.

### Constats
- **[high] Rendre les comportements IA et ses sources testables** (§ 5 F5, FR-026–030) — aucune règle ne précise le nombre de sources, l’affichage des extraits, le lien vers les notes/tâches, le seuil ou le traitement des résultats partiellement pertinents. Le critère « au moins une source correspondante » ne prouve pas que la réponse est effectivement appuyée. *Correction proposée :* définir les cas de test de réponse appuyée, de preuve partielle et d’absence de preuve ; exiger une correspondance vérifiable entre affirmation et source et préciser le rendu minimal des références.
- **[medium] Définir tri, filtres et commentaires** (§ 5 F3, FR-015, FR-019) — les attributs de filtre sont cités, mais pas les opérateurs, options de tri, combinaisons, valeurs de date ou règles d’édition/suppression des commentaires. *Correction proposée :* décrire les comportements attendus et quelques cas limites prioritaires, au niveau utile pour UX et histoires.
- **[medium] Fixer les bornes de qualité de service avant la validation** (§ 7) — les cibles d’affichage <3 s et réponse IA <10 s au P95 sont qualifiées d’hypothèses à adapter, sans appareil, réseau, taille de données ni méthode de mesure. « Contrastes lisibles » et « commandes tactiles adaptées » sont des intentions non vérifiables. *Correction proposée :* préciser le protocole et les conditions de mesure ; soit choisir une cible d’accessibilité vérifiable, soit reporter explicitement ces critères à la conception UX.

## Honnêteté du périmètre — adequate

Les inclusions et exclusions importantes sont visibles, les hypothèses sont nommées et le document reconnaît les risques du fournisseur IA, de conservation et de recherche. Les exclusions non confirmées sont toutefois mélangées dans un même paragraphe avec les exclusions confirmées, et les hypothèses sont présentées comme des phrases en gras plutôt que des marqueurs cohérents reliés à un index. La densité des points ouverts est acceptable pour un brouillon, mais le document ne dit pas clairement lesquels empêchent de construire le MVP.

### Constats
- **[medium] Distinguer les non-objectifs confirmés des suppositions de cadrage** (§ 4) — les exclusions de push et hors-ligne sont confirmées, tandis que publication en boutique, intégrations et fonctions analytiques sont seulement présumées exclues. Leur regroupement peut faire croire que toutes ont été arbitrées. *Correction proposée :* séparer « exclusions confirmées » et « exclusions proposées à confirmer » et indiquer l’impact si une exclusion change.
- **[medium] Résoudre la portée des documents et imports** (§§ 4–5 F5, FR-023–024, FR-031, 8) — le MVP promet un espace alimenté par des « documents de démonstration », alors que le mode d’ingestion, les formats et le responsable de leur fourniture sont ouverts ; FR-031 écarte l’import libre mais ne dit pas comment les sources sont introduites. *Correction proposée :* confirmer que les données sont préchargées par l’équipe pour la démonstration, nommer leurs types et leur cycle de mise à jour ; garder l’import utilisateur hors MVP si c’est bien voulu.

## Utilisabilité en aval — adequate

La numérotation FR-001 à FR-031 est continue et les règles d’accès, données et glossaire de base aideront l’architecture. L’addendum contient déjà les décisions techniques et leur profondeur est bien séparée du besoin produit. Pour une application collaborative destinée à plusieurs membres, il manque toutefois des parcours utilisateur concrets : l’ordre des actions, les erreurs, les états vides, la perte de connexion et les transferts de responsabilité sont seulement dispersés dans des critères. Cela expose les travaux UX et stories à devoir combler des règles produit.

### Constats
- **[medium] Ajouter un ou deux parcours représentatifs** (§§ 2–5) — le produit implique au moins un membre et un propriétaire, mais aucun parcours narratif ne montre comment chacun crée/rejoint un projet, traite une tâche ou retrouve une information IA, ni les cas de refus et d’état vide. *Correction proposée :* capturer un parcours de membre et un parcours du propriétaire avec protagonistes nommés et résultat observable ; garder les personas séparées hors du PRD si elles n’aident pas les décisions.
- **[low] Préciser la portée du tableau de bord par membre ou par projet** (FR-021) — la formulation peut mener à deux interprétations lors du découpage. *Correction proposée :* employer les mêmes noms pour les vues dans besoins, FR et critères d’acceptation.

## Adéquation de la forme — adequate

La forme capability-first est adaptée à un outil d’équipe et le document a assez de matière pour nourrir conception UX, architecture et histoires. Le produit demeure multi-utilisateur et avec une expérience mobile importante, donc les parcours cités ci-dessus aideraient. Il manque aussi des bornes simples pour le contexte d’usage (iOS/Android et versions minimales), alors que le résumé dit seulement « smartphone » et le risque confirme qu’ils ne sont pas décidés.

### Constats
- **[medium] Confirmer les surfaces et plateformes du MVP** (§§ 1, 4, 9, addendum « Choix encore ouverts ») — React Native est retenu mais ni iOS/Android, ni versions cibles, ni format téléphone/tablette ne sont fixés. Cela influe sur la portée des parcours et critères de présentation. *Correction proposée :* confirmer les plateformes et appareils visés, ou noter explicitement que la démonstration est limitée à un environnement mobile donné.

## Notes mécaniques

- Les FR-001 à FR-031 sont continues et uniques ; aucun identifiant de parcours ou de métrique n’est utilisé.
- L’ordre des sections est incohérent : § 11 « Validations reçues » précède § 9 « Limites et risques » et § 10 « Validation attendue ». Réordonner les sections 9 à 11.
- Le § 3 mentionne des cibles numériques « ci-dessous », mais le tableau contient surtout des scénarios qualitatifs ; les seuls seuils sont en § 7. Reformuler l’introduction ou ajouter des mesures chiffrées.
- La section 8 rassemble hypothèses, décisions ouvertes et éléments déjà confirmés ; plusieurs confirmations y figurent également en § 11 et dans `.memlog.md`. Dédupliquer et faire correspondre l’état aux décisions du journal.
- Le PRD est rédigé en français tandis que la configuration du projet indique `document_output_language = "English"`. Confirmer la langue de livrable et aligner la configuration ou le document lors d’une mise à jour.
- Le nom du produit alterne entre « TaskFlow » et « TaskFlow Mobile » ; choisir une convention stable.
- L’addendum indique « les tâches actives ont le même poids » (§ Hypothèses structurantes), alors que le calcul de FR-022 utilise « tâches non supprimées » et le critère d’acceptation compte toutes les tâches non supprimées. Clarifier si les tâches terminées sont incluses au dénominateur et définir « active ».
- FR-018 rend le changement visible en 5 secondes et FR-016 autorise un « rafraîchissement maîtrisé », sans préciser si le délai de 5 secondes s’applique aux deux stratégies. Harmoniser le contrat de fraîcheur.
- L’addendum dit que « les commentaires simples de projet ou de tâche sont inclus » à deux endroits ; supprimer la répétition.
- Les formulations d’hypothèse ne suivent pas la forme `[ASSUMPTION: …]` et il n’y a pas d’index des hypothèses. Pour les prochains passages, harmoniser les marqueurs et s’assurer que chaque hypothèse indexée existe dans les exigences.
