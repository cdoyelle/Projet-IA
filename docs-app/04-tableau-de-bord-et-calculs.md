# Tableau de bord et calcul des avancements

## 1. Méthode de calcul de l’avancement
Chaque tâche non annulée contribue au calcul selon son statut :
- **Créée** = `0` (0 %)
- **En cours** = `0,5` (50 %)
- **Terminée** = `1` (100 %)

Les tâches **Annulées** sont **exclues** du calcul.

La formule utilisée est la moyenne des contributions multipliée par 100, arrondie à l’entier le plus proche.
*Exemple 1 : un projet avec 1 tâche Terminée (1), 1 tâche En cours (0,5) et 1 tâche Créée (0) a un avancement de `(1 + 0,5 + 0) / 3 = 50 %`.*
*Exemple 2 : si un projet contient 2 tâches En cours (0,5 chacune) et 1 tâche Annulée (exclue), l’avancement est `(0,5 + 0,5) / 2 = 50 %`.*
*Exemple 3 : si toutes les tâches d’un projet sont Terminées (1), l’avancement est de `100 %`. Si toutes sont Créées (0), l’avancement est de `0 %`.*

## 2. Avancement global vs Avancement personnel
- **Avancement global** : porte sur **toutes** les tâches non annulées du projet. Ce même pourcentage est également affiché sur la carte du projet dans la liste et en haut de son détail.
- **Avancement personnel** : utilise exactement la même formule, mais uniquement sur les tâches non annulées qui **vous sont attribuées** (y compris si vous êtes propriétaire du projet).
- **Cas particulier** : si aucune tâche admissible n’existe pour l’un ou l’autre calcul (par exemple aucune tâche créée, ou aucune tâche attribuée à votre compte, ou uniquement des tâches annulées), le tableau de bord affiche **« — »** plutôt que `0 %`.

## 3. Compteurs par statut et retards
Le tableau de bord affiche 4 compteurs :
- **Créées** : nombre de tâches au statut *Créée*.
- **En cours** : nombre de tâches au statut *En cours*.
- **Terminées** : nombre de tâches au statut *Terminée*.
- **En retard** : nombre de tâches **Créées** ou **En cours** dont la date d’échéance est strictement antérieure à la date du jour. Les tâches **Terminées** et **Annulées** ne sont jamais comptées en retard.

Aucun compteur **« Annulées »** n’est affiché dans le tableau de bord.
