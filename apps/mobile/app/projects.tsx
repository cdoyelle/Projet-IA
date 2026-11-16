import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, type Href, useRouter } from 'expo-router';
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
};

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
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');

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
        .select('id, name, description, status, start_date, due_date')
        .order('created_at', { ascending: false });

      if (!mountedRef.current || signingOutRef.current || seq !== checkSeqRef.current) return;

      hasVerifiedRef.current = true;
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
                  const isSelected = isTablet && project.id === selectedId;
                  return (
                    <Pressable
                      key={project.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Projet ${project.name}`}
                      onPress={() => setSelectedId(project.id)}
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

              {isTablet && selectedProject && (
                <View style={[styles.detailColumn, { backgroundColor: theme.raised, borderColor: theme.border }]}>
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
  detailTitle: { fontSize: 22, fontWeight: '700' },
  detailMeta: { fontSize: 14, lineHeight: 20 },
  detailBody: { fontSize: 16, lineHeight: 24, marginTop: 6 },
});
