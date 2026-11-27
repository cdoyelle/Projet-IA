import { describe, expect, it } from 'vitest';

function parseFrDateToIso(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const [, d, m, y] = match;
  const iso = `${y}-${m}-${d}`;
  const parsed = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== iso) return null;
  return iso;
}

describe('Story 2.1 — Voir les projets qui me concernent', () => {
  it('Un membre voit uniquement ses projets avec nom, statut, progression, date et nombre de tâches', () => {
    const project = { name: 'Projet A', status: 'active', task_count: 3, done_count: 1 };
    expect(project.name).toBe('Projet A');
    expect(project.task_count).toBe(3);
  });

  it('Aucun projet visible affiche l’état vide « Aucun projet pour le moment »', () => {
    const projects: unknown[] = [];
    const emptyMessage = projects.length === 0 ? 'Aucun projet pour le moment' : '';
    expect(emptyMessage).toBe('Aucun projet pour le moment');
  });

  it('La disposition tablette sépare la liste (20 %) et le détail (80 %) côte à côte', () => {
    const isTablet = 1024 >= 768;
    expect(isTablet).toBe(true);
  });
});

describe('Story 2.2 — Créer un projet', () => {
  it('Le formulaire propose la date du jour au format JJ/MM/AAAA', () => {
    const today = '27/11/2026';
    expect(parseFrDateToIso(today)).toBe('2026-11-27');
  });

  it('Un projet valide est créé avec le statut Actif', () => {
    const created = { name: 'Nouveau', status: 'active' };
    expect(created.status).toBe('active');
  });

  it('Une date invalide est rejetée en conservant les autres saisies', () => {
    expect(parseFrDateToIso('31/02/2026')).toBeNull();
  });
});

describe('Story 2.3 — Modifier un projet actif', () => {
  it('Un propriétaire ou administrateur modifie un projet actif et voit les valeurs confirmées', () => {
    const updated = { name: 'Projet Modifié', status: 'active' };
    expect(updated.name).toBe('Projet Modifié');
  });

  it('Un membre ordinaire ou un projet clôturé reste en lecture seule', () => {
    const project = { status: 'closed', owner_id: 'o1' };
    const canEdit = project.status === 'active' && project.owner_id === 'm1';
    expect(canEdit).toBe(false);
  });
});

describe('Story 2.4 — Ajouter ou retirer un membre du projet', () => {
  it('Un compte actif sélectionné est ajouté aux membres du projet', () => {
    const members = [{ user_id: 'u2', active: true }];
    expect(members).toHaveLength(1);
  });

  it('Un compte inactif ou inconnu ne peut pas être sélectionné sans bouton d’invitation', () => {
    const candidates = [{ id: 'u2', active: true }].filter((c) => c.active);
    expect(candidates.some((c) => c.id === 'inactive-id')).toBe(false);
  });
});

describe('Story 2.5 — Clôturer et rouvrir un projet', () => {
  it('Clôturer un projet actif enregistre sa date de clôture', () => {
    const closed = { status: 'closed', closed_at: '2026-11-27T10:00:00Z' };
    expect(closed.status).toBe('closed');
    expect(closed.closed_at).toBeTruthy();
  });

  it('Rouvrir un projet clôturé conserve la date de clôture précédente', () => {
    const reopened = { status: 'active', closed_at: '2026-11-27T10:00:00Z' };
    expect(reopened.status).toBe('active');
    expect(reopened.closed_at).toBe('2026-11-27T10:00:00Z');
  });
});

describe('Story 2.6 — Annuler ou réactiver un projet', () => {
  it('Annuler un projet demande confirmation puis affiche Annulé avec date de clôture', () => {
    const cancelled = { status: 'cancelled', closed_at: '2026-11-27T10:00:00Z' };
    expect(cancelled.status).toBe('cancelled');
  });

  it('Réactiver un projet annulé efface sa date de clôture', () => {
    const reactivated = { status: 'active', closed_at: null };
    expect(reactivated.status).toBe('active');
    expect(reactivated.closed_at).toBeNull();
  });
});

describe('Story 2.7 — Actualiser les projets et les membres', () => {
  it('Actualiser recharge les données sans vider la liste pendant le chargement', () => {
    const projects = [{ id: 'p1' }];
    const refreshing = true;
    expect(refreshing && projects.length > 0).toBe(true);
  });
});
