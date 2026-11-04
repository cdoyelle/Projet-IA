# Revue des technologies — architecture mise à jour

Date : 4 novembre 2026  
Cible : `../ARCHITECTURE-SPINE.md`  
Verdict : les choix nommés sont actuels et adaptés au MVP. Deux petites précisions rendraient la pile plus reproductible et alignée avec le vocabulaire actuel du fournisseur.

## Vérifications

- Expo SDK 58.0.0 est stable. Expo associe SDK 58 à React Native 0.88 et React 19.3.0. La référence SDK v58 recommande `expo-secure-store` ~58.0.2, donc ces versions concordent. [Référence SDK 58](https://docs.expo.dev/versions/v58.0.0/), [SecureStore](https://docs.expo.dev/versions/v58.0.0/sdk/securestore/), [annonce SDK 58](https://expo.dev/blog/how-to-upgrade-to-sdk-58).
- Node.js 24 est LTS; la documentation d’Expo pour SDK 58 donne un minimum Node 22.13.x. [Table des versions Node](https://nodejs.org/en/about/previous-releases), [référence SDK 58](https://docs.expo.dev/versions/v58.0.0/).
- `gemini-3.5-flash-lite` est présenté comme stable, et `gemini-embedding-2` est stable; 768 dimensions est une taille recommandée. Les modèles demeurent bien signalés comme candidats jusqu’au test français prévu. [Gemini 3.5 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite), [embeddings Gemini](https://ai.google.dev/gemini-api/docs/embeddings).
- `expo-secure-store` 58.0.2 est cohérent avec SDK 58. La documentation rappelle que les grandes valeurs peuvent être refusées par le système; l’hypothèse déjà inscrite dans le memlog de tester une vraie session reste pertinente. [SecureStore](https://docs.expo.dev/versions/v58.0.0/sdk/securestore/).

## Points à préciser

### Faible — TypeScript reste défini par une plage large

Le spine indique `TypeScript 5.x`. Le dépôt contient actuellement TypeScript 5.9.3 verrouillé dans `package-lock.json`, mais ce verrou concerne le squelette Next.js existant, pas encore le futur client Expo autonome. Lors de la création du client mobile, fixer sa version effective dans son propre lockfile. Pas besoin de figer un patch dans le spine.

### Faible — Nom actuel des services Expo

La documentation Expo a renommé « EAS » en « Expo Services » et « EAS Build » en « Expo Build »; les services sont les mêmes. Le terme EAS reste répandu et compréhensible, mais écrire « Expo Build (anciennement EAS Build) » une fois dans le document aidera à retrouver la documentation officielle. [Noms Expo actuels](https://docs.expo.dev/eas-to-expo/).

## Conclusion

Aucun blocage de version ou de compatibilité constaté. Ces deux points sont de faible priorité et peuvent être pris en compte comme polish éditorial, sans rouvrir les décisions d’architecture. Les sources des prix EAS, Supabase, Gemini et Apple sont recensées dans `VALIDATION-REPORT.md`.
