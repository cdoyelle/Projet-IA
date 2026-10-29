# Revue finale BMad — PRD TaskFlow Mobile

Relecture du PRD et de l’addendum après les derniers ajustements. L’ancien rapport `review-rubric-update.md` est conservé comme historique.

## Verdict

Le PRD est cohérent avec les décisions produit confirmées et suffisamment précis pour poursuivre la conception du MVP et préparer des scénarios de tests manuels. Les corrections sur la suppression des tâches, les états de formulaire/erreur, l’accessibilité et le protocole de performance ont levé les ambiguïtés principales de la revue précédente. Aucun point bloquant ne reste dans le périmètre examiné.

## Vérifications

- **Identifiants :** FR-001 à FR-041 sont uniques, continus et répartis dans des capacités cohérentes.
- **Suppression des tâches :** FR-016 et la règle métier 8 exigent maintenant que la tâche soit encore « Créée », n’ait jamais été commencée et n’ait aucun commentaire. Une tâche commencée, traitée ou commentée ne peut être qu’annulée. Formulation cohérente avec la décision confirmée.
- **Formulaires et erreurs :** FR-036 et FR-037 précisent validation avant envoi, indication de correction, confirmation de réussite, erreur réseau avec possibilité de réessayer, refus d’accès sans divulgation et état vide.
- **Accessibilité :** §7 énonce des vérifications manuelles sur iOS et Android, notamment libellés de lecteur d’écran, ordre de lecture, agrandissement du texte, contraste et commandes tactiles.
- **Performance :** §7 fixe les objectifs comme provisoires et demande un appareil, un jeu de données, une connexion et un protocole reproductible avant de les adopter comme critères d’acceptation; §8 indique quand ce travail sera fait.
- **Cohérence produit :** rôles et droits, projets Actif/Clôturé/Annulé, tâches et statuts, calcul d’avancement, affectations, commentaires, comptes désactivés, Gemini, données de démonstration et rafraîchissement manuel sont alignés entre les FR, les règles métier et l’addendum.
- **Structure et traçabilité :** sections 1 à 11 présentes; le PRD cite le PDF et différencie exigences du cahier, décisions confirmées et choix différés. L’addendum distingue les contraintes techniques et livrables reportés.

## Points encore ouverts, non bloquants

- Les modèles Gemini exacts et les versions minimales iOS/Android sont à choisir en architecture, comme indiqué aux §8 et dans l’addendum.
- Le protocole concret de mesure de performance reste à établir en architecture avant que les objectifs provisoires deviennent des critères d’acceptation.
- Le lien au PDF ne donne pas les numéros de pages ou sections associés à chaque exigence. Ajouter ces références serait utile pour un audit de conformité du cahier, mais n’est pas nécessaire pour avancer sur le MVP.
- FR-007 cite explicitement le propriétaire pour la modification des dates lorsque le projet est actif; les droits globaux de l’administrateur sont établis ailleurs. Une mention explicite de l’administrateur dans cette phrase améliorerait la lisibilité, sans changer la règle puisque l’administrateur détient les droits de propriétaire sur tous les projets.

## Conclusion

**Aucune correction bloquante restante.** Les choix d’architecture différés sont identifiés et attribués à la phase correspondante; le PRD peut servir de base aux travaux UX/architecture et à la préparation du MVP.
