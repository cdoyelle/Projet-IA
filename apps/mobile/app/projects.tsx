import { type ComponentRef, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
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
  status: 'active' | 'closed' | 'cancelled';
  start_date: string;
  due_date: string | null;
  closed_at: string | null;
  owner_id: string;
};

function formatProjectStatus(status: ProjectRow['status']): string {
  if (status === 'active') return 'Actif';
  if (status === 'closed') return 'Clôturé';
  return 'Annulé';
}

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

type TaskRow = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: 'created' | 'in_progress' | 'done';
  priority: 'low' | 'normal' | 'high';
  due_date: string;
  tags: string[];
  assignee_id: string | null;
};

type TaskFormErrors = { title?: string; dueDate?: string };

function formatTaskStatus(status: TaskRow['status']): string {
  if (status === 'created') return 'Créée';
  if (status === 'in_progress') return 'En cours';
  return 'Terminée';
}

function formatTaskPriority(priority: TaskRow['priority']): string {
  if (priority === 'low') return 'Basse';
  if (priority === 'high') return 'Haute';
  return 'Normale';
}

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
  const [statusBusy, setStatusBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [assignables, setAssignables] = useState<ActiveCandidate[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskRow['priority']>('normal');
  const [taskTags, setTaskTags] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState<string | null>(null);
  const [taskPickerOpen, setTaskPickerOpen] = useState(false);
  const [taskErrors, setTaskErrors] = useState<TaskFormErrors>({});
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskMessage, setTaskMessage] = useState('');
  const [taskError, setTaskError] = useState('');
  const [taskStatusBusyId, setTaskStatusBusyId] = useState<string | null>(null);

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const [editTaskDueDate, setEditTaskDueDate] = useState('');
  const [editTaskPriority, setEditTaskPriority] = useState<TaskRow['priority']>('normal');
  const [editTaskTags, setEditTaskTags] = useState('');
  const [editTaskAssigneeId, setEditTaskAssigneeId] = useState<string | null>(null);
  const [editTaskPickerOpen, setEditTaskPickerOpen] = useState(false);
  const [editTaskErrors, setEditTaskErrors] = useState<TaskFormErrors>({});
  const [savingTaskEdit, setSavingTaskEdit] = useState(false);

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
        .select('id, name, description, status, start_date, due_date, closed_at, owner_id')
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
        .select('id, name, description, status, start_date, due_date, closed_at, owner_id')
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
        .select('id, name, description, status, start_date, due_date, closed_at, owner_id')
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

      const { data: taskRows } = await supabase
        .from('tasks')
        .select('id, project_id, title, description, status, priority, due_date, tags, assignee_id')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (!mountedRef.current || signingOutRef.current) return;
      setTasks((taskRows ?? []) as TaskRow[]);

      const { data: assignRows } = await supabase.rpc('list_project_assignable_profiles', {
        p_project_id: projectId,
      });
      if (!mountedRef.current || signingOutRef.current) return;
      setAssignables((assignRows ?? []) as ActiveCandidate[]);
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

  async function closeProject(project: ProjectRow) {
    if (statusBusy || signingOut) return;
    setStatusBusy(true);
    setEditError('');
    setEditMessage('');
    try {
      const { data: closedAt, error } = await supabase.rpc('close_project', { p_project_id: project.id });
      if (!mountedRef.current || signingOutRef.current) return;
      if (error) {
        setEditError('Impossible de clôturer ce projet.');
        return;
      }
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, status: 'closed', closed_at: String(closedAt) } : p))
      );
      setEditing(false);
      setEditMessage('Le projet a été clôturé.');
    } catch {
      if (!mountedRef.current || signingOutRef.current) return;
      setEditError('Impossible de clôturer ce projet.');
    } finally {
      if (mountedRef.current) setStatusBusy(false);
    }
  }

  async function reopenProject(project: ProjectRow) {
    if (statusBusy || signingOut) return;
    setStatusBusy(true);
    setEditError('');
    setEditMessage('');
    try {
      const { error } = await supabase.rpc('reopen_project', { p_project_id: project.id });
      if (!mountedRef.current || signingOutRef.current) return;
      if (error) {
        setEditError('Impossible de rouvrir ce projet.');
        return;
      }
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, status: 'active' } : p))
      );
      setEditMessage('Le projet a été rouvert.');
    } catch {
      if (!mountedRef.current || signingOutRef.current) return;
      setEditError('Impossible de rouvrir ce projet.');
    } finally {
      if (mountedRef.current) setStatusBusy(false);
    }
  }

  async function cancelProject(project: ProjectRow) {
    if (statusBusy || signingOut) return;
    setStatusBusy(true);
    setEditError('');
    setEditMessage('');
    try {
      const { data: closedAt, error } = await supabase.rpc('cancel_project', { p_project_id: project.id });
      if (!mountedRef.current || signingOutRef.current) return;
      if (error) {
        setEditError('Impossible d’annuler ce projet.');
        return;
      }
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, status: 'cancelled', closed_at: String(closedAt) } : p))
      );
      setConfirmCancel(false);
      setEditing(false);
      setEditMessage('Le projet a été annulé.');
    } catch {
      if (!mountedRef.current || signingOutRef.current) return;
      setEditError('Impossible d’annuler ce projet.');
    } finally {
      if (mountedRef.current) setStatusBusy(false);
    }
  }

  async function reactivateProject(project: ProjectRow) {
    if (statusBusy || signingOut) return;
    setStatusBusy(true);
    setEditError('');
    setEditMessage('');
    try {
      const { error } = await supabase.rpc('reactivate_project', { p_project_id: project.id });
      if (!mountedRef.current || signingOutRef.current) return;
      if (error) {
        setEditError('Impossible de réactiver ce projet.');
        return;
      }
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, status: 'active', closed_at: null } : p))
      );
      setEditMessage('Le projet a été réactivé.');
    } catch {
      if (!mountedRef.current || signingOutRef.current) return;
      setEditError('Impossible de réactiver ce projet.');
    } finally {
      if (mountedRef.current) setStatusBusy(false);
    }
  }

  async function createTask(project: ProjectRow) {
    if (creatingTask || signingOut || !userId) return;
    const errors: TaskFormErrors = {};
    const trimmedTitle = taskTitle.trim();
    const trimmedDue = taskDueDate.trim();
    const dueIso = parseFrDateToIso(trimmedDue);

    if (!trimmedTitle) {
      errors.title = 'Saisissez le titre de la tâche.';
    } else if (trimmedTitle.length > 150) {
      errors.title = 'Le titre ne doit pas dépasser 150 caractères.';
    }
    if (!dueIso) {
      errors.dueDate = 'Saisissez une date d’échéance valide (JJ/MM/AAAA).';
    } else if (dueIso < parseFrDateToIso(todayFrDate())!) {
      errors.dueDate = 'La date d’échéance ne peut pas être dans le passé.';
    }

    setTaskErrors(errors);
    setTaskError('');
    if (Object.keys(errors).length > 0) return;

    const parsedTags = taskTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    setCreatingTask(true);
    try {
      const { data: created, error } = await supabase
        .from('tasks')
        .insert({
          project_id: project.id,
          title: trimmedTitle,
          description: taskDescription.trim() || null,
          status: 'created',
          priority: taskPriority,
          due_date: dueIso!,
          tags: parsedTags,
          assignee_id: taskAssigneeId,
          created_by: userId,
        })
        .select('id, project_id, title, description, status, priority, due_date, tags, assignee_id')
        .single();

      if (!mountedRef.current || signingOutRef.current) return;
      if (error || !created) {
        setTaskError('Impossible de créer la tâche. Vérifiez vos droits ou votre connexion.');
        return;
      }

      setTasks((prev) => [created as TaskRow, ...prev]);
      setTaskTitle('');
      setTaskDescription('');
      setTaskDueDate('');
      setTaskPriority('normal');
      setTaskTags('');
      setTaskAssigneeId(null);
      setTaskErrors({});
      setShowTaskForm(false);
      setTaskMessage('La tâche a été créée avec le statut Créée.');
    } catch {
      if (!mountedRef.current || signingOutRef.current) return;
      setTaskError('Impossible de créer la tâche. Vérifiez votre connexion, puis réessayez.');
    } finally {
      if (mountedRef.current) setCreatingTask(false);
    }
  }

  function startEditingTask(task: TaskRow) {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title);
    setEditTaskDescription(task.description ?? '');
    setEditTaskDueDate(dateToFrString(new Date(`${task.due_date}T00:00:00`)));
    setEditTaskPriority(task.priority);
    setEditTaskTags(task.tags.join(', '));
    setEditTaskAssigneeId(task.assignee_id);
    setEditTaskPickerOpen(false);
    setEditTaskErrors({});
    setTaskError('');
    setTaskMessage('');
  }

  async function saveTaskEdit(task: TaskRow) {
    if (savingTaskEdit || signingOut) return;
    const errors: TaskFormErrors = {};
    const trimmedTitle = editTaskTitle.trim();
    const dueIso = parseFrDateToIso(editTaskDueDate.trim());
    if (!trimmedTitle) {
      errors.title = 'Saisissez le titre de la tâche.';
    } else if (trimmedTitle.length > 150) {
      errors.title = 'Le titre ne doit pas dépasser 150 caractères.';
    }
    if (!dueIso) {
      errors.dueDate = 'Saisissez une date d’échéance valide (JJ/MM/AAAA).';
    }
    setEditTaskErrors(errors);
    setTaskError('');
    if (Object.keys(errors).length > 0) return;

    const parsedTags = editTaskTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    setSavingTaskEdit(true);
    try {
      const { data: updated, error } = await supabase
        .from('tasks')
        .update({
          title: trimmedTitle,
          description: editTaskDescription.trim() || null,
          priority: editTaskPriority,
          due_date: dueIso!,
          tags: parsedTags,
          assignee_id: editTaskAssigneeId,
        })
        .eq('id', task.id)
        .select('id, project_id, title, description, status, priority, due_date, tags, assignee_id')
        .single();

      if (!mountedRef.current || signingOutRef.current) return;
      if (error || !updated) {
        setTaskError('Impossible de modifier cette tâche.');
        return;
      }
      setTasks((prev) => prev.map((t) => (t.id === task.id ? (updated as TaskRow) : t)));
      setEditingTaskId(null);
      setTaskMessage('Les modifications de la tâche ont été enregistrées.');
    } catch {
      if (!mountedRef.current || signingOutRef.current) return;
      setTaskError('Impossible de modifier cette tâche.');
    } finally {
      if (mountedRef.current) setSavingTaskEdit(false);
    }
  }

  async function reopenDoneTask(task: TaskRow) {
    if (taskStatusBusyId || signingOut) return;
    setTaskStatusBusyId(task.id);
    setTaskError('');
    setTaskMessage('');
    try {
      const { data: confirmedStatus, error } = await supabase.rpc('reopen_done_task', {
        p_task_id: task.id,
      });
      if (!mountedRef.current || signingOutRef.current) return;
      if (error || !confirmedStatus) {
        setTaskError('Impossible de remettre cette tâche en cours.');
        return;
      }
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: 'in_progress' } : t))
      );
      setTaskMessage('La tâche est repassée En cours et peut maintenant être modifiée.');
    } catch {
      if (!mountedRef.current || signingOutRef.current) return;
      setTaskError('Impossible de remettre cette tâche en cours.');
    } finally {
      if (mountedRef.current) setTaskStatusBusyId(null);
    }
  }

  async function changeMyTaskStatus(task: TaskRow, nextStatus: 'created' | 'in_progress' | 'done') {
    if (taskStatusBusyId || signingOut) return;
    setTaskStatusBusyId(task.id);
    setTaskError('');
    setTaskMessage('');
    try {
      const { data: confirmedStatus, error } = await supabase.rpc('update_my_task_status', {
        p_task_id: task.id,
        p_status: nextStatus,
      });
      if (!mountedRef.current || signingOutRef.current) return;
      if (error || !confirmedStatus) {
        setTaskError('Impossible de mettre à jour le statut de la tâche.');
        return;
      }
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: confirmedStatus as TaskRow['status'] } : t))
      );
      setTaskMessage(`Statut mis à jour : ${formatTaskStatus(confirmedStatus as TaskRow['status'])}.`);
    } catch {
      if (!mountedRef.current || signingOutRef.current) return;
      setTaskError('Impossible de mettre à jour le statut de la tâche.');
    } finally {
      if (mountedRef.current) setTaskStatusBusyId(null);
    }
  }

  async function refreshAll() {
    if (refreshing || signingOut) return;
    setRefreshing(true);
    try {
      await verifyAndLoad();
      if (selectedId) {
        const proj = projects.find((p) => p.id === selectedId);
        const canManage = !!proj && proj.status === 'active' && (role === 'admin' || proj.owner_id === userId);
        await loadMembersForProject(selectedId, canManage);
      }
    } finally {
      if (mountedRef.current) setRefreshing(false);
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
      <ScrollView
        contentContainerStyle={[styles.page, { paddingHorizontal: horizontalGutter }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshAll} tintColor={theme.primary} />
        }
      >
        <View style={[styles.container, isTablet && styles.containerTablet]}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={[styles.brand, { color: theme.primary }]}>TaskFlow</Text>
              <Text accessibilityRole="header" style={[styles.title, { color: theme.ink }]}>Projets</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Actualiser"
                disabled={refreshing || signingOut}
                onPress={refreshAll}
                style={[styles.headerBtn, { backgroundColor: theme.subtle, borderColor: theme.border, opacity: refreshing ? 0.6 : 1 }]}
              >
                <Text style={[styles.headerBtnText, { color: theme.ink }]}>
                  {refreshing ? 'Actualisation...' : 'Actualiser'}
                </Text>
              </TouchableOpacity>
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
                        setConfirmCancel(false);
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
                            {formatProjectStatus(project.status)}
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
                    Statut : {formatProjectStatus(selectedProject.status)} · Progression : 0 % · 0 tâche
                  </Text>
                  <Text style={[styles.detailMeta, { color: theme.muted }]}>
                    Début : {formatDateFr(selectedProject.start_date)}
                    {selectedProject.due_date ? ` · Échéance : ${formatDateFr(selectedProject.due_date)}` : ''}
                  </Text>
                  {!!selectedProject.closed_at && (
                    <Text style={[styles.detailMeta, { color: theme.muted }]}>
                      {selectedProject.status === 'active' ? 'Dernière clôture : ' : 'Clôturé le : '}
                      {formatDateFr(selectedProject.closed_at.slice(0, 10))}
                    </Text>
                  )}
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
                    <View style={styles.formActions}>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Modifier le projet"
                        disabled={statusBusy}
                        onPress={() => startEditing(selectedProject)}
                        style={[styles.calendarBtn, { backgroundColor: theme.subtle, borderColor: theme.border }]}
                      >
                        <Text style={[styles.calendarBtnText, { color: theme.ink }]}>Modifier le projet</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Clôturer le projet"
                        disabled={statusBusy}
                        onPress={() => closeProject(selectedProject)}
                        style={[styles.calendarBtn, { backgroundColor: theme.subtle, borderColor: theme.danger, opacity: statusBusy ? 0.6 : 1 }]}
                      >
                        <Text style={[styles.calendarBtnText, { color: theme.danger }]}>Clôturer le projet</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Annuler le projet"
                        disabled={statusBusy}
                        onPress={() => setConfirmCancel(true)}
                        style={[styles.calendarBtn, { backgroundColor: theme.subtle, borderColor: theme.danger, opacity: statusBusy ? 0.6 : 1 }]}
                      >
                        <Text style={[styles.calendarBtnText, { color: theme.danger }]}>Annuler le projet</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {confirmCancel && selectedProject.status === 'active' && (
                    <View style={[styles.confirmBox, { backgroundColor: theme.surface, borderColor: theme.danger }]}>
                      <Text style={[styles.confirmText, { color: theme.ink }]}>
                        Annuler ce projet le masquera aux membres ordinaires tout en conservant son historique.
                      </Text>
                      <View style={styles.formActions}>
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel="Confirmer l’annulation"
                          disabled={statusBusy}
                          onPress={() => cancelProject(selectedProject)}
                          style={[styles.calendarBtn, { backgroundColor: theme.danger, borderColor: theme.danger }]}
                        >
                          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Confirmer l’annulation</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel="Retour"
                          disabled={statusBusy}
                          onPress={() => setConfirmCancel(false)}
                          style={[styles.calendarBtn, { backgroundColor: theme.subtle, borderColor: theme.border }]}
                        >
                          <Text style={[styles.calendarBtnText, { color: theme.ink }]}>Retour</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {selectedProject.status === 'cancelled' && (role === 'admin' || selectedProject.owner_id === userId) && (
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel="Réactiver le projet"
                      disabled={statusBusy}
                      onPress={() => reactivateProject(selectedProject)}
                      style={[styles.calendarBtn, { backgroundColor: theme.subtle, borderColor: theme.primary, alignSelf: 'flex-start', marginTop: 8, opacity: statusBusy ? 0.6 : 1 }]}
                    >
                      <Text style={[styles.calendarBtnText, { color: theme.primary }]}>Réactiver le projet</Text>
                    </TouchableOpacity>
                  )}

                  {selectedProject.status === 'closed' && (role === 'admin' || selectedProject.owner_id === userId) && (
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel="Rouvrir le projet"
                      disabled={statusBusy}
                      onPress={() => reopenProject(selectedProject)}
                      style={[styles.calendarBtn, { backgroundColor: theme.subtle, borderColor: theme.primary, alignSelf: 'flex-start', marginTop: 8, opacity: statusBusy ? 0.6 : 1 }]}
                    >
                      <Text style={[styles.calendarBtnText, { color: theme.primary }]}>Rouvrir le projet</Text>
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

                  <View style={styles.membersSection}>
                    <View style={styles.cardTop}>
                      <Text accessibilityRole="header" style={[styles.membersTitle, { color: theme.ink }]}>
                        Tâches
                      </Text>
                      {selectedProject.status === 'active' && (role === 'admin' || selectedProject.owner_id === userId) && !showTaskForm && (
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel="Nouvelle tâche"
                          onPress={() => {
                            setTaskErrors({});
                            setTaskError('');
                            setTaskMessage('');
                            setShowTaskForm(true);
                          }}
                          style={[styles.calendarBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}
                        >
                          <Text style={{ color: theme.onPrimary, fontWeight: '700', fontSize: 14 }}>Nouvelle tâche</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {!!taskMessage && (
                      <Text accessibilityRole="alert" style={[styles.successText, { color: theme.success }]}>{taskMessage}</Text>
                    )}

                    {showTaskForm && (
                      <View style={[styles.confirmBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Text style={[styles.label, { color: theme.ink }]}>Titre</Text>
                        <TextInput
                          accessibilityLabel="Titre de la tâche"
                          editable={!creatingTask}
                          value={taskTitle}
                          onChangeText={(val) => {
                            setTaskTitle(val);
                            if (taskErrors.title) setTaskErrors((prev) => ({ ...prev, title: undefined }));
                          }}
                          style={[styles.input, { color: theme.ink, backgroundColor: theme.raised, borderColor: taskErrors.title ? theme.danger : theme.border }]}
                        />
                        {!!taskErrors.title && <Text accessibilityRole="alert" style={[styles.fieldError, { color: theme.danger }]}>{taskErrors.title}</Text>}

                        <Text style={[styles.label, { color: theme.ink }]}>Échéance (JJ/MM/AAAA)</Text>
                        <View style={styles.dateRow}>
                          <TextInput
                            accessibilityLabel="Échéance de la tâche"
                            editable={!creatingTask}
                            keyboardType="number-pad"
                            maxLength={10}
                            placeholder="JJ/MM/AAAA"
                            placeholderTextColor={theme.muted}
                            value={taskDueDate}
                            onChangeText={(val) => {
                              setTaskDueDate(formatDateInput(val));
                              if (taskErrors.dueDate) setTaskErrors((prev) => ({ ...prev, dueDate: undefined }));
                            }}
                            style={[styles.input, styles.dateInput, { color: theme.ink, backgroundColor: theme.raised, borderColor: taskErrors.dueDate ? theme.danger : theme.border }]}
                          />
                          <TouchableOpacity
                            accessibilityRole="button"
                            onPress={() => setTaskPickerOpen((prev) => !prev)}
                            style={[styles.calendarBtn, { backgroundColor: theme.subtle, borderColor: theme.border }]}
                          >
                            <Text style={[styles.calendarBtnText, { color: theme.ink }]}>Calendrier</Text>
                          </TouchableOpacity>
                        </View>
                        {taskPickerOpen && (
                          <DateTimePicker
                            value={frStringToDate(taskDueDate)}
                            mode="date"
                            minimumDate={new Date()}
                            display={Platform.OS === 'ios' ? 'inline' : 'default'}
                            onChange={(_event, selected) => {
                              if (Platform.OS !== 'ios') setTaskPickerOpen(false);
                              if (selected) {
                                setTaskDueDate(dateToFrString(selected));
                                if (taskErrors.dueDate) setTaskErrors((prev) => ({ ...prev, dueDate: undefined }));
                              }
                            }}
                          />
                        )}
                        {!!taskErrors.dueDate && <Text accessibilityRole="alert" style={[styles.fieldError, { color: theme.danger }]}>{taskErrors.dueDate}</Text>}

                        <Text style={[styles.label, { color: theme.ink }]}>Description (facultatif)</Text>
                        <TextInput
                          accessibilityLabel="Description de la tâche"
                          editable={!creatingTask}
                          multiline
                          value={taskDescription}
                          onChangeText={setTaskDescription}
                          style={[styles.input, styles.textArea, { color: theme.ink, backgroundColor: theme.raised, borderColor: theme.border }]}
                        />

                        <Text style={[styles.label, { color: theme.ink }]}>Priorité</Text>
                        <View style={styles.formActions}>
                          {(['low', 'normal', 'high'] as const).map((prio) => (
                            <TouchableOpacity
                              key={prio}
                              accessibilityRole="button"
                              onPress={() => setTaskPriority(prio)}
                              style={[
                                styles.calendarBtn,
                                {
                                  backgroundColor: taskPriority === prio ? theme.primary : theme.subtle,
                                  borderColor: taskPriority === prio ? theme.primary : theme.border,
                                },
                              ]}
                            >
                              <Text style={{ color: taskPriority === prio ? theme.onPrimary : theme.ink, fontWeight: '600', fontSize: 14 }}>
                                {formatTaskPriority(prio)}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        <Text style={[styles.label, { color: theme.ink }]}>Tags (facultatif, séparés par des virgules)</Text>
                        <TextInput
                          accessibilityLabel="Tags"
                          editable={!creatingTask}
                          placeholder="urgent, client"
                          placeholderTextColor={theme.muted}
                          value={taskTags}
                          onChangeText={setTaskTags}
                          style={[styles.input, { color: theme.ink, backgroundColor: theme.raised, borderColor: theme.border }]}
                        />

                        <Text style={[styles.label, { color: theme.ink }]}>Responsable (facultatif)</Text>
                        <View style={styles.formActions}>
                          <TouchableOpacity
                            accessibilityRole="button"
                            onPress={() => setTaskAssigneeId(null)}
                            style={[
                              styles.calendarBtn,
                              {
                                backgroundColor: taskAssigneeId === null ? theme.primary : theme.subtle,
                                borderColor: taskAssigneeId === null ? theme.primary : theme.border,
                              },
                            ]}
                          >
                            <Text style={{ color: taskAssigneeId === null ? theme.onPrimary : theme.ink, fontWeight: '600', fontSize: 14 }}>
                              Aucun
                            </Text>
                          </TouchableOpacity>
                          {assignables.map((person) => (
                            <TouchableOpacity
                              key={person.id}
                              accessibilityRole="button"
                              onPress={() => setTaskAssigneeId(person.id)}
                              style={[
                                styles.calendarBtn,
                                {
                                  backgroundColor: taskAssigneeId === person.id ? theme.primary : theme.subtle,
                                  borderColor: taskAssigneeId === person.id ? theme.primary : theme.border,
                                },
                              ]}
                            >
                              <Text style={{ color: taskAssigneeId === person.id ? theme.onPrimary : theme.ink, fontWeight: '600', fontSize: 14 }}>
                                {person.first_name} {person.last_name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        {!!taskError && <Text accessibilityRole="alert" style={[styles.fieldError, { color: theme.danger }]}>{taskError}</Text>}

                        <View style={styles.formActions}>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Enregistrer la tâche"
                            disabled={creatingTask}
                            onPress={() => createTask(selectedProject)}
                            style={[styles.primaryBtn, { backgroundColor: theme.primary, opacity: creatingTask ? 0.7 : 1 }]}
                          >
                            {creatingTask ? <ActivityIndicator color={theme.onPrimary} /> : <Text style={{ color: theme.onPrimary, fontWeight: '700', fontSize: 15 }}>Créer la tâche</Text>}
                          </Pressable>
                          <TouchableOpacity
                            accessibilityRole="button"
                            disabled={creatingTask}
                            onPress={() => {
                              setShowTaskForm(false);
                              setTaskTitle('');
                              setTaskDescription('');
                              setTaskDueDate('');
                              setTaskPriority('normal');
                              setTaskTags('');
                              setTaskAssigneeId(null);
                              setTaskErrors({});
                              setTaskError('');
                              setTaskPickerOpen(false);
                            }}
                            style={[styles.headerBtn, { backgroundColor: theme.subtle, borderColor: theme.border }]}
                          >
                            <Text style={[styles.headerBtnText, { color: theme.ink }]}>Annuler</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {tasks.length === 0 ? (
                      <Text style={[styles.metaText, { color: theme.muted }]}>Aucune tâche pour le moment.</Text>
                    ) : (
                      tasks.map((task) => {
                        const assignee = assignables.find((a) => a.id === task.assignee_id);
                        return (
                          <View
                            key={task.id}
                            style={[styles.memberRow, { backgroundColor: theme.surface, borderColor: theme.border, flexDirection: 'column', alignItems: 'flex-start', gap: 4 }]}
                          >
                            <Text style={[styles.memberName, { color: theme.ink }]}>{task.title}</Text>
                            <Text style={[styles.metaText, { color: theme.muted }]}>
                              Statut : {formatTaskStatus(task.status)} · Priorité : {formatTaskPriority(task.priority)} · Échéance : {formatDateFr(task.due_date)}
                            </Text>
                            <Text style={[styles.metaText, { color: theme.muted }]}>
                              Responsable : {assignee ? `${assignee.first_name} ${assignee.last_name}` : 'Non attribuée'}
                            </Text>
                            {task.tags.length > 0 && (
                              <Text style={[styles.metaText, { color: theme.muted }]}>
                                Tags : {task.tags.join(', ')}
                              </Text>
                            )}
                            {selectedProject.status === 'active' && task.assignee_id === userId && (
                              <View style={[styles.formActions, { marginTop: 6 }]}>
                                {task.status === 'created' && (
                                  <>
                                    <TouchableOpacity
                                      accessibilityRole="button"
                                      disabled={taskStatusBusyId === task.id}
                                      onPress={() => changeMyTaskStatus(task, 'in_progress')}
                                      style={[styles.calendarBtn, { backgroundColor: theme.subtle, borderColor: theme.primary }]}
                                    >
                                      <Text style={{ color: theme.primary, fontWeight: '600', fontSize: 13 }}>Passer en cours</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      accessibilityRole="button"
                                      disabled={taskStatusBusyId === task.id}
                                      onPress={() => changeMyTaskStatus(task, 'done')}
                                      style={[styles.calendarBtn, { backgroundColor: theme.subtle, borderColor: theme.success }]}
                                    >
                                      <Text style={{ color: theme.success, fontWeight: '600', fontSize: 13 }}>Terminer</Text>
                                    </TouchableOpacity>
                                  </>
                                )}
                                {task.status === 'in_progress' && (
                                  <>
                                    <TouchableOpacity
                                      accessibilityRole="button"
                                      disabled={taskStatusBusyId === task.id}
                                      onPress={() => changeMyTaskStatus(task, 'created')}
                                      style={[styles.calendarBtn, { backgroundColor: theme.subtle, borderColor: theme.border }]}
                                    >
                                      <Text style={{ color: theme.ink, fontWeight: '600', fontSize: 13 }}>Remettre en créée</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      accessibilityRole="button"
                                      disabled={taskStatusBusyId === task.id}
                                      onPress={() => changeMyTaskStatus(task, 'done')}
                                      style={[styles.calendarBtn, { backgroundColor: theme.subtle, borderColor: theme.success }]}
                                    >
                                      <Text style={{ color: theme.success, fontWeight: '600', fontSize: 13 }}>Terminer</Text>
                                    </TouchableOpacity>
                                  </>
                                )}
                                {task.status === 'done' && task.assignee_id === userId && (
                                  <TouchableOpacity
                                    accessibilityRole="button"
                                    disabled={taskStatusBusyId === task.id}
                                    onPress={() => changeMyTaskStatus(task, 'in_progress')}
                                    style={[styles.calendarBtn, { backgroundColor: theme.subtle, borderColor: theme.primary }]}
                                  >
                                    <Text style={{ color: theme.primary, fontWeight: '600', fontSize: 13 }}>Remettre en cours</Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            )}
                            {selectedProject.status === 'active' && (role === 'admin' || selectedProject.owner_id === userId) && editingTaskId !== task.id && (
                              <View style={[styles.formActions, { marginTop: 6 }]}>
                                {task.status !== 'done' ? (
                                  <TouchableOpacity
                                    accessibilityRole="button"
                                    onPress={() => startEditingTask(task)}
                                    style={[styles.calendarBtn, { backgroundColor: theme.subtle, borderColor: theme.border }]}
                                  >
                                    <Text style={{ color: theme.ink, fontWeight: '600', fontSize: 13 }}>Modifier</Text>
                                  </TouchableOpacity>
                                ) : (
                                  <>
                                    <Text style={[styles.metaText, { color: theme.muted }]}>
                                      Champs verrouillés (tâche terminée)
                                    </Text>
                                    {task.assignee_id !== userId && (
                                      <TouchableOpacity
                                        accessibilityRole="button"
                                        disabled={taskStatusBusyId === task.id}
                                        onPress={() => reopenDoneTask(task)}
                                        style={[styles.calendarBtn, { backgroundColor: theme.subtle, borderColor: theme.primary }]}
                                      >
                                        <Text style={{ color: theme.primary, fontWeight: '600', fontSize: 13 }}>Remettre en cours</Text>
                                      </TouchableOpacity>
                                    )}
                                  </>
                                )}
                              </View>
                            )}
                            {editingTaskId === task.id && (
                              <View style={[styles.confirmBox, { width: '100%', backgroundColor: theme.raised, borderColor: theme.border }]}>
                                <Text style={[styles.label, { color: theme.ink }]}>Titre</Text>
                                <TextInput
                                  editable={!savingTaskEdit}
                                  value={editTaskTitle}
                                  onChangeText={(val) => {
                                    setEditTaskTitle(val);
                                    if (editTaskErrors.title) setEditTaskErrors((prev) => ({ ...prev, title: undefined }));
                                  }}
                                  style={[styles.input, { color: theme.ink, backgroundColor: theme.surface, borderColor: editTaskErrors.title ? theme.danger : theme.border }]}
                                />
                                {!!editTaskErrors.title && <Text style={[styles.fieldError, { color: theme.danger }]}>{editTaskErrors.title}</Text>}

                                <Text style={[styles.label, { color: theme.ink }]}>Échéance (JJ/MM/AAAA)</Text>
                                <View style={styles.dateRow}>
                                  <TextInput
                                    editable={!savingTaskEdit}
                                    keyboardType="number-pad"
                                    maxLength={10}
                                    value={editTaskDueDate}
                                    onChangeText={(val) => {
                                      setEditTaskDueDate(formatDateInput(val));
                                      if (editTaskErrors.dueDate) setEditTaskErrors((prev) => ({ ...prev, dueDate: undefined }));
                                    }}
                                    style={[styles.input, styles.dateInput, { color: theme.ink, backgroundColor: theme.surface, borderColor: editTaskErrors.dueDate ? theme.danger : theme.border }]}
                                  />
                                  <TouchableOpacity
                                    accessibilityRole="button"
                                    onPress={() => setEditTaskPickerOpen((prev) => !prev)}
                                    style={[styles.calendarBtn, { backgroundColor: theme.subtle, borderColor: theme.border }]}
                                  >
                                    <Text style={[styles.calendarBtnText, { color: theme.ink }]}>Calendrier</Text>
                                  </TouchableOpacity>
                                </View>
                                {editTaskPickerOpen && (
                                  <DateTimePicker
                                    value={frStringToDate(editTaskDueDate)}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                                    onChange={(_event, selected) => {
                                      if (Platform.OS !== 'ios') setEditTaskPickerOpen(false);
                                      if (selected) {
                                        setEditTaskDueDate(dateToFrString(selected));
                                        if (editTaskErrors.dueDate) setEditTaskErrors((prev) => ({ ...prev, dueDate: undefined }));
                                      }
                                    }}
                                  />
                                )}
                                {!!editTaskErrors.dueDate && <Text style={[styles.fieldError, { color: theme.danger }]}>{editTaskErrors.dueDate}</Text>}

                                <Text style={[styles.label, { color: theme.ink }]}>Description (facultatif)</Text>
                                <TextInput
                                  editable={!savingTaskEdit}
                                  multiline
                                  value={editTaskDescription}
                                  onChangeText={setEditTaskDescription}
                                  style={[styles.input, styles.textArea, { color: theme.ink, backgroundColor: theme.surface, borderColor: theme.border }]}
                                />

                                <Text style={[styles.label, { color: theme.ink }]}>Priorité</Text>
                                <View style={styles.formActions}>
                                  {(['low', 'normal', 'high'] as const).map((prio) => (
                                    <TouchableOpacity
                                      key={prio}
                                      accessibilityRole="button"
                                      onPress={() => setEditTaskPriority(prio)}
                                      style={[
                                        styles.calendarBtn,
                                        {
                                          backgroundColor: editTaskPriority === prio ? theme.primary : theme.subtle,
                                          borderColor: editTaskPriority === prio ? theme.primary : theme.border,
                                        },
                                      ]}
                                    >
                                      <Text style={{ color: editTaskPriority === prio ? theme.onPrimary : theme.ink, fontWeight: '600', fontSize: 13 }}>
                                        {formatTaskPriority(prio)}
                                      </Text>
                                    </TouchableOpacity>
                                  ))}
                                </View>

                                <Text style={[styles.label, { color: theme.ink }]}>Tags (facultatif, séparés par des virgules)</Text>
                                <TextInput
                                  editable={!savingTaskEdit}
                                  value={editTaskTags}
                                  onChangeText={setEditTaskTags}
                                  style={[styles.input, { color: theme.ink, backgroundColor: theme.surface, borderColor: theme.border }]}
                                />

                                <Text style={[styles.label, { color: theme.ink }]}>Responsable</Text>
                                <View style={styles.formActions}>
                                  <TouchableOpacity
                                    accessibilityRole="button"
                                    onPress={() => setEditTaskAssigneeId(null)}
                                    style={[
                                      styles.calendarBtn,
                                      {
                                        backgroundColor: editTaskAssigneeId === null ? theme.primary : theme.subtle,
                                        borderColor: editTaskAssigneeId === null ? theme.primary : theme.border,
                                      },
                                    ]}
                                  >
                                    <Text style={{ color: editTaskAssigneeId === null ? theme.onPrimary : theme.ink, fontWeight: '600', fontSize: 13 }}>
                                      Aucun
                                    </Text>
                                  </TouchableOpacity>
                                  {assignables.map((person) => (
                                    <TouchableOpacity
                                      key={person.id}
                                      accessibilityRole="button"
                                      onPress={() => setEditTaskAssigneeId(person.id)}
                                      style={[
                                        styles.calendarBtn,
                                        {
                                          backgroundColor: editTaskAssigneeId === person.id ? theme.primary : theme.subtle,
                                          borderColor: editTaskAssigneeId === person.id ? theme.primary : theme.border,
                                        },
                                      ]}
                                    >
                                      <Text style={{ color: editTaskAssigneeId === person.id ? theme.onPrimary : theme.ink, fontWeight: '600', fontSize: 13 }}>
                                        {person.first_name} {person.last_name}
                                      </Text>
                                    </TouchableOpacity>
                                  ))}
                                </View>

                                <View style={styles.formActions}>
                                  <Pressable
                                    accessibilityRole="button"
                                    disabled={savingTaskEdit}
                                    onPress={() => saveTaskEdit(task)}
                                    style={[styles.primaryBtn, { backgroundColor: theme.primary, opacity: savingTaskEdit ? 0.7 : 1 }]}
                                  >
                                    {savingTaskEdit ? <ActivityIndicator color={theme.onPrimary} /> : <Text style={{ color: theme.onPrimary, fontWeight: '700', fontSize: 14 }}>Enregistrer</Text>}
                                  </Pressable>
                                  <TouchableOpacity
                                    accessibilityRole="button"
                                    disabled={savingTaskEdit}
                                    onPress={() => setEditingTaskId(null)}
                                    style={[styles.headerBtn, { backgroundColor: theme.subtle, borderColor: theme.border }]}
                                  >
                                    <Text style={[styles.headerBtnText, { color: theme.ink }]}>Annuler</Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            )}
                          </View>
                        );
                      })
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
  confirmBox: { borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 8, gap: 8 },
  confirmText: { fontSize: 14, lineHeight: 20 },
});
