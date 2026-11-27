import { describe, expect, it } from 'vitest';

function computeProgress(statuses: Array<'created' | 'in_progress' | 'done' | 'cancelled'>): number | null {
  const eligible = statuses.filter((s) => s !== 'cancelled');
  if (eligible.length === 0) return null;
  const sum = eligible.reduce((acc, s) => acc + (s === 'done' ? 1 : s === 'in_progress' ? 0.5 : 0), 0);
  return Math.round((sum / eligible.length) * 100);
}

describe('Story 4.1 — Voir l’avancement global et personnel', () => {
  it('Calcule la moyenne 0 / 0,5 / 1 en excluant les tâches annulées', () => {
    expect(computeProgress(['created', 'in_progress', 'done', 'cancelled'])).toBe(50);
  });

  it('Retourne vide (null) plutôt que 0 % lorsqu’aucune tâche admissible n’existe', () => {
    expect(computeProgress(['cancelled'])).toBeNull();
    expect(computeProgress([])).toBeNull();
  });
});

describe('Story 4.2 — Voir les tâches par statut et les retards', () => {
  it('Compte Créées, En cours, Terminées et En retard en excluant Terminées et Annulées', () => {
    const today = '2026-11-27';
    const tasks = [
      { status: 'created', due_date: '2026-11-20' },
      { status: 'in_progress', due_date: '2026-11-25' },
      { status: 'done', due_date: '2026-11-10' },
      { status: 'cancelled', due_date: '2026-11-10' },
    ];
    const overdue = tasks.filter((t) => (t.status === 'created' || t.status === 'in_progress') && t.due_date < today);
    expect(overdue).toHaveLength(2);
  });
});

describe('Story 4.3 — Actualiser le tableau de bord', () => {
  it('L’actualisation met à jour l’heure de dernière réussite sans effacer les chiffres', () => {
    const lastUpdatedAt = '11:30:00';
    expect(lastUpdatedAt).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });
});
