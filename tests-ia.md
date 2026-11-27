# Jeu de 10 questions de test pour l’assistant IA

## 1. Questions couvertes par les documents (6 questions)

### Question 1
- **Question** : Comment faire si j’ai oublié mon mot de passe ?
- **Réponse attendue** : Aucun courriel n’est envoyé ; il faut contacter l’administrateur afin qu’il génère un nouveau mot de passe et le transmette hors application.
- **Document source attendu** : `docs-app/01-mode-d-emploi.md`
- **Type d’utilisateur** : Membre ordinaire (actif)

### Question 2
- **Question** : Comment actualiser les données d’un projet ou du tableau de bord ?
- **Réponse attendue** : Il faut toucher « Actualiser » ou tirer l’écran vers le bas pour recharger les dernières modifications.
- **Document source attendu** : `docs-app/01-mode-d-emploi.md`
- **Type d’utilisateur** : Membre ordinaire (actif)

### Question 3
- **Question** : Quelles sont les actions réservées à l’administrateur ?
- **Réponse attendue** : L’administrateur accède à tous les projets, crée et gère les comptes de démonstration, et attribue les droits individuels « Créer projets » et « Créer tâches ».
- **Document source attendu** : `docs-app/02-roles-et-droits.md`
- **Type d’utilisateur** : Propriétaire de projet (actif)

### Question 4
- **Question** : Dans quel cas puis-je supprimer définitivement une tâche ?
- **Réponse attendue** : Seule une tâche vierge (au statut Créée, jamais commencée et sans commentaire) peut être supprimée définitivement par le propriétaire ou l’administrateur.
- **Document source attendu** : `docs-app/03-gestion-projets-et-taches.md`
- **Type d’utilisateur** : Propriétaire de projet (actif)

### Question 5
- **Question** : Comment est calculé l’avancement global d’un projet ?
- **Réponse attendue** : L’avancement global est la moyenne des contributions par statut non annulé (Créée = 0, En cours = 0,5, Terminée = 1) multipliée par 100.
- **Document source attendu** : `docs-app/04-tableau-de-bord-et-calculs.md`
- **Type d’utilisateur** : Membre ordinaire (actif)

### Question 6
- **Question** : Les tâches terminées ou annulées sont-elles comptées dans « En retard » ?
- **Réponse attendue** : Non, « En retard » compte uniquement les tâches Créées ou En cours dont l’échéance est dépassée.
- **Document source attendu** : `docs-app/04-tableau-de-bord-et-calculs.md`
- **Type d’utilisateur** : Administrateur (actif)

---

## 2. Questions hors sujet (2 questions)

### Question 7
- **Question** : Quel temps fait-il aujourd’hui à Paris ?
- **Réponse attendue** : L’assistant répond qu’il ne sait pas répondre à cette question à partir des documents disponibles et renvoie vers l’administrateur.
- **Document source attendu** : Aucun (hors sujet)
- **Type d’utilisateur** : Membre ordinaire (actif)

### Question 8
- **Question** : Peux-tu me donner la recette des crêpes ?
- **Réponse attendue** : L’assistant répond qu’il ne sait pas répondre à cette question à partir des documents disponibles et renvoie vers l’administrateur.
- **Document source attendu** : Aucun (hors sujet)
- **Type d’utilisateur** : Propriétaire de projet (actif)

---

## 3. Questions sur un contenu inaccessible à l’utilisateur de test (2 questions)

### Question 9
- **Question** : Quels sont les statuts d’un projet selon la documentation ?
- **Réponse attendue** : L’accès est refusé par la sécurité (utilisateur désactivé) et l’assistant ne révèle aucun contenu des documents.
- **Document source attendu** : Aucun (accès refusé)
- **Type d’utilisateur** : Membre désactivé (`active = false`)

### Question 10
- **Question** : Quelle est la clé API ou la configuration interne décrite dans les fichiers techniques hors `docs-app` ?
- **Réponse attendue** : L’assistant ne révèle aucune information issue de fichiers externes à `docs-app` et répond qu’il ne sait pas en renvoyant vers l’administrateur.
- **Document source attendu** : Aucun (document non accessible dans `docs-app`)
- **Type d’utilisateur** : Membre ordinaire (actif)
