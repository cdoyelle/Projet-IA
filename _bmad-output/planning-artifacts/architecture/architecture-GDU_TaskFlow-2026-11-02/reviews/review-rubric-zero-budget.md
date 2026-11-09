# Revue rubric — Architecture spine TaskFlow, budget zéro

Date : 2026-11-06
Cible : `ARCHITECTURE-SPINE.md`
Méthode : checklist « Good-spine » du Reviewer Gate de `bmad-architecture`.

## Verdict

Le spine fixe solidement les frontières métier et les règles de sécurité, mais il n’est pas encore cohérent comme contrat de construction après le changement de budget. Deux anciennes décisions reportées contredisent directement le budget de 0 € et le choix Resend Free de AD-13; ces divergences doivent être supprimées avant de remettre le document à validation.

## Constatations

### Haute — Les décisions reportées contredisent AD-13 et sa nouvelle hypothèse SMTP

La section Deferred conserve encore des éléments de l’ancien scénario : démarrer par l’e-mail intégré Supabase, considérer le budget initial comme « €0–25/month », traiter la facturation des fournisseurs comme ouverte et laisser le fournisseur e-mail à décider. Ces formulations peuvent amener l’implémentation à réactiver l’option que le spine vient de remplacer par Resend Free et un budget strict de zéro.

**Correction recommandée :** supprimer les lignes redondantes ou les réécrire pour ne garder comme point à confirmer que la disponibilité d’un domaine déjà détenu; retirer l’ancienne fourchette et le parcours de facturation payante de la proposition de démo.

### Moyenne — AD-13 conditionne les e-mails externes à un domaine, mais la capacité de la démo à commencer sans lui n’est pas définie

AD-13 dit qu’en l’absence de domaine, les invitations externes sont une contrainte non résolue, alors que la carte FR-001–004 présente les invitations comme prises en charge. Le cœur du parcours démo a donc un prérequis non tranché. Le forfait intégré Supabase ne délivre actuellement qu’aux adresses autorisées de l’organisation, et à faible débit.

**Correction recommandée :** rendre l’existence d’un domaine déjà détenu explicite comme hypothèse bloquante à confirmer avant le build; sinon définir une variante démonstration précise (ex. utilisateurs précréés, en réservant l’invitation e-mail à un environnement local de test) et signaler qu’elle ne satisfait pas l’envoi externe de FR-001. Source officielle : [Supabase Auth SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

### Moyenne — L’enveloppe financière dépend de quotas variables sans valeur de démonstration attestée

AD-13 fixe une limite applicative initiale de 10 questions par compte et par jour, mais ne donne pas de plafond global de requêtes ni de règle opérationnelle pour vérifier le quota Gemini avant la démo. Comme le niveau gratuit et les limites changent par compte/modèle, l’application peut atteindre son quota même si chaque compte respecte son propre quota.

**Correction recommandée :** garder le refus propre `AI_UNAVAILABLE`, puis ajouter un plafond global de démo configurable ou consigner explicitement que la disponibilité de l’assistant n’est pas garantie le jour de la présentation; le guide officiel dit que les limites varient et ne sont pas garanties : [Gemini rate limits](https://ai.google.dev/gemini-api/docs/rate-limits).

### Faible — Le diagramme de structure omet l’envoi d’e-mails Auth ajouté par AD-13

Le diagramme montre Auth, la base, le Storage, les Edge Functions et Gemini, mais pas Resend; la carte de capacités omet également ce service dans la ligne des comptes. Une équipe pourrait interpréter l’email comme restant interne à Supabase.

**Correction recommandée :** ajouter une liaison Supabase Auth → Resend SMTP, conditionnelle au domaine, et mentionner Resend dans la ligne des comptes.

## Points conformes

- Les identifiants `AD-1` à `AD-13` sont uniques et monotones après déplacement de AD-13; le lint structurel doit être relancé après les corrections.
- Le paradigme layered client/backend avec PostgreSQL comme source de vérité est explicite.
- Les règles de mutations, rôles, visibilité de projet, citations du RAG et cohérence sources/chunks ferment des divergences importantes entre unités.
- L’enveloppe d’hébergement est enfin énoncée : région Supabase, builds cloud, clients Android/iOS, et limites de démo.
- La couverture fonctionnelle relie les exigences PRD aux briques, et les sujets hors MVP restent identifiables.
- Les noms des versions de stack sont présents, mais une vérification officielle doit rester datée au moment de leur adoption (versions Expo, React Native, Gemini et tarifs gratuits).

## Décision de triage suggérée

Corriger la contradiction de Deferred avant validation. Présenter l’absence de domaine comme hypothèse bloquante; la capacité d’e-mail à 0 € ne peut pas être tenue pour acquise autrement. Le plafond Gemini global est un choix de démo à préciser ou à reconnaître comme limite opérationnelle.
