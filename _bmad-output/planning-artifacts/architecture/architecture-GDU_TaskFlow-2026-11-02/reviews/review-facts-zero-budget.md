# Revue factuelle — enveloppe de démonstration à 0 €

**Cible :** `ARCHITECTURE-SPINE.md` — TaskFlow Mobile  
**Date de vérification :** 2026-11-06  
**Lentille :** technologie nommée, version, disponibilité, adéquation et promesses de coûts/quota gratuits.  
**Verdict :** les choix actuels de fournisseurs et les principaux tarifs gratuits sont vérifiables dans les sources officielles et correspondent à une petite démo. Le spine conserve toutefois des notes « Deferred » d’une version antérieure qui contredisent le budget de 0 € et la décision Resend; elles doivent être réconciliées avant que le document serve de contrat d’implémentation.

## Constats

### Élevé — les éléments différés contredisent les décisions adoptées

`AD-13` adopte Resend Free pour l’authentification par e-mail quand un domaine existant est disponible, mais la section Deferred propose encore le courriel intégré Supabase comme solution de départ. Elle conserve aussi l’ancien budget `€0–25/month` et une décision de payer Supabase Pro, ainsi qu’une ligne générale de fournisseur e-mail à choisir. Ces lignes donnent deux chemins incompatibles à un constructeur. Remplacer ces restes par la limite de 0 € et l’hypothèse du domaine déjà contrôlé.

Source : [documentation Supabase SMTP et limites de son service intégré](https://supabase.com/docs/guides/auth/auth-smtp), [tarifs Resend](https://resend.com/pricing).

### Moyen — Resend est une décision sans entrée correspondante dans la table Stack

`AD-13` choisit Resend Free et Resend SMTP pour les messages Supabase Auth, mais la table Stack n’énumère que Supabase Auth et Gemini. La carte FR-001–004 associe aussi uniquement Supabase Auth à l’invitation. Ajouter Resend SMTP à la liste d’outils ou préciser le rôle dans la carte, afin d’éviter qu’une équipe implémente par inadvertance le mailer intégré de Supabase.

Le forfait Resend gratuit consulté affiche 3 000 e-mails par mois, une limite de 100 par jour et jusqu’à trois domaines; le domaine doit être contrôlé/vérifié par le propriétaire. Le 0 € dépend donc bien d’un domaine déjà possédé. Le plan gratuit bloque à son quota et n’active pas les dépassements facturés, tandis que le pay-as-you-go est pour les plans payants. Source : [tarifs Resend](https://resend.com/pricing), [configuration SMTP Supabase](https://supabase.com/docs/guides/auth/auth-smtp).

### Moyen — le plafond d’usage de l’application ne garantit pas la disponibilité de Gemini

Le maximum initial de 10 questions par compte et par jour réduit le trafic par compte, mais les quotas Gemini sont appliqués au projet et dépendent du modèle et du niveau de compte. Cette limite ne garantit donc pas que 10 comptes pourront utiliser 10 réponses chacun : le quota externe peut être inférieur, modifié ou déjà consommé. Le spine prévoit correctement `AI_UNAVAILABLE` à épuisement; conserver cette attente dans la prose de l’architecture et vérifier le quota du projet avant la séance de démonstration.

Les deux modèles nommés sont répertoriés comme modèles stables et l’API affiche des prix gratuits pour génération avec `gemini-3.5-flash-lite` et embeddings de texte avec `gemini-embedding-2`. Les limites actives sont consultables dans AI Studio et peuvent varier. Les données Free peuvent être utilisées pour améliorer les produits Google; la règle d’utiliser uniquement un corpus et du texte fictifs est cohérente et doit rester visible. Sources : [modèles Gemini](https://ai.google.dev/gemini-api/docs/models), [tarifs Gemini](https://ai.google.dev/gemini-api/docs/pricing), [limites de requêtes Gemini](https://ai.google.dev/gemini-api/docs/rate-limits), [facturation et disponibilité du niveau gratuit dans l’EEE](https://ai.google.dev/gemini-api/docs/billing).

## Faits vérifiés

- Supabase répertorie la région spécifique `eu-west-3` comme West EU (Paris). La région situe les données principales, sans constituer une certification réglementaire. [Régions Supabase](https://supabase.com/docs/guides/platform/regions)
- Supabase Free peut mettre en pause un projet ayant trop peu d’activité sur une semaine. « Une semaine » est donc un bon avertissement, mais le seuil est une faible activité mesurée, pas une garantie de pause exactement au septième jour. [Règle de pause](https://supabase.com/kb/faqs/platform/free-project-pausing)
- EAS Free affiche jusqu’à 15 builds Android et 15 iOS par mois, avec file de priorité basse. Les comptes Free ne sont pas facturés au dépassement : une fois le quota mensuel épuisé, les nouveaux builds attendent le renouvellement ou un changement d’offre. [Tarifs Expo](https://expo.dev/pricing), [FAQ de facturation Expo](https://docs.expo.dev/billing/faq/)
- Supabase Auth intégré refuse les destinataires extérieurs à l’équipe du projet et limite actuellement l’envoi à 2 messages par heure. L’architecture qui pose Resend comme SMTP gratuit pour les invitations externes évite ce blocage seulement si le domaine d’expéditeur est déjà contrôlé. [SMTP Supabase](https://supabase.com/docs/guides/auth/auth-smtp), [limites Auth](https://supabase.com/docs/guides/auth/rate-limits)
- Le niveau gratuit Gemini est proposé dans l’EEE; il faut toutefois utiliser les endpoints et modèles éligibles au quota gratuit, sans lier un projet de facturation. [Facturation Gemini](https://ai.google.dev/gemini-api/docs/billing)

## Suite suggérée

Réconcilier les éléments différés hérités; ajouter Resend SMTP au Stack et à la carte de capacité Auth; préciser que le plafond interne de 10 questions est un garde-fou d’usage et non une promesse de disponibilité. Aucun changement de code ou de fournisseur n’est requis par cette revue.
