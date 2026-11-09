# Réconciliation UX — version mise à jour

**Conclusion :** aucune omission bloquante sur les points ciblés.

- E-mails : Resend SMTP, la dépendance à un domaine vérifié, la limite de secours de Supabase, les erreurs `EMAIL_UNAVAILABLE` et le texte proposé à l’administrateur sont décrits.
- Assistant : le document prévoit les erreurs de quota sans facturation de secours, les limites quotidiennes, la conservation de la question, l’absence de réponse explicite et les citations avec nom, extrait et lien ouvrable.
- Navigation et actualisation : les quatre onglets en haut, le maintien du projet courant dans l’assistant, l’adaptation tablette, l’actualisation manuelle et l’heure de dernière lecture sont indiqués.
- Accessibilité : VoiceOver/TalkBack, agrandissement du texte, tailles tactiles, couleur non suffisante seule et réduction des animations sont repris.
- Limites de la démo : quotas gratuits, veille de Supabase, installation Android à 0 €, contrainte iOS autonome, données fictives et absence de garantie de disponibilité sont signalés.

**Détail restant à garder dans le contrat UX :** `architecture.md` ne répète pas le comportement précis du panneau tablette côte à côte, ni les règles détaillées d’état de chargement (garder la liste visible, ne pas soumettre deux fois, annoncer le chargement aux lecteurs d’écran). L’architecture renvoie au design UX et n’a pas besoin de recopier ces spécifications d’écran; aucun changement architectural requis.
