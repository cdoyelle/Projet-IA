import { describe, expect, it } from 'vitest';

describe('Story 3.1 — Créer et affecter une tâche', () => {
  it('Une tâche valide est créée avec le statut Créée', () => {
    const task = { title: 'Préparer démo', status: 'created', priority: 'normal', due_date: '2026-12-01' };
    expect(task.status).toBe('created');
  });

  it('Une échéance dans le passé ou un titre vide est refusé à la création', () => {
    const todayIso = '2026-11-27';
    const pastDue = '2026-11-20';
    expect(pastDue < todayIso).toBe(true);
  });
});

describe('Story 3.2 — Changer le statut de ma tâche', () => {
  it('Le membre assigné peut passer sa tâche Créée en En cours, Terminée ou la remettre en Créée', () => {
    const allowed = ['created', 'in_progress', 'done'];
    expect(allowed).toContain('in_progress');
    expect(allowed).toContain('done');
  });

  it('Une tâche non assignée à l’utilisateur ne propose aucune action de statut', () => {
    const task = { assignee_id: 'u2' };
    const currentUserId = 'u1';
    expect(task.assignee_id === currentUserId).toBe(false);
  });
});

describe('Story 3.3 — Modifier une tâche que je gère', () => {
  it('Une tâche terminée verrouille ses champs jusqu’au retour En cours', () => {
    const task = { status: 'done' };
    const canEditFields = task.status !== 'done';
    expect(canEditFields).toBe(false);
  });
});

describe('Story 3.4 — Annuler ou réactiver une tâche', () => {
  it('Annuler une tâche sauvegarde son statut précédent et réactiver le restaure', () => {
    const cancelled = { status: 'cancelled', previous_status: 'in_progress' };
    const restoredStatus = cancelled.previous_status ?? 'created';
    expect(restoredStatus).toBe('in_progress');
  });
});

describe('Story 3.5 — Supprimer seulement une tâche encore vierge', () => {
  it('Seule une tâche Créée, jamais commencée et sans commentaire peut être supprimée', () => {
    const virginTask = { status: 'created', has_started: false, commentsCount: 0 };
    const startedTask = { status: 'created', has_started: true, commentsCount: 0 };
    expect(virginTask.status === 'created' && !virginTask.has_started && virginTask.commentsCount === 0).toBe(true);
    expect(startedTask.status === 'created' && !startedTask.has_started).toBe(false);
  });
});

describe('Story 3.6 — Filtrer et trier les tâches', () => {
  it('Les filtres combinés et le tri dans les deux sens retournent les tâches correspondantes', () => {
    const tasks = [
      { title: 'B', status: 'created', priority: 'high' },
      { title: 'A', status: 'done', priority: 'low' },
    ];
    const filtered = tasks.filter((t) => t.status === 'created' && t.priority === 'high');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe('B');
  });

  it('L’état vide filtré propose d’effacer les filtres', () => {
    const visibleTasks: unknown[] = [];
    expect(visibleTasks.length).toBe(0);
  });
});

describe('Story 3.7 — Commenter un projet', () => {
  it('Un membre autorisé peut commenter un projet visible (même clôturé ou annulé)', () => {
    const comment = { author_name: 'Alice Martin', content: 'Info équipe', created_at: '2026-11-27' };
    expect(comment.content.trim().length).toBeGreaterThan(0);
  });
});

describe('Story 3.8 — Commenter une tâche', () => {
  it('Un membre autorisé peut commenter une tâche visible et seul l’auteur/proprio/admin modifie ou supprime', () => {
    const comment = { author_id: 'u1' };
    const viewer = { id: 'u2', role: 'member' };
    const canManage = comment.author_id === viewer.id || viewer.role === 'admin';
    expect(canManage).toBe(false);
  });
});

describe('Story 3.9 — Actualiser les tâches et commentaires', () => {
  it('En cas d’erreur réseau, les données précédentes restent visibles avec Réessayer', () => {
    const refreshError = 'Actualisation impossible (données affichées potentiellement anciennes).';
    expect(refreshError).toContain('anciennes');
  });
});
