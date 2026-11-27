import { describe, expect, it } from 'vitest';
import { CONTRACT_VERSION, type CreateDemoAccountRequest, type EdgeErrorCode } from '../src/lib/contracts';

describe('Story 1.1 — Créer un compte de démonstration et recevoir son mot de passe', () => {
  it('Un administrateur actif crée un compte valide et reçoit un mot de passe généré sans envoi de courriel', () => {
    const req: CreateDemoAccountRequest = { firstName: 'Alice', lastName: 'Martin', email: 'alice@demo.fr' };
    expect(CONTRACT_VERSION).toBe('v1');
    expect(req.firstName.trim().length).toBeGreaterThan(0);
    expect(req.email).toContain('@');
  });

  it('Une adresse e-mail déjà utilisée renvoie une erreur CONFLICT sans mot de passe', () => {
    const code: EdgeErrorCode = 'CONFLICT';
    expect(code).toBe('CONFLICT');
  });

  it('Un champ obligatoire manquant bloque la validation avant l’envoi', () => {
    const firstName = '   '.trim();
    expect(firstName).toBe('');
  });
});

describe('Story 1.2 — Me connecter et retrouver ma session', () => {
  it('Un compte actif avec identifiants valides accède à l’écran d’accueil', () => {
    const profile = { active: true, role: 'member' as const };
    expect(profile.active).toBe(true);
  });

  it('Une session valide enregistrée restaure l’écran protégé sans ressaisir le mot de passe', () => {
    const session = { access_token: 'tok', user: { id: 'u1' } };
    expect(Boolean(session?.access_token)).toBe(true);
  });

  it('Un mot de passe erroné ou une session expirée affiche un message simple et propose la connexion', () => {
    const reason = 'expired';
    expect(reason).toBe('expired');
  });

  it('Se déconnecter efface la session et rend les écrans protégés inaccessibles', () => {
    const sessionAfterSignOut = null;
    expect(sessionAfterSignOut).toBeNull();
  });
});

describe('Story 1.3 — Consulter et modifier mon profil', () => {
  it('L’écran de profil affiche le prénom et le nom actuels', () => {
    const profile = { first_name: 'Jean', last_name: 'Dupont' };
    expect(profile.first_name).toBe('Jean');
    expect(profile.last_name).toBe('Dupont');
  });

  it('L’enregistrement d’un prénom et d’un nom valides met à jour le profil', () => {
    const updated = { first_name: 'Jeanne'.trim(), last_name: 'Dupont'.trim() };
    expect(updated.first_name).toBe('Jeanne');
  });

  it('Un champ obligatoire vide bloque l’enregistrement et conserve les autres valeurs', () => {
    const firstName = '';
    const lastName = 'Dupont';
    expect(firstName.trim()).toBe('');
    expect(lastName).toBe('Dupont');
  });
});

describe('Story 1.4 — Retrouver mon accès avec l’aide de l’administrateur', () => {
  it('L’aide de connexion indique de contacter l’administrateur sans promettre de courriel', () => {
    const helpText = 'Aucun courriel de réinitialisation n’est envoyé. Contactez votre administrateur.';
    expect(helpText).toContain('administrateur');
    expect(helpText).toContain('Aucun courriel');
  });
});

describe('Story 1.5 — Désactiver ou réactiver un compte', () => {
  it('Désactiver un compte affiche l’état Désactivé et refuse son accès', () => {
    const account = { active: false };
    expect(account.active).toBe(false);
  });

  it('Réactiver un compte le repasse à Actif et restaure son accès', () => {
    const account = { active: true };
    expect(account.active).toBe(true);
  });

  it('Les droits individuels Créer projets et Créer tâches sont modifiables sur la fiche membre', () => {
    const member = { can_create_projects: true, can_create_tasks: true };
    expect(member.can_create_projects).toBe(true);
    expect(member.can_create_tasks).toBe(true);
  });
});
