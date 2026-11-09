# Rapprochement PRD — omissions restantes

- **À arbitrer avant démo : invalidation Auth.** Le PRD exige que la désactivation invalide les sessions actives (FR-034, règle métier 3). L’architecture bloque les requêtes par profil/session et impose une reconnexion, mais précise que le jeton Auth peut rester valide jusqu’à expiration. Confirmer si cette révocation au niveau des accès applicatifs suffit à l’acceptation; sinon, définir la révocation de session Auth attendue.
- **Précondition du parcours d’invitation à 0 €.** Les invitations et réinitialisations sont couvertes par Supabase Auth + Resend, mais l’envoi aux comptes de démonstration dépend d’un domaine d’envoi déjà détenu et vérifiable. Le document signale explicitement cette hypothèse; si aucun domaine n’est disponible, FR-001/FR-004/FR-033 ne sont pas assurés gratuitement et le parcours reste bloqué.

Gemini génération + embeddings, pgvector, cloisonnement RLS et recherche par projet, sources citées/absence de réponse, quotas sans facturation, limites gratuites, et hypothèses de volume à 10 comptes / 5 simultanés sont maintenant consignés dans les deux documents. Aucun oubli silencieux trouvé sur ces points.
