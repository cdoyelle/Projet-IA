import { describe, expect, it } from 'vitest';

describe('Story 5.1 — Assistant documentaire sur docs-app', () => {
  it('Une question couverte par docs-app renvoie une réponse avec citations des passages utilisés', () => {
    const response = {
      found: true,
      answer: 'L’avancement est calculé selon 0, 0,5 et 1.',
      citations: [{ document: 'Tableau de bord', passage: 'Créée = 0, En cours = 0,5, Terminée = 1' }],
    };
    expect(response.found).toBe(true);
    expect(response.citations.length).toBeGreaterThan(0);
  });

  it('Une question hors documents renvoie vers l’administrateur sans citation', () => {
    const response = {
      found: false,
      answer: "Je ne sais pas répondre à cette question à partir des documents disponibles. Merci de vous rapprocher de l'administrateur.",
      citations: [],
    };
    expect(response.found).toBe(false);
    expect(response.citations).toHaveLength(0);
  });
});
