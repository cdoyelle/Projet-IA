# Revue adversariale de la mise à jour

**Cible :** `ARCHITECTURE-SPINE.md`  
**Verdict :** les principales divergences relevées avant validation sont maintenant fermées. La règle de progression, les identités/affectations, les écritures projet/membre, les écrans et les livrables sont bien mieux cadrés. Deux détails restent à rendre déterministes avant l’implémentation.

## Constatations

### Moyen — Les changements d’appartenance ne définissent pas les états de projet permis

AD-10 demande une vérification de l’état du projet pour ajouter ou retirer un membre, mais ne précise pas quels états acceptent ces changements. FR-008 dit que propriétaire/administrateur peuvent ajouter ou retirer un compte actif sans énumérer d’exception par statut; FR-009/010 précisent surtout les modifications du projet et des tâches. Deux fonctions pourraient donc interdire les membres sur un projet clôturé ou annulé, ou les autoriser, tout en disant appliquer « project-state checks ». Définir les états permis à partir du PRD, ou limiter explicitement cette vérification au seul contrôle de visibilité/autorisation.

### Faible — Les emplacements des scénarios, du journal et du seed restent à choisir

La carte attribue maintenant FR-040/041 et la démo à des artefacts versionnés du dépôt. Le dossier précis reste différé jusqu’à la disposition du dépôt mobile. Ce n’est pas bloquant pour valider le spine, mais fixer ces chemins avant la réalisation évitera deux listes de vérification, journaux ou procédures de seed concurrents.

## Paires adversariales réessayées

- Deux tableaux de bord ne peuvent plus choisir des poids ou la définition de retard différents : la formule est centralisée.
- Écran de projet et fonction d’appartenance ont maintenant la même frontière transactionnelle; retrait et désactivation ont des effets distincts explicités sur les affectations.
- Les citations et erreurs de l’assistant ont un contrat partagé versionné.
- Tags et commentaires ont désormais un propriétaire relationnel; le commentaire doit viser exactement un projet ou une tâche.
- FR-040/041 et les données de démonstration ont un propriétaire documentaire dans la carte, même si les chemins physiques attendent la disposition du code.

## Disposition suggérée

Préciser l’autorisation d’ajout/retrait de membres selon les statuts du projet avant implémentation. Reporter le choix des chemins de documents/seed à la création du client mobile et du dossier Supabase.
