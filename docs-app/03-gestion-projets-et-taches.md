# Gestion des projets et des tâches

## 1. Statuts d’un projet
- **Actif** : le projet est ouvert, ses tâches et ses informations peuvent être modifiées selon les droits de chacun.
- **Clôturé** : la date de clôture est affichée. Les informations du projet et des tâches sont en lecture seule, mais les membres autorisés peuvent toujours lire et ajouter des commentaires. Si le projet est rouvert, la date de clôture précédente est conservée.
- **Annulé** : le projet est masqué aux membres ordinaires tout en conservant son historique pour le propriétaire et l’administrateur. S’il est réactivé, la date de clôture est effacée et les membres y ont de nouveau accès.

## 2. Statuts d’une tâche
- **Créée** : statut initial lors de la création d’une tâche.
- **En cours** : le travail a commencé.
- **Terminée** : le travail est achevé. Les champs d’une tâche terminée sont verrouillés jusqu’à ce qu’elle soit remise **En cours**.
- **Annulée** : la tâche est retirée du suivi actif tout en conservant son statut précédent (qui est restauré si elle est réactivée). Une tâche annulée reste consultable et commentable, mais son statut ne peut plus être modifié directement.

## 3. Suppression d’une tâche
- Seule une tâche **vierge** (au statut **Créée**, jamais commencée et sans aucun commentaire) peut être supprimée définitivement par le propriétaire ou l’administrateur.
- Toute tâche déjà commencée, terminée ou commentée ne peut pas être supprimée : elle peut uniquement être **annulée**.

## 4. Filtres et tris des tâches
- Les filtres sont combinables par **Statut**, **Priorité** (*Basse*, *Normale*, *Haute*), **Membre**, **Échéance** (*En retard*, *Aujourd’hui*, *À venir*) et **Tag**.
- La liste peut être triée dans les deux sens (croissant ou décroissant) par **Échéance**, **Priorité**, **Date de création** ou **Titre**.
