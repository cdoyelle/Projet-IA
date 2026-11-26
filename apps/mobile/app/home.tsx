import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, type Href, useRouter } from 'expo-router';
import { supabase } from '@/src/lib/supabase';
import { useTheme } from '@/src/lib/theme';

type UserRole = 'admin' | 'owner' | 'member';

type ActiveProfile = {
  firstName: string;
  lastName: string;
  role: UserRole;
  email: string;
};

function formatRoleLabel(role: UserRole): string {
  if (role === 'admin') return 'Administrateur';
  if (role === 'owner') return 'Responsable';
  return 'Membre';
}

function isAuthRejection(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const code = error.code ?? '';
  const msg = error.message?.toLowerCase() ?? '';
  return code === 'PGRST301' || code === '42501' || msg.includes('jwt') || msg.includes('unauthorized');
}

export default function Home() {
  const theme = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const horizontalGutter = width >= 768 ? 28 : 16;

  const mountedRef = useRef(true);
  const signingOutRef = useRef(false);
  const hasVerifiedRef = useRef(false);
  const checkSeqRef = useRef(0);

  const [checking, setChecking] = useState(true);
  const [profile, setProfile] = useState<ActiveProfile | null>(null);
  const [redirectHref, setRedirectHref] = useState<Href>('/sign-in?reason=expired');
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    mountedRef.current = true;

    async function verifyAccess() {
      const seq = ++checkSeqRef.current;
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !data.session) {
          if (sessionError) {
            try { await supabase.auth.signOut(); } catch { /* ignore */ }
          }
          if (mountedRef.current && !signingOutRef.current && seq === checkSeqRef.current) {
            const target: Href = '/sign-in?reason=expired';
            hasVerifiedRef.current = false;
            setRedirectHref(target);
            setProfile(null);
            setChecking(false);
            router.replace(target);
          }
          return;
        }

        const { data: row, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name, role, active')
          .eq('id', data.session.user.id)
          .maybeSingle();

        if (profileError) {
          if (hasVerifiedRef.current && !isAuthRejection(profileError)) {
            return;
          }
          try { await supabase.auth.signOut(); } catch { /* ignore */ }
          if (mountedRef.current && !signingOutRef.current && seq === checkSeqRef.current) {
            hasVerifiedRef.current = false;
            setRedirectHref('/sign-in?reason=expired');
            setProfile(null);
            setChecking(false);
            router.replace('/sign-in?reason=expired');
          }
          return;
        }

        if (!row?.active) {
          try { await supabase.auth.signOut(); } catch { /* ignore */ }
          if (mountedRef.current && !signingOutRef.current && seq === checkSeqRef.current) {
            hasVerifiedRef.current = false;
            setRedirectHref('/sign-in?reason=expired');
            setProfile(null);
            setChecking(false);
            router.replace('/sign-in?reason=expired');
          }
          return;
        }

        if (mountedRef.current && !signingOutRef.current && seq === checkSeqRef.current) {
          const validRole: UserRole = row.role === 'admin' || row.role === 'owner' ? row.role : 'member';
          hasVerifiedRef.current = true;
          setProfile({
            firstName: row.first_name,
            lastName: row.last_name,
            role: validRole,
            email: data.session.user.email ?? '',
          });
          setChecking(false);
        }
      } catch {
        if (hasVerifiedRef.current) {
          return;
        }
        try { await supabase.auth.signOut(); } catch { /* ignore */ }
        if (mountedRef.current && !signingOutRef.current && seq === checkSeqRef.current) {
          hasVerifiedRef.current = false;
          setRedirectHref('/sign-in?reason=expired');
          setProfile(null);
          setChecking(false);
          router.replace('/sign-in?reason=expired');
        }
      }
    }

    verifyAccess();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mountedRef.current) return;
      if (!session || event === 'SIGNED_OUT') {
        const target: Href = signingOutRef.current ? '/sign-in' : '/sign-in?reason=expired';
        hasVerifiedRef.current = false;
        setRedirectHref(target);
        setProfile(null);
        setChecking(false);
        router.replace(target);
        return;
      }
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        verifyAccess();
      }
    });

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && mountedRef.current && !signingOutRef.current) {
        verifyAccess();
      }
    });

    return () => {
      mountedRef.current = false;
      authListener.subscription.unsubscribe();
      appStateSubscription.remove();
    };
  }, [router]);

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
      // Ignore keystore/network errors on sign-out and redirect to sign-in.
    } finally {
      if (mountedRef.current) {
        setProfile(null);
        setSigningOut(false);
        router.replace('/sign-in');
      }
    }
  }

  if (checking) {
    return (
      <View style={[styles.center, { backgroundColor: theme.surface }]}>
        <ActivityIndicator accessibilityLabel="Chargement de l’accueil" color={theme.primary} />
      </View>
    );
  }

  if (!profile) {
    return <Redirect href={redirectHref} />;
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.surface }]}>
      <ScrollView contentContainerStyle={[styles.page, { paddingHorizontal: horizontalGutter }]}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={[styles.brand, { color: theme.primary }]}>TaskFlow</Text>
              <Text accessibilityRole="header" style={[styles.title, { color: theme.ink }]}>Accueil</Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Se déconnecter"
              accessibilityState={{ disabled: signingOut, busy: signingOut }}
              disabled={signingOut}
              onPress={signOut}
              style={[styles.signout, { backgroundColor: theme.subtle, borderColor: theme.border }]}
            >
              <Text style={[styles.signoutText, { color: theme.ink }]}>Se déconnecter</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.card, { backgroundColor: theme.raised, borderColor: theme.border }]}>
            <View style={[styles.roleBadge, { backgroundColor: theme.subtle }]}>
              <Text style={[styles.roleBadgeText, { color: theme.primary }]}>{formatRoleLabel(profile.role)}</Text>
            </View>
            <Text style={[styles.memberName, { color: theme.ink }]}>
              {profile.firstName} {profile.lastName}
            </Text>
            {!!profile.email && (
              <Text style={[styles.memberEmail, { color: theme.muted }]}>{profile.email}</Text>
            )}
            <Text style={[styles.statusText, { color: theme.muted }]}>
              Votre session est ouverte et enregistrée sur cet appareil. Vous retrouverez cet écran automatiquement en rouvrant l’application.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Projets"
              disabled={signingOut}
              onPress={() => router.replace('/projects')}
              style={({ pressed }) => [
                styles.secondaryAction,
                {
                  marginTop: 16,
                  backgroundColor: theme.subtle,
                  borderColor: theme.border,
                  opacity: pressed || signingOut ? 0.8 : 1,
                },
              ]}
            >
              <Text style={[styles.secondaryActionText, { color: theme.ink }]}>
                Projets
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Assistant"
              disabled={signingOut}
              onPress={() => router.replace('/assistant')}
              style={({ pressed }) => [
                styles.secondaryAction,
                {
                  marginTop: 10,
                  backgroundColor: theme.subtle,
                  borderColor: theme.border,
                  opacity: pressed || signingOut ? 0.8 : 1,
                },
              ]}
            >
              <Text style={[styles.secondaryActionText, { color: theme.ink }]}>
                Assistant
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mon profil"
              disabled={signingOut}
              onPress={() => router.replace('/profile')}
              style={({ pressed }) => [
                styles.secondaryAction,
                {
                  marginTop: 10,
                  backgroundColor: theme.subtle,
                  borderColor: theme.border,
                  opacity: pressed || signingOut ? 0.8 : 1,
                },
              ]}
            >
              <Text style={[styles.secondaryActionText, { color: theme.ink }]}>
                Mon profil
              </Text>
            </Pressable>
          </View>

          {profile.role === 'admin' && (
            <View style={[styles.card, { backgroundColor: theme.raised, borderColor: theme.border }]}>
              <Text accessibilityRole="header" style={[styles.sectionTitle, { color: theme.ink }]}>
                Administration des comptes
              </Text>
              <Text style={[styles.sectionBody, { color: theme.muted }]}>
                Créez un compte de démonstration et récupérez son mot de passe temporaire à transmettre hors application.
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Gérer les comptes de démonstration"
                disabled={signingOut}
                onPress={() => router.replace('/accounts')}
                style={({ pressed }) => [
                  styles.secondaryAction,
                  {
                    backgroundColor: theme.subtle,
                    borderColor: theme.border,
                    opacity: pressed || signingOut ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={[styles.secondaryActionText, { color: theme.ink }]}>
                  Gérer les comptes de démonstration
                </Text>
              </Pressable>
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
  container: { width: '100%', maxWidth: 560, alignSelf: 'center', gap: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 },
  headerText: { flex: 1, minWidth: 180 },
  brand: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  signout: { minHeight: 48, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  signoutText: { fontWeight: '600', fontSize: 15 },
  card: { borderWidth: 1, borderRadius: 18, padding: 18 },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 10 },
  roleBadgeText: { fontSize: 13, fontWeight: '700' },
  memberName: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  memberEmail: { fontSize: 15, lineHeight: 22, marginTop: 4 },
  statusText: { fontSize: 16, lineHeight: 24, marginTop: 12 },
  sectionTitle: { fontSize: 19, lineHeight: 25, fontWeight: '700' },
  sectionBody: { fontSize: 15, lineHeight: 22, marginTop: 8, marginBottom: 16 },
  secondaryAction: { minHeight: 52, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  secondaryActionText: { fontWeight: '700', fontSize: 16 },
});

