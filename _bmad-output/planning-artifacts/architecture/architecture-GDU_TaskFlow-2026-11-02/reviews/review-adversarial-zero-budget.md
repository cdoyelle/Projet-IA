# Revue adversariale du spine — démonstration à 0 €

## Verdict

Le spine fixe bien les frontières principales des données et des droits. Il reste toutefois des divergences documentaires et d’exécution autour des courriels d’authentification et de la limite Gemini qui devraient être réglées avant que plusieurs unités commencent à construire indépendamment.

## Constatations

### Haute — Les décisions du budget contredisent encore la section Deferred

AD-13 choisit Resend Free comme SMTP Supabase, sous réserve d’un domaine déjà détenu, mais Deferred recommande encore le service d’envoi Supabase intégré à deux reprises. La section de coûts différée mentionne toujours l’ancien budget de 0–25 €/mois et laisse le paiement Gemini ouvert. Deux personnes qui suivent respectivement AD-13 et Deferred peuvent sélectionner des fournisseurs d’e-mail et des règles de facturation différents. Réconcilier ces entrées avec AD-13; garder seulement comme question ouverte la disponibilité du domaine expéditeur et les plafonds gratuits au moment de la démo.

### Moyenne — La limite Gemini est formulée sans règle commune d’application

AD-13 fixe une limite initiale de 10 questions par compte et par jour, mais ne dit pas où le compteur fait foi, comment deux requêtes simultanées sont comptées, ni quand la journée se réinitialise. Une fonction peut vérifier la limite côté Edge et une autre lire un compteur client/cache, ce qui permettrait de dépasser la limite en envoyant plusieurs requêtes en parallèle. Définir une vérification atomique côté serveur, une période commune (par exemple UTC) et les opérations comptabilisées comme une question; les réponses HTTP 429 du fournisseur ne doivent pas modifier le compteur comme si une génération avait réussi.

### Moyenne — Les erreurs de courrier Auth ne font pas partie du contrat commun

AD-11 normalise les erreurs Edge, tandis que l’invitation et la réinitialisation passent directement par Supabase Auth/SMTP. Le spine ne fixe pas la traduction d’une limite d’envoi (`429`), d’une adresse refusée par le SMTP gratuit, ou d’une panne d’e-mail. Deux écrans pourraient afficher des messages techniques différents ou perdre les champs saisis. Étendre les conventions d’erreur aux appels Auth; mapper les erreurs fournisseur vers les mêmes codes stables, notamment `RATE_LIMITED` et `AI_UNAVAILABLE` lorsqu’ils s’appliquent, sans exposer les détails SMTP.

## Paires adversariales imaginées

- **Assistant et administration de quota :** deux fonctions Edge appliquent des compteurs différents ou une vérification non atomique; AD-13 nomme un plafond, mais ne garantit pas son application commune.
- **Invitation et réinitialisation :** deux écrans appellent Auth indépendamment; AD-13 impose Resend conditionnellement, mais ne donne pas de règle partagée pour les erreurs SMTP ni pour l’organisation qui détient le domaine.
- **Données et accès de projet :** un assistant vérifie l’appartenance avant la recherche, un autre lit les chunks directement; AD-2 et AD-4 préviennent ce cas en imposant RLS et un filtre par projet dérivé de la session.

## Vérifications positives

- Les membres ne peuvent pas contourner les rôles en appelant directement les tables : AD-2 établit RLS comme frontière d’autorisation.
- Un extrait ne peut pas citer une source d’un autre projet et la recherche vectorielle est filtrée par projet : AD-4 fixe ces deux règles.
- Les changements de tâches, projets et appartenance sont centralisés dans des mutations transactionnelles : AD-3 et AD-10 limitent les chemins divergents.
- Les clés Gemini et service-role ne sont pas embarquées dans l’application : AD-5 et AD-7 lient leur usage au serveur.

## Conclusion

Résoudre le contenu contradictoire de Deferred, puis préciser le compteur Gemini et les erreurs Auth dans le spine ou ses conventions. Le reste des frontières d’accès et de mutation est suffisamment convergent pour la portée de la démo.
