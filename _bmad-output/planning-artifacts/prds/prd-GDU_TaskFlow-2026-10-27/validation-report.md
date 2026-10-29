# Rapport de validation — PRD TaskFlow Mobile

> Ce rapport conserve la revue du brouillon initial, avant les décisions point par point. Les corrections validées ont depuis été intégrées au PRD et à l’addendum. La revue du document mis à jour se trouve dans `review-rubric-final.md`.

- **PRD :** `_bmad-output/planning-artifacts/prds/prd-GDU_TaskFlow-2026-10-27/prd.md`
- **Grille :** `.agents/skills/bmad-prd/assets/prd-validation-checklist.md`
- **Date :** 2026-10-28
- **Verdict : Fair** — le brouillon est substantiel et les FR sont continues, mais plusieurs décisions produit restent ouvertes. Avant de s’en servir comme feu vert de réalisation, il faut clarifier les droits projet, le succès visé pour la démonstration et la vérifiabilité des réponses IA.

## Verdicts par dimension

- Décision pour agir — thin
- Substance plutôt que décor — adequate
- Cohérence stratégique — thin
- Clarté du « terminé » — thin
- Honnêteté du périmètre — adequate
- Utilisabilité en aval — adequate
- Adéquation de la forme — adequate

## Constats critiques

Aucun.

## Constats majeurs (4)

1. **Distinguer les exigences confirmées des déductions (§§ 2, 5 F2, 8, 11).** FR-006 présente les droits CRUD comme une demande du cahier, tandis que FR-009 et la règle métier 2 disent que plusieurs de ces droits sont des hypothèses. Le cahier source n’est pas présent dans le dossier consulté pour trancher. **Correction proposée :** relier la source et attribuer un statut cohérent à chaque droit; isoler les choix qui restent à confirmer.
2. **Repérer les décisions qui bloquent les travaux aval (§§ 8–10).** Les rôles, la suppression/conservation, les plateformes mobiles et le traitement des données IA n’ont ni responsable ni moment de décision. **Correction proposée :** indiquer pour chaque décision qui la confirme, avant quelle étape, et si elle bloque UX, architecture ou réalisation.
3. **Définir ce qui rend la démonstration réussie (§§ 3–4, 9).** « Démonstration mobile » n’indique ni audience, ni scénario, ni jeu de données, ni résultat attendu; les critères actuels valident surtout des fonctions. **Correction proposée :** décrire audience, scénario et données de démonstration, avec quelques mesures de réussite et contre-mesures (notamment réponses IA non étayées et fuite entre projets).
4. **Rendre la qualité des réponses IA vérifiable (§ 5 F5, FR-026–030).** Une source affichée ne garantit pas que chaque affirmation soit soutenue; seuil de pertinence, réponse partielle et présentation des références sont indéfinis. **Correction proposée :** définir les cas de test « preuve suffisante / partielle / absente », la correspondance réponse-source et le rendu minimum des sources.

## Constats moyens (9)

1. **Relier le MVP à une hypothèse de valeur (§§ 1–4).** Expliquer le problème prioritaire et pourquoi tâches, commentaires, tableau de bord et assistant sont réunis dans cette démonstration.
2. **Préciser la synthèse du tableau de bord (§§ 3–4, FR-021–022).** Dire si les vues par membre et par projet sont toutes deux requises; ajouter un exemple d’acceptation par regroupement.
3. **Définir les filtres, le tri et les commentaires (§ 5 F3, FR-015, FR-019).** Préciser options de tri, combinaison des filtres, valeurs d’échéance, ainsi que règles d’édition/suppression des commentaires.
4. **Encadrer les objectifs de performance et d’accessibilité (§ 7).** Les seuils provisoires manquent d’appareil, réseau, volume et protocole; rendre les attentes mesurables ou les reporter explicitement à la conception UX.
5. **Séparer les exclusions confirmées des exclusions proposées (§ 4).** Push et mode hors ligne sont confirmés; les autres exclusions sont des hypothèses. Les présenter dans deux listes distinctes.
6. **Préciser l’alimentation de l’espace de connaissances (§§ 4–5 F5, FR-023–024, FR-031, 8).** Confirmer qui fournit les contenus de démonstration, quels types de sources sont préchargés et comment ils sont mis à jour; garder l’import utilisateur hors MVP si c’est bien l’intention.
7. **Ajouter des parcours représentatifs (§§ 2–5).** Décrire brièvement avec protagonistes nommés le parcours d’un membre et celui du propriétaire, y compris un refus ou un état vide.
8. **Fixer les plateformes/appareils (§§ 1, 4, 9 et addendum).** Confirmer iOS/Android et formats visés, ou limiter clairement la démonstration à un environnement défini.
9. **Clarifier les choix de suppression et les effets de clôture.** Indiquer ce que signifie supprimer/récupérer les données et si commentaires ou autres changements restent possibles sur un projet clôturé.

## Constats mineurs (1)

- **Uniformiser les noms des synthèses (FR-021).** Employer les mêmes termes pour « par membre » et « par projet » dans les besoins, exigences et critères.

## Notes mécaniques

- FR-001 à FR-031 sont continues et uniques.
- Réordonner les sections : « Validations reçues » (§ 11) précède actuellement « Limites et risques » (§ 9) et « Validation attendue » (§ 10).
- L’introduction du § 3 annonce des cibles numériques, mais le tableau contient surtout des scénarios qualitatifs.
- Dédupliquer les confirmations entre §§ 8 et 11, l’addendum et le journal de décisions.
- Le PRD est en français alors que `document_output_language` est réglé sur English; confirmer la langue voulue avant toute édition.
- Stabiliser le nom du produit (« TaskFlow » ou « TaskFlow Mobile »).
- Clarifier le dénominateur d’avancement : l’addendum dit « tâches actives », tandis que FR-022 et son exemple comptent toutes les tâches non supprimées.
- Harmoniser le délai de 5 secondes de FR-018 avec la possibilité de rafraîchissement contrôlé en FR-016.
- Retirer la répétition sur l’inclusion des commentaires dans l’addendum.
- Harmoniser les marqueurs d’hypothèse et les relier à un index; les hypothèses sont actuellement en prose sans marqueur `[ASSUMPTION]`.

## Proposition de corrections à valider

1. Corriger les statuts contradictoires et mettre en évidence les décisions à confirmer avant UX/architecture.
2. Ajouter les critères de réussite de la démonstration et des réponses IA.
3. Préciser droits, sources de démonstration, plateformes et tableaux de bord concernés.
4. Corriger ordre, dénominations, calcul d’avancement, fraîcheur des données et répétitions.

Le document PRD n’a pas été modifié pendant cette validation.

## Fichier de revue

- `review-rubric.md`
