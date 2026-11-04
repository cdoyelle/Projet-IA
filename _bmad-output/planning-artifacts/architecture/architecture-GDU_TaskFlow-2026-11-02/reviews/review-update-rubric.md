# Revue rubric — architecture mise à jour

**Date :** 4 novembre 2026  
**Périmètre :** `ARCHITECTURE-SPINE.md` rapprochée du PRD, de son addendum, de `EXPERIENCE.md` et de `DESIGN.md`.  
**Verdict :** **couverture fonctionnelle et UX désormais traçable; quelques précisions mineures restent souhaitables avant de figer le spine.** Les corrections validées ont comblé les principaux trous : tableau de bord partagé, modèle de données, écritures, contrat assistant, écrans et livrables.

## Constatations

### Moyen — Désactivation et retrait de membre sont décrits à deux endroits

AD-6 et AD-12 portent tous les deux les règles d’affectation au retrait et à la désactivation. Ils sont compatibles aujourd’hui, mais la règle peut dériver lors d’une modification future. Garder AD-6 sur la rétention et la visibilité du cycle de vie, et AD-12 comme source unique pour l’état d’appartenance et d’affectation, ou faire pointer explicitement AD-6 vers AD-12.

### Faible — Le contrat du tableau de bord ne précise pas chaque compteur

AD-3 fixe la formule de progression et la définition du retard, mais FR-024 demande aussi les compteurs globaux des tâches créées, en cours et terminées. La Capability Map rattache les calculs au même écran/base, mais la règle en AD-3 pourrait préciser la source commune des quatre compteurs et que les tâches annulées n’ont pas de compteur dédié. Le PRD reste assez clair pour l’implémentation; c’est une amélioration de précision, pas un blocage.

### Faible — Les livrables FR-040/041 n’ont pas encore de chemin concret

La carte désigne une checklist manuelle et un journal versionné dans la documentation du projet, mais ne nomme pas leurs chemins. L’architecture note aussi que le dossier de seed/reset sera à fixer selon le dépôt. Avant implémentation, choisir des chemins canoniques sous `docs/` et un emplacement du script/données de démonstration afin que les livrables ne soient pas oubliés.

### Faible — Le diagramme conceptuel n’illustre pas toutes ses contraintes

Le tableau fixe que les tags appartiennent à un projet et que `task_tags` ne relie que des objets du même projet; `comments` cible exactement un projet ou une tâche. Le diagramme n’illustre pas l’association projet pour `TAGS`, la relation `TASKS`–`PROJECTS` nécessaire pour vérifier la cohérence inter-projet, ou le champ d’exclusivité du commentaire. La règle textuelle couvre ces points; le diagramme peut être complété sans figer tout le schéma SQL.

### Faible — Enveloppe de coût à réconcilier avec la cible initiale

La mémoire de décision consigne un budget de démarrage de 0–25 EUR/mois. Le spine indique désormais Supabase Pro à partir de 25 USD/mois si la disponibilité sans pause est exigée, mais ne rappelle pas explicitement le plafond accepté ni la conséquence qu’un build EAS payant ou du trafic IA pourrait le dépasser. Puisque les offres/prix sont révisables, garder cela comme limite de coût à confirmer au moment du choix de disponibilité, builds et facturation IA.

## Couverture observée

| Exigences | Résultat |
|---|---|
| FR-001–004, FR-033–035 — Auth, réinitialisation, profil, administration | Mappées à Auth, `profiles`, Storage optionnel, fonction admin et écrans correspondants. |
| FR-005–011 — Projets et membres | Mappés à tables, fonctions et écrans projet/membres; AD-10 ferme la frontière de mutation. |
| FR-012–020 — Tâches, affectations, filtres, commentaires | Mappés aux tables, mutations et écrans; tags et liens de commentaire sont maintenant décrits. |
| FR-021–024 — Tableau de bord | Progression et définition du retard centralisées; préciser les compteurs aiderait à fermer le contrat. |
| FR-025–032 — Assistant | Cloisonnement projet, sources, embeddings, génération et réponse sans source sont reliés aux briques correspondantes. |
| FR-036–039 — Formulaires, états et build installable | Mappés à l’interface mobile, Auth, contrat d’erreur, EAS et scénario de démonstration. |
| FR-040–041 — Essais manuels et journal | Représentés comme livrables versionnés, chemins à nommer. |
| Écrans UX | Tous les neuf sont nommés explicitement ou rattachés à un groupe d’écrans correspondant dans la carte. |

## Points validés par la mise à jour

- Les identifiants AD-1 à AD-9 restent stables; les nouveaux AD-10 à AD-12 couvrent des divergences auparavant ouvertes.
- Les opérations de projet et d’appartenance sont transactionnelles et soumises aux mêmes droits.
- Le statut d’un compte et son appartenance restent la source des libellés et accès; les règles du PRD de retrait/réactivation sont représentées.
- L’assistant a un contrat partagé pour les erreurs, citations et absence de source.
- Les points non tranchés — avatar, fournisseur d’e-mail, seuil de pertinence, méthode d’installation iOS, dossier de déploiement de démo — restent différés ou hypothèses.

## Disposition

La base peut être considérée **validée avec des précisions pré-implémentation non bloquantes**, sous réserve du reviewer gate final et du statut final du document. Traiter les chemins de livrables/seed et les limites de coûts avant de créer ces ressources ou d’activer des services payants.
