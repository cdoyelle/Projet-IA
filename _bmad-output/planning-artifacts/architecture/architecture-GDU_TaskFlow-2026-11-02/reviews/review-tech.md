# Revue des technologies et versions

**Cible examinée :** `../ARCHITECTURE-SPINE.md`  
**Portée :** fraîcheur des technologies, adéquation au MVP et implications de coût.  
**Date de vérification :** 4 novembre 2026. Sources consultées : documentation officielle des fournisseurs.

## Verdict

Les choix principaux sont cohérents pour le MVP. Expo SDK 58, React Native 0.88, React 19.3 et Node.js 24 LTS sont confirmés par les sources officielles et correspondent au calendrier de cette architecture. Supabase Free et EAS Free permettent un démarrage sans abonnement, sous réserve des quotas et de l’arrêt automatique du projet Supabase inactif. Quelques coûts et limites d’usage doivent être explicités, et certains éléments de pile ne sont pas assez précisément verrouillés.

## Constatations

### Moyen — L’enveloppe de coût ne précise pas les limites d’EAS ni le déclencheur de paiement

La version gratuite d’EAS inclut actuellement 15 builds Android et 15 builds iOS par mois, en file d’attente de basse priorité. Le dépassement bloque les nouveaux builds jusqu’au mois suivant; le forfait Starter coûte 19 USD/mois et apporte des crédits de build. Le document dit seulement « Expo EAS » et ne précise ni ce quota, ni qu’un build local constitue une autre option. Ajouter ces seuils à la décision de coût évitera de découvrir le paiement au premier dépassement. [Tarifs EAS](https://expo.dev/pricing), [forfaits et limites EAS](https://docs.expo.dev/billing/plans/), [FAQ EAS](https://docs.expo.dev/billing/faq/)

### Moyen — Gemini peut générer une facture à l’usage, pas seulement après épuisement d’un quota gratuit

Les appels Gemini sont facturés selon le modèle et l’usage; la gratuité n’est pas un budget contractuel fiable, et certaines données du niveau gratuit peuvent être soumises à des conditions de traitement différentes du niveau payant. Le spine indique que les quotas gratuits varient, mais pas le point de bascule ou la nécessité d’un plafond d’usage. Avant d’activer les appels de démonstration, préciser qui configure la facturation Google et les alertes/plafonds disponibles. Le modèle Gemini 3.5 Flash-Lite et l’embedder Gemini Embedding 2 sont bien documentés comme stables; la dimension 768 est recommandée et valide. [Gemini 3.5 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite), [Gemini Embeddings](https://ai.google.dev/gemini-api/docs/embeddings)

### Faible — La pile nomme des versions indicatives sans toujours les verrouiller

Expo documente bien SDK 58 avec React Native 0.88 et React 19.3.0; le changelog indique que SDK 58 est sorti en octobre 2026. Node.js 24 est LTS, et Expo SDK 58 requiert au minimum 24.3 sur cette ligne. En revanche, `TypeScript 5.x` n’est pas une version reproductible, et `Supabase JS ^2.118.0` laisse les installations futures choisir des versions différentes. Conserver des plages est raisonnable pour une application, à condition que le fichier de verrouillage détermine effectivement les versions utilisées et soit livré. Le spine gagnerait à indiquer ce principe. [Référence SDK 58](https://docs.expo.dev/versions/v58.0.0/), [annonce SDK 58](https://expo.dev/changelog/sdk-58), [versions Node.js](https://nodejs.org/en/about/previous-releases)

### Faible — Le coût Apple est exact mais son besoin dépend du mode de test

Apple confirme le prix de 99 USD par an pour le programme développeur, nécessaire notamment à la distribution TestFlight/App Store. Le besoin pour simplement lancer l’app sur simulateur ou tester sur son propre appareil dépend du mode de signature et de distribution retenu; le spine devrait distinguer ce cas de la distribution à plusieurs testeurs. Le PRD exclut la publication en boutique, et le mode d’installation iOS de démonstration n’est pas encore fixé. [Programme Apple Developer](https://developer.apple.com/programs/)

### Validé — Supabase Free peut servir à la démo, sous réserve de disponibilité

Les pages officielles confirment le forfait Pro à 25 USD/mois et la mise en pause d’un projet Free après une semaine de faible activité. Le passage à Pro devient nécessaire si la démo doit rester disponible sans pause automatique; il peut aussi y avoir des coûts additionnels au-delà des quotas ou pour plusieurs projets/calcul plus puissant. [Tarifs Supabase](https://supabase.com/pricing), [mise en pause des projets gratuits](https://supabase.com/docs/guides/platform/free-project-pausing)

## Sources officielles

- Expo: [SDK 58](https://docs.expo.dev/versions/v58.0.0/), [annonce et changements](https://expo.dev/changelog/sdk-58), [tarifs EAS](https://expo.dev/pricing)
- Supabase: [tarifs](https://supabase.com/pricing), [règles de pause](https://supabase.com/docs/guides/platform/free-project-pausing)
- Google: [modèle Gemini 3.5 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite), [embeddings Gemini](https://ai.google.dev/gemini-api/docs/embeddings)
- Node.js: [état des versions](https://nodejs.org/en/about/previous-releases)
- Apple: [programme développeur](https://developer.apple.com/programs/)
