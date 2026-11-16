import { type ComponentRef, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, type Href, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '@/src/lib/supabase';
import { useTheme } from '@/src/lib/theme';

type UserRole = 'admin' | 'owner' | 'member';

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'closed';
  start_date: string;
  due_date: string | null;
  owner_id: string;
};

type ProjectMember = {
  user_id: string;
  first_name: string;
  last_name: string;
  role: UserRole;
};

type ActiveCandidate = {
  id: string;
  first_name: string;
  last_name: string;
  role: UserRole;
};

type ProjectFormErrors = { name?: string; startDate?: string; dueDate?: string };
type TextInputInstance = ComponentRef<typeof TextInput>;

function todayFrDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${d}/${m}/${y}`;
}

function parseFrDateToIso(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const [, d, m, y] = match;
  const iso = `${y}-${m}-${d}`;
  const parsed = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== iso) return null;
  return iso;
}

function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function dateToFrString(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function frStringToDate(value: string): Date {
  const iso = parseFrDateToIso(value);
  if (!iso) return new Date();
  return new Date(`${iso}T00:00:00`);
}

function formatDateFr(isoDate: string | null): string {
  if (!isoDate) return 'Non définie';
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isAuthRejection(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const code = error.code ?? '';
  const msg = error.message?.toLowerCase() ?? '';
  return code === 'PGRST301' || code === '42501' || msg.includes('jwt') || msg.includes('unauthorized');
}

export default function Projects() {
  const theme = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const horizontalGutter = isTablet ? 28 : 16;

  const mountedRef = useRef(true);
  const signingOutRef = useRef(false);
  const hasVerifiedRef = useRef(false);
  const checkSeqRef = useRef(0);

  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [redirectHref, setRedirectHref] = useState<Href>('/sign-in?reason=expired');
  const [signingOut, setSigningOut] = useState(false);
  const [role, setRole] = useState<UserRole>('member');
  const [userId, setUserId] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');

  const nameRef = useRef<TextInputInstance>(null);
  const startDateRef = useRef<TextInputInstance>(null);
  const dueDateRef = useRef<TextInputInstance>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(todayFrDate);
  const [dueDate, setDueDate] = useState('');
  const [activePicker, setActivePicker] = useState<'start' | 'due' | null>(null);
  const [formErrors, setFormErrors] = useState<ProjectFormErrors>({});
  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState('');
  const [createError, setCreateError] = useState('');

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editPicker, setEditPicker] = useState<'start' | 'due' | null>(null);
  const [editErrors, setEditErrors] = useState<ProjectFormErrors>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [editMessage, setEditMessage] = useState('');
  const [editError, setEditError] = useState('');

  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [candidates, setCandidates] = useState<ActiveCandidate[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberBusyId, setMemberBusyId] = useState<string | null>(null);
  const [memberError, setMemberError] = useState('');

  const verifyAndLoad = useCallback(async () => {
    const seq = ++checkSeqRef.current;
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !data.session) {
        if (sessionError) {
          try { await supabase.auth.signOut(); } catch { /* ignore */ }
        }
        if (mountedRef.current && !signingOutRef.current && seq === checkSeqRef.current) {
          hasVerifiedRef.current = false;
          setRedirectHref('/sign-in?reason=expired');
          setAuthorized(false);
          setChecking(false);
          router.replace('/sign-in?reason=expired');
        }
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, active')
        .eq('id', data.session.user.id)
        .maybeSingle();

      if (profileError || !profile?.active) {
        if (profileError && hasVerifiedRef.current && !isAuthRejection(profileError)) return;
        try { await supabase.auth.signOut(); } catch { /* ignore */ }
        if (mountedRef.current && !signingOutRef.current && seq === checkSeqRef.current) {
          hasVerifiedRef.current = false;
          setRedirectHref('/sign-in?reason=expired');
          setAuthorized(false);
          setChecking(false);
          router.replace('/sign-in?reason=expired');
        }
        return;
      }

      const validRole: UserRole = profile.role === 'admin' || profile.role === 'owner' ? profile.role : 'member';
      const { data: rows, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, description, status, start_date, due_date, owner_id')
        .order('created_at', { ascending: false });

      if (!mountedRef.current || signingOutRef.current || seq !== checkSeqRef.current) return;

      hasVerifiedRef.current = true;
      setUserId(data.session.user.id);
      setRole(validRole);
      setAuthorized(true);
      setChecking(false);

      if (projectsError) {
        setLoadError('Impossible de charger vos projets. Vérifiez votre connexion, puis réessayez.');
      } else {
        const list = (rows ?? []) as ProjectRow[];
        setProjects(list);
        setLoadError('');
        setSelectedId((prev) => (prev && list.some((p) => p.id === prev) ? prev : list[0]?.id ?? null));
      }
    } catch {
      if (hasVerifiedRef.current) return;
      try { await supabase.auth.signOut(); } catch { /* ignore */ }
      if (mountedRef.current && !signingOutRef.current && seq === checkSeqRef.current) {
        hasVerifiedRef.current = false;
        setRedirectHref('/sign-in?reason=expired');
        setAuthorized(false);
        setChecking(false);
        router.replace('/sign-in?reason=expired');
      }
    }
  }, [router]);

  useEffect(() => {
    mountedRef.current = true;
    verifyAndLoad();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mountedRef.current) return;
      if (!session || event === 'SIGNED_OUT') {
        const target: Href = signingOutRef.current ? '/sign-in' : '/sign-in?reason=expired';
        hasVerifiedRef.current = false;
        setRedirectHref(target);
        setAuthorized(false);
        setChecking(false);
        router.replace(target);
        return;
      }
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        verifyAndLoad();
      }
    });

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && mountedRef.current && !signingOutRef.current) {
        verifyAndLoad();
      }
    });

    return () => {
      mountedRef.current = false;
      listener.subscription.unsubscribe();
      appStateSubscription.remove();
    };
  }, [router, verifyAndLoad]);

  function openCreateForm() {
    setStartDate(todayFrDate());
    setFormErrors({});
    setCreateError('');
    setCreateMessage('');
    setShowForm(true);
  }

  async function createProject() {
    if (creating || signingOut || !userId) return;
    const errors: ProjectFormErrors = {};
    const trimmedName = name.trim();
    const trimmedStart = startDate.trim();
    const trimmedDue = dueDate.trim();

    if (!trimmedName) {
      errors.name = 'Saisissez le nom du projet.';
    } else if (trimmedName.length > 120) {
      errors.name = 'Le nom ne doit pas dépasser 120 caractères.';
    }
    const startIso = parseFrDateToIso(trimmedStart);
    if (!startIso) {
      errors.startDate = 'Saisissez une date valide (JJ/MM/AAAA).';
    }
    let dueIso: string | null = null;
    if (trimmedDue) {
      dueIso = parseFrDateToIso(trimmedDue);
      if (!dueIso) {
        errors.dueDate = 'Saisissez une date valide (JJ/MM/AAAA).';
      } else if (startIso && dueIso < startIso) {
        errors.dueDate = 'L’échéance doit être postérieure ou égale à la date de début.';
      }
    }

    setFormErrors(errors);
    setCreateError('');
    if (Object.keys(errors).length > 0) {
      if (errors.name) nameRef.current?.focus();
      else if (errors.startDate) startDateRef.current?.focus();
      else if (errors.dueDate) dueDateRef.current?.focus();
      return;
    }

    setCreating(true);
    try {
      const { data: created, error } = await supabase
        .from('projects')
        .insert({
          name: trimmedName,
          description: description.trim() || null,
          status: 'active',
          start_date: startIso!,
          due_date: dueIso,
          owner_id: userId,
        })
        .select('id, name, description, status, start_date, due_date, owner_id')
        .single();

      if (!mountedRef.current || signingOutRef.current) return;
      if (error || !created) {
        if (error?.code === '42501') {
          setCreateError('Action non autorisée. Vérifiez que votre rôle ou les droits Supabase sont bien à jour.');
        } else {
          setCreateError('Impossible de créer le projet. Vérifiez votre connexion, puis réessayez.');
        }
        return;
      }

      const row = created as ProjectRow;
      setProjects((prev) => [row, ...prev]);
      setSelectedId(row.id);
      setName('');
      setDescription('');
      setDueDate('');
      setFormErrors({});
      setShowForm(false);
      setCreateMessage('Le projet a été créé avec le statut Actif.');
    } catch {
      if (!mountedRef.current || signingOutRef.current) return;
      setCreateError('Impossible de créer le projet. Vérifiez votre connexion, puis réessayez.');
    } finally {
      if (mountedRef.current) setCreating(false);
    }
  }

  function startEditing(project: ProjectRow) {
    setEditName(project.name);
    setEditDescription(project.description ?? '');
    setEditStartDate(dateToFrString(new Date(`${project.start_date}T00:00:00`)));
    setEditDueDate(project.due_date ? dateToFrString(new Date(`${project.due_date}T00:00:00`)) : '');
    setEditPicker(null);
    setEditErrors({});
    setEditError('');
    setEditMessage('');
    setEditing(true);
  }

  async function saveProjectEdit(project: ProjectRow) {
    if (savingEdit || signingOut) return;
    const errors: ProjectFormErrors = {};
    const trimmedName = editName.trim();
    const trimmedStart = editStartDate.trim();
    const trimmedDue = editDueDate.trim();

    if (!trimmedName) {
      errors.name = 'Saisissez le nom du projet.';
    } else if (trimmedName.length > 120) {
      errors.name = 'Le nom ne doit pas dépasser 120 caractères.';
    }
    const startIso = parseFrDateToIso(trimmedStart);
    if (!startIso) {
      errors.startDate = 'Saisissez une date valide (JJ/MM/AAAA).';
    }
    let dueIso: string | null = null;
    if (trimmedDue) {
      dueIso = parseFrDateToIso(trimmedDue);
      if (!dueIso) {
        errors.dueDate = 'Saisissez une date valide (JJ/MM/AAAA).';
      } else if (startIso && dueIso < startIso) {
        errors.dueDate = 'L’échéance doit être postérieure ou égale à la date de début.';
      }
    }

    setEditErrors(errors);
    setEditError('');
    if (Object.keys(errors).length > 0) return;

    setSavingEdit(true);
    try {
      const { data: updated, error } = await supabase
        .from('projects')
        .update({
          name: trimmedName,
          description: editDescription.trim() || null,
          start_date: startIso!,
          due_date: dueIso,
        })
        .eq('id', project.id)
        .select('id, name, description, status, start_date, due_date, owner_id')
        .single();

      if (!mountedRef.current || signingOutRef.current) return;
      if (error || !updated) {
        if (error?.code === '42501') {
          setEditError('Modification non autorisée pour ce projet.');
        } else {
          setEditError('Impossible d’enregistrer les modifications. Vérifiez votre connexion, puis réessayez.');
        }
        return;
      }

      const row = updated as ProjectRow;
      setProjects((prev) => prev.map((p) => (p.id === row.id ? row : p)));
      setEditing(false);
      setEditMessage('Les modifications du projet ont été enregistrées.');
    } catch {
      if (!mountedRef.current || signingOutRef.current) return;
      setEditError('Impossible d’enregistrer les modifications. Vérifiez votre connexion, puis réessayez.');
    } finally {
      if (mountedRef.current) setSavingEdit(false);
    }
  }

  const loadMembersForProject = useCallback(async (projectId: string, canManage: boolean) => {
    setMemberError('');
    try {
      const { data: memberRows, error: mErr } = await supabase.rpc('list_project_members', {
        p_project_id: projectId,
      });
      if (!mountedRef.current || signingOutRef.current) return;
      if (mErr) {
        setMemberError('Impossible de charger les membres du projet.');
      } else {
        setMembers((memberRows ?? []) as ProjectMember[]);
      }

      if (canManage) {
        const { data: candRows } = await supabase.rpc('list_active_profiles_for_project');
        if (!mountedRef.current || signingOutRef.current) return;
        setCandidates((candRows ?? []) as ActiveCandidate[]);
      }
    } catch {
      if (!mountedRef.current || signingOutRef.current) return;
      setMemberError('Impossible de charger les membres du projet.');
    }
  }, []);

  useEffect(() => {
    if (!authorized || !selectedId) {
      setMembers([]);
      return;
    }
    const proj = projects.find((p) => p.id === selectedId);
    const canManage = !!proj && proj.status === 'active' && (role === 'admin' || proj.owner_id === userId);
    loadMembersForProject(selectedId, canManage);
  }, [authorized, selectedId, projects, role, userId, loadMembersForProject]);

  async function addMember(projectId: string, candidate: ActiveCandidate) {
    if (memberBusyId || signingOut) return;
    setMemberBusyId(candidate.id);
    setMemberError('');
    try {
      const { error } = await supabase.rpc('add_project_member', {
        p_project_id: projectId,
        p_user_id: candidate.id,
      });
      if (!mountedRef.current || signingOutRef.current) return;
      if (error) {
        setMemberError('Impossible d’ajouter ce membre.');
        return;
      }
      setMembers((prev) => [
        ...prev,
        {
          user_id: candidate.id,
          first_name: candidate.first_name,
          last_name: candidate.last_name,
          role: candidate.role,
        },
      ]);
      setMemberSearch('');
    } catch {
      if (!mountedRef.current || signingOutRef.current) return;
      setMemberError('Impossible d’ajouter ce membre.');
    } finally {
      if (mountedRef.current) setMemberBusyId(null);
    }
  }

  async function removeMember(projectId: string, memberUserId: string) {
    if (memberBusyId || signingOut) return;
    setMemberBusyId(memberUserId);
    setMemberError('');
    try {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', memberUserId);
      if (!mountedRef.current || signingOutRef.current) return;
      if (error) {
        setMemberError('Impossible de retirer ce membre.');
        return;
      }
      setMembers((prev) => prev.filter((m) => m.user_id !== memberUserId));
    } catch {
      if (!mountedRef.current || signingOutRef.current) return;
      setMemberError('Impossible de retirer ce membre.');
    } finally {
      if (mountedRef.current) setMemberBusyId(null);
    }
  }

  async function signOut() {
    if (signingOut) return;
    signingOutRef.current = true;
    checkSeqRef.current += 1;
    hasVerifiedRef.current = false;
    setSigningOut(true);
    setRedirectHref('/sign-in');
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore errors on sign-out and redirect.
    } finally {
      if (mountedRef.current) {
        setAuthorized(false);
        setSigningOut(false);
        router.replace('/sign-in');
      }
    }
  }

  if (checking) {
    return (
      <View style={[styles.center, { backgroundColor: theme.surface }]}>
        <ActivityIndicator accessibilityLabel="Chargement des projets" color={theme.primary} />
      </View>
    );
  }
  if (!authorized) return <Redirect href={redirectHref} />;

  const selectedProject = projects.find((p) => p.id === selectedId) ?? null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.surface }]}>
      <ScrollView contentContainerStyle={[styles.page, { paddingHorizontal: horizontalGutter }]}>
        <View style={[styles.container, isTablet && styles.containerTablet]}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={[styles.brand, { color: theme.primary }]}>TaskFlow</Text>
              <Text accessibilityRole="header" style={[styles.title, { color: theme.ink }]}>Projets</Text>
            </View>
            <View style={styles.headerActions}>
              {(role === 'admin' || role === 'owner') && (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Nouveau projet"
                  disabled={signingOut}
                  onPress={openCreateForm}
                  style={[styles.headerBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}
                >
                  <Text style={[styles.headerBtnText, { color: theme.onPrimary }]}>Nouveau projet</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Retour à l’accueil"
                disabled={signingOut}
                onPress={() => router.replace('/home')}
                style={[styles.headerBtn, { backgroundColor: theme.subtle, borderColor: theme.border }]}
              >
                <Text style={[styles.headerBtnText, { color: theme.ink }]}>Accueil</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Se déconnecter"
                disabled={signingOut}
                onPress={signOut}
                style={[styles.headerBtn, { backgroundColor: theme.subtle, borderColor: theme.border }]}
              >
                <Text style={[styles.headerBtnText, { color: theme.ink }]}>Se déconnecter</Text>
              </TouchableOpacity>
            </View>
          </View>

          {!!createMessage && (
            <Text accessibilityRole="alert" style={[styles.successText, { color: theme.success }]}>{createMessage}</Text>
          )}

          {showForm && (
            <View style={[styles.formCard, { backgroundColor: theme.raised, borderColor: theme.border }]}>
              <Text accessibilityRole="header" style={[styles.formTitle, { color: theme.ink }]}>Nouveau projet</Text>

              <Text style={[styles.label, { color: theme.ink }]}>Nom du projet</Text>
              <TextInput
                ref={nameRef}
                accessibilityLabel="Nom du projet"
                editable={!creating}
                value={name}
                onChangeText={(val) => {
                  setName(val);
                  if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: undefined }));
                }}
                style={[styles.input, { color: theme.ink, backgroundColor: theme.surface, borderColor: formErrors.name ? theme.danger : theme.border }]}
              />
              {!!formErrors.name && <Text accessibilityRole="alert" style={[styles.fieldError, { color: theme.danger }]}>{formErrors.name}</Text>}

              <Text style={[styles.label, { color: theme.ink }]}>Description (facultatif)</Text>
              <TextInput
                accessibilityLabel="Description"
                editable={!creating}
                multiline
                value={description}
                onChangeText={setDescription}
                style={[styles.input, styles.textArea, { color: theme.ink, backgroundColor: theme.surface, borderColor: theme.border }]}
              />

              <Text style={[styles.label, { color: theme.ink }]}>Date de début (JJ/MM/AAAA)</Text>
              <View style={styles.dateRow}>
                <TextInput
                  ref={startDateRef}
                  accessibilityLabel="Date de début"
                  editable={!creating}
                  keyboardType="number-pad"
                  maxLength={10}
                  value={startDate}
                  onChangeText={(val) => {
                    setStartDate(formatDateInput(val));
                    if (formErrors.startDate) setFormErrors((prev) => ({ ...prev, startDate: undefined }));
                  }}
                  style={[styles.input, styles.dateInput, { color: theme.ink, backgroundColor: theme.surface, borderColor: formErrors.startDate ? theme.danger : theme.border }]}
                />
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Choisir la date de début dans le calendrier"
                  disabled={creating}
                  onPress={() => setActivePicker((prev) => (prev === 'start' ? null : 'start'))}
                  style={[styles.calendarBtn, { backgroundColor: theme.subtle, borderColor: theme.border }]}
                >
                  <Text style={[styles.calendarBtnText, { color: theme.ink }]}>Calendrier</Text>
                </TouchableOpacity>
              </View>
              {activePicker === 'start' && (
                <DateTimePicker
                  value={frStringToDate(startDate)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={(_event, selected) => {
                    if (Platform.OS !== 'ios') setActivePicker(null);
                    if (selected) {
                      setStartDate(dateToFrString(selected));
                      if (formErrors.startDate) setFormErrors((prev) => ({ ...prev, startDate: undefined }));
                    }
                  }}
                />
              )}
              {!!formErrors.startDate && <Text accessibilityRole="alert" style={[styles.fieldError, { color: theme.danger }]}>{formErrors.startDate}</Text>}

              <Text style={[styles.label, { color: theme.ink }]}>Date d’échéance (facultatif, JJ/MM/AAAA)</Text>
              <View style={styles.dateRow}>
                <TextInput
                  ref={dueDateRef}
                  accessibilityLabel="Date d’échéance"
                  editable={!creating}
                  keyboardType="number-pad"
                  maxLength={10}
                  placeholder="JJ/MM/AAAA"
                  placeholderTextColor={theme.muted}
                  value={dueDate}
                  onChangeText={(val) => {
                    setDueDate(formatDateInput(val));
                    if (formErrors.dueDate) setFormErrors((prev) => ({ ...prev, dueDate: undefined }));
                  }}
                  style={[styles.input, styles.dateInput, { color: theme.ink, backgroundColor: theme.surface, borderColor: formErrors.dueDate ? theme.danger : theme.border }]}
                />
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Choisir la date d’échéance dans le calendrier"
                  disabled={creating}
                  onPress={() => setActivePicker((prev) => (prev === 'due' ? null : 'due'))}
                  style={[styles.calendarBtn, { backgroundColor: theme.subtle, borderColor: theme.border }]}
                >
                  <Text style={[styles.calendarBtnText, { color: theme.ink }]}>Calendrier</Text>
                </TouchableOpacity>
              </View>
              {activePicker === 'due' && (
                <DateTimePicker
                  value={frStringToDate(dueDate || startDate)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={(_event, selected) => {
                    if (Platform.OS !== 'ios') setActivePicker(null);
                    if (selected) {
                      setDueDate(dateToFrString(selected));
                      if (formErrors.dueDate) setFormErrors((prev) => ({ ...prev, dueDate: undefined }));
                    }
                  }}
                />
              )}
              {!!formErrors.dueDate && <Text accessibilityRole="alert" style={[styles.fieldError, { color: theme.danger }]}>{formErrors.dueDate}</Text>}

              {!!createError && <Text accessibilityRole="alert" style={[styles.fieldError, { color: theme.danger }]}>{createError}</Text>}

              <View style={styles.formActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Créer le projet"
                  disabled={creating}
                  onPress={createProject}
                  style={[styles.primaryBtn, { backgroundColor: theme.primary, opacity: creating ? 0.7 : 1 }]}
                >
                  {creating ? <ActivityIndicator color={theme.onPrimary} /> : <Text style={{ color: theme.onPrimary, fontWeight: '700', fontSize: 16 }}>Créer le projet</Text>}
                </Pressable>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Annuler"
                  disabled={creating}
                  onPress={() => setShowForm(false)}
                  style={[styles.headerBtn, { backgroundColor: theme.subtle, borderColor: theme.border }]}
                >
                  <Text style={[styles.headerBtnText, { color: theme.ink }]}>Annuler</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {!!loadError && (
            <Text accessibilityRole="alert" style={[styles.errorText, { color: theme.danger }]}>{loadError}</Text>
          )}

          {projects.length === 0 && !loadError ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.raised, borderColor: theme.border }]}>
              <Text style={[styles.emptyTitle, { color: theme.ink }]}>Aucun projet pour le moment</Text>
              {(role === 'admin' || role === 'owner') && (
                <Text style={[styles.emptyHint, { color: theme.muted }]}>
                  Votre rôle vous permettra de créer un projet dans l’étape suivante.
                </Text>
              )}
            </View>
          ) : (
            <View style={[styles.splitLayout, isTablet && styles.splitLayoutTablet]}>
              <View style={[styles.listColumn, isTablet && styles.listColumnTablet]}>
                {projects.map((project) => {
                  const isSelected = project.id === selectedId;
                  return (
                    <Pressable
                      key={project.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Projet ${project.name}`}
                      onPress={() => {
                        setSelectedId(project.id);
                        setEditing(false);
                        setEditMessage('');
                        setEditError('');
                      }}
                      style={[
                        styles.projectCard,
                        {
                          backgroundColor: theme.raised,
                          borderColor: isSelected ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <View style={styles.cardTop}>
                        <Text style={[styles.projectName, { color: theme.ink }]}>{project.name}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: theme.subtle }]}>
                          <Text style={[styles.statusText, { color: project.status === 'active' ? theme.primary : theme.muted }]}>
                            {project.status === 'active' ? 'Actif' : 'Clôturé'}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.metaText, { color: theme.muted }]}>
                        Progression : 0 % · 0 tâche
                      </Text>
                      <Text style={[styles.metaText, { color: theme.muted }]}>
                        {project.due_date ? `Échéance : ${formatDateFr(project.due_date)}` : `Début : ${formatDateFr(project.start_date)}`}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {selectedProject && (
                <View style={[styles.detailColumn, !isTablet && styles.detailColumnPhone, { backgroundColor: theme.raised, borderColor: theme.border }]}>
                  <Text accessibilityRole="header" style={[styles.detailTitle, { color: theme.ink }]}>
                    {selectedProject.name}
                  </Text>
                  <Text style={[styles.detailMeta, { color: theme.muted }]}>
                    Statut : {selectedProject.status === 'active' ? 'Actif' : 'Clôturé'} · Progression : 0 % · 0 tâche
                  </Text>
                  <Text style={[styles.detailMeta, { color: theme.muted }]}>
                    Début : {formatDateFr(selectedProject.start_date)}
                    {selectedProject.due_date ? ` · Échéance : ${formatDateFr(selectedProject.due_date)}` : ''}
                  </Text>
                  <Text style={[styles.detailBody, { color: theme.ink }]}>
                    {selectedProject.description || 'Aucune description renseignée.'}
                  </Text>

                  {selectedProject.status === 'closed' && (
                    <Text style={[styles.readOnlyNote, { color: theme.muted }]}>
                      Ce projet est clôturé : ses informations et tâches sont en lecture seule.
                    </Text>
                  )}

                  {!!editMessage && (
                    <Text accessibilityRole="alert" style={[styles.successText, { color: theme.success }]}>{editMessage}</Text>
                  )}

                  {selectedProject.status === 'active' && (role === 'admin' || selectedProject.owner_id === userId) && !editing && (
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel="Modifier le projet"
                      onPress={() => startEditing(selectedProject)}
                      style={[styles.calendarBtn, { backgroundColor: theme.subtle, borderColor: theme.border, alignSelf: 'flex-start', marginTop: 8 }]}
                    >
                      <Text style={[styles.calendarBtnText, { color: theme.ink }]}>Modifier le projet</Text>
                    </TouchableOpacity>
                  )}

                  {editing && (
                    <View style={styles.editSection}>
                      <Text style={[styles.label, { color: theme.ink }]}>Nom du projet</Text>
                      <TextInput
                        accessibilityLabel="Modifier le nom du projet"
                        editable={!savingEdit}
                        value={editName}
                        onChangeText={(val) => {
                          setEditName(val);
                          if (editErrors.name) setEditErrors((prev) => ({ ...prev, name: undefined }));
                        }}
                        style={[styles.input, { color: theme.ink, backgroundColor: theme.surface, borderColor: editErrors.name ? theme.danger : theme.border }]}
                      />
                      {!!editErrors.name && <Text accessibilityRole="alert" style={[styles.fieldError, { color: theme.danger }]}>{editErrors.name}</Text>}

                      <Text style={[styles.label, { color: theme.ink }]}>Description (facultatif)</Text>
                      <TextInput
                        accessibilityLabel="Modifier la description"
                        editable={!savingEdit}
                        multiline
                        value={editDescription}
                        onChangeText={setEditDescription}
                        style={[styles.input, styles.textArea, { color: theme.ink, backgroundColor: theme.surface, borderColor: theme.border }]}
                      />

                      <Text style={[styles.label, { color: theme.ink }]}>Date de début (JJ/MM/AAAA)</Text>
                      <View style={styles.dateRow}>
                        <TextInput
                          accessibilityLabel="Modifier la date de début"
                          editable={!savingEdit}
                          keyboardType="number-pad"
                          maxLength={10}
                          value={editStartDate}
                          onChangeText={(val) => {
                            setEditStartDate(formatDateInput(val));
                            if (editErrors.startDate) setEditErrors((prev) => ({ ...prev, startDate: undefined }));
                          }}
                          style={[styles.input, styles.dateInput, { color: theme.ink, backgroundColor: theme.surface, borderColor: editErrors.startDate ? theme.danger : theme.border }]}
                        />
                        <TouchableOpacity
                          accessibilityRole="button"
                          onPress={() => setEditPicker((prev) => (prev === 'start' ? null : 'start'))}
                          style={[styles.calendarBtn, { backgroundColor: theme.subtle, borderColor: theme.border }]}
                        >
                          <Text style={[styles.calendarBtnText, { color: theme.ink }]}>Calendrier</Text>
                        </TouchableOpacity>
                      </View>
                      {editPicker === 'start' && (
                        <DateTimePicker
                          value={frStringToDate(editStartDate)}
                          mode="date"
                          display={Platform.OS === 'ios' ? 'inline' : 'default'}
                          onChange={(_event, selected) => {
                            if (Platform.OS !== 'ios') setEditPicker(null);
                            if (selected) {
                              setEditStartDate(dateToFrString(selected));
                              if (editErrors.startDate) setEditErrors((prev) => ({ ...prev, startDate: undefined }));
                            }
                          }}
                        />
                      )}
                      {!!editErrors.startDate && <Text accessibilityRole="alert" style={[styles.fieldError, { color: theme.danger }]}>{editErrors.startDate}</Text>}

                      <Text style={[styles.label, { color: theme.ink }]}>Date d’échéance (facultatif, JJ/MM/AAAA)</Text>
                      <View style={styles.dateRow}>
                        <TextInput
                          accessibilityLabel="Modifier la date d’échéance"
                          editable={!savingEdit}
                          keyboardType="number-pad"
                          maxLength={10}
                          placeholder="JJ/MM/AAAA"
                          placeholderTextColor={theme.muted}
                          value={editDueDate}
                          onChangeText={(val) => {
                            setEditDueDate(formatDateInput(val));
                            if (editErrors.dueDate) setEditErrors((prev) => ({ ...prev, dueDate: undefined }));
                          }}
                          style={[styles.input, styles.dateInput, { color: theme.ink, backgroundColor: theme.surface, borderColor: editErrors.dueDate ? theme.danger : theme.border }]}
                        />
                        <TouchableOpacity
                          accessibilityRole="button"
                          onPress={() => setEditPicker((prev) => (prev === 'due' ? null : 'due'))}
                          style={[styles.calendarBtn, { backgroundColor: theme.subtle, borderColor: theme.border }]}
                        >
                          <Text style={[styles.calendarBtnText, { color: theme.ink }]}>Calendrier</Text>
                        </TouchableOpacity>
                      </View>
                      {editPicker === 'due' && (
                        <DateTimePicker
                          value={frStringToDate(editDueDate || editStartDate)}
                          mode="date"
                          display={Platform.OS === 'ios' ? 'inline' : 'default'}
                          onChange={(_event, selected) => {
                            if (Platform.OS !== 'ios') setEditPicker(null);
                            if (selected) {
                              setEditDueDate(dateToFrString(selected));
                              if (editErrors.dueDate) setEditErrors((prev) => ({ ...prev, dueDate: undefined }));
                            }
                          }}
                        />
                      )}
                      {!!editErrors.dueDate && <Text accessibilityRole="alert" style={[styles.fieldError, { color: theme.danger }]}>{editErrors.dueDate}</Text>}

                      {!!editError && <Text accessibilityRole="alert" style={[styles.fieldError, { color: theme.danger }]}>{editError}</Text>}

                      <View style={styles.formActions}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Enregistrer les modifications"
                          disabled={savingEdit}
                          onPress={() => saveProjectEdit(selectedProject)}
                          style={[styles.primaryBtn, { backgroundColor: theme.primary, opacity: savingEdit ? 0.7 : 1 }]}
                        >
                          {savingEdit ? <ActivityIndicator color={theme.onPrimary} /> : <Text style={{ color: theme.onPrimary, fontWeight: '700', fontSize: 16 }}>Enregistrer</Text>}
                        </Pressable>
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel="Annuler la modification"
                          disabled={savingEdit}
                          onPress={() => setEditing(false)}
                          style={[styles.headerBtn, { backgroundColor: theme.subtle, borderColor: theme.border }]}
                        >
                          <Text style={[styles.headerBtnText, { color: theme.ink }]}>Annuler</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  <View style={styles.membersSection}>
                    <Text accessibilityRole="header" style={[styles.membersTitle, { color: theme.ink }]}>
                      Membres du projet
                    </Text>
                    {!!memberError && (
                      <Text accessibilityRole="alert" style={[styles.fieldError, { color: theme.danger }]}>{memberError}</Text>
                    )}
                    {members.length === 0 ? (
                      <Text style={[styles.metaText, { color: theme.muted }]}>Aucun membre ajouté pour le moment.</Text>
                    ) : (
                      members.map((member) => (
                        <View
                          key={member.user_id}
                          style={[styles.memberRow, { backgroundColor: theme.surface, borderColor: theme.border }]}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.memberName, { color: theme.ink }]}>
                              {member.first_name} {member.last_name}
                            </Text>
                            <Text style={[styles.metaText, { color: theme.muted }]}>
                              {member.role === 'admin' ? 'Administrateur' : member.role === 'owner' ? 'Responsable' : 'Membre'}
                            </Text>
                          </View>
                          {selectedProject.status === 'active' && (role === 'admin' || selectedProject.owner_id === userId) && (
                            <TouchableOpacity
                              accessibilityRole="button"
                              accessibilityLabel={`Retirer ${member.first_name}`}
                              disabled={memberBusyId === member.user_id}
                              onPress={() => removeMember(selectedProject.id, member.user_id)}
                              style={[styles.removeBtn, { backgroundColor: theme.subtle, borderColor: theme.danger, opacity: memberBusyId === member.user_id ? 0.6 : 1 }]}
                            >
                              <Text style={{ color: theme.danger, fontWeight: '600', fontSize: 13 }}>Retirer</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ))
                    )}

                    {selectedProject.status === 'active' && (role === 'admin' || selectedProject.owner_id === userId) && (
                      <View style={styles.addMemberBox}>
                        <Text style={[styles.label, { color: theme.ink }]}>Ajouter un compte actif</Text>
                        <TextInput
                          accessibilityLabel="Rechercher un compte actif"
                          placeholder="Rechercher par prénom ou nom..."
                          placeholderTextColor={theme.muted}
                          value={memberSearch}
                          onChangeText={setMemberSearch}
                          style={[styles.input, { color: theme.ink, backgroundColor: theme.surface, borderColor: theme.border }]}
                        />
                        {(() => {
                          const q = memberSearch.trim().toLowerCase();
                          const memberIds = new Set(members.map((m) => m.user_id));
                          const available = candidates.filter((c) => {
                            if (memberIds.has(c.id)) return false;
                            if (!q) return true;
                            return `${c.first_name} ${c.last_name}`.toLowerCase().includes(q);
                          });
                          if (available.length === 0) {
                            return (
                              <Text style={[styles.metaText, { color: theme.muted, marginTop: 6 }]}>
                                Aucun compte actif trouvé.
                              </Text>
                            );
                          }
                          return available.slice(0, 6).map((cand) => (
                            <TouchableOpacity
                              key={cand.id}
                              accessibilityRole="button"
                              accessibilityLabel={`Ajouter ${cand.first_name} ${cand.last_name}`}
                              disabled={memberBusyId === cand.id}
                              onPress={() => addMember(selectedProject.id, cand)}
                              style={[styles.candidateRow, { backgroundColor: theme.surface, borderColor: theme.border }]}
                            >
                              <Text style={[styles.memberName, { color: theme.ink }]}>
                                {cand.first_name} {cand.last_name}
                              </Text>
                              <Text style={{ color: theme.primary, fontWeight: '600', fontSize: 14 }}>Ajouter</Text>
                            </TouchableOpacity>
                          ));
                        })()}
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  page: { flexGrow: 1, paddingTop: 20, paddingBottom: 48 },
  container: { width: '100%', maxWidth: 560, alignSelf: 'center', gap: 18 },
  containerTablet: { maxWidth: 1200 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 },
  headerText: { flex: 1, minWidth: 180 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  brand: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  headerBtn: { minHeight: 48, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerBtnText: { fontWeight: '600', fontSize: 15 },
  errorText: { fontSize: 16, lineHeight: 24 },
  emptyCard: { borderWidth: 1, borderRadius: 18, padding: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyHint: { fontSize: 15, lineHeight: 22, marginTop: 8 },
  splitLayout: { gap: 16 },
  splitLayoutTablet: { flexDirection: 'row', alignItems: 'flex-start' },
  listColumn: { gap: 12 },
  listColumnTablet: { width: '20%' },
  projectCard: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 6 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  projectName: { fontSize: 18, fontWeight: '700', flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 13, fontWeight: '700' },
  metaText: { fontSize: 14, lineHeight: 20 },
  detailColumn: { flex: 1, borderWidth: 1, borderRadius: 18, padding: 20, gap: 10 },
  detailColumnPhone: { flex: 0 },
  readOnlyNote: { fontSize: 14, fontStyle: 'italic', marginTop: 4 },
  editSection: { marginTop: 12, gap: 6 },
  detailTitle: { fontSize: 22, fontWeight: '700' },
  detailMeta: { fontSize: 14, lineHeight: 20 },
  detailBody: { fontSize: 16, lineHeight: 24, marginTop: 6 },
  successText: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  formCard: { borderWidth: 1, borderRadius: 18, padding: 18, gap: 6 },
  formTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  label: { fontSize: 15, fontWeight: '600', marginTop: 10, marginBottom: 4 },
  input: { minHeight: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateInput: { flex: 1 },
  calendarBtn: { minHeight: 48, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  calendarBtnText: { fontWeight: '600', fontSize: 15 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  fieldError: { fontSize: 14, lineHeight: 20, marginTop: 4 },
  formActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap' },
  primaryBtn: { minHeight: 48, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  membersSection: { marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0', gap: 10 },
  membersTitle: { fontSize: 18, fontWeight: '700' },
  memberRow: { borderWidth: 1, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  memberName: { fontSize: 15, fontWeight: '600' },
  removeBtn: { minHeight: 40, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  addMemberBox: { marginTop: 6, gap: 8 },
  candidateRow: { borderWidth: 1, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
