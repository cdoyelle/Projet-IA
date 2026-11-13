import { type ComponentRef, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, type Href, useRouter } from 'expo-router';
import { supabase } from '@/src/lib/supabase';
import { useTheme } from '@/src/lib/theme';

type FieldErrors = { firstName?: string; lastName?: string };
type TextInputInstance = ComponentRef<typeof TextInput>;

function isAuthRejection(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const code = error.code ?? '';
  const msg = error.message?.toLowerCase() ?? '';
  return code === 'PGRST301' || code === '42501' || msg.includes('jwt') || msg.includes('unauthorized');
}

export default function Profile() {
  const theme = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const horizontalGutter = width >= 768 ? 28 : 16;

  const mountedRef = useRef(true);
  const signingOutRef = useRef(false);
  const hasVerifiedRef = useRef(false);
  const checkSeqRef = useRef(0);
  const firstNameRef = useRef<TextInputInstance>(null);
  const lastNameRef = useRef<TextInputInstance>(null);

  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [redirectHref, setRedirectHref] = useState<Href>('/sign-in?reason=expired');
  const [signingOut, setSigningOut] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [focusedField, setFocusedField] = useState<'firstName' | 'lastName' | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageIsError, setMessageIsError] = useState(false);

  const verifyAccess = useCallback(async (populateFields: boolean) => {
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

      const { data: row, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, active')
        .eq('id', data.session.user.id)
        .maybeSingle();

      if (profileError) {
        if (hasVerifiedRef.current && !isAuthRejection(profileError)) return;
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

      if (!row?.active) {
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

      if (mountedRef.current && !signingOutRef.current && seq === checkSeqRef.current) {
        hasVerifiedRef.current = true;
        setUserId(data.session.user.id);
        setEmail(data.session.user.email ?? '');
        if (populateFields) {
          setFirstName(row.first_name);
          setLastName(row.last_name);
        }
        setAuthorized(true);
        setChecking(false);
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
    verifyAccess(true);

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
        verifyAccess(false);
      }
    });

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && mountedRef.current && !signingOutRef.current) {
        verifyAccess(false);
      }
    });

    return () => {
      mountedRef.current = false;
      listener.subscription.unsubscribe();
      appStateSubscription.remove();
    };
  }, [router, verifyAccess]);

  async function saveProfile() {
    if (saving || signingOut || !userId) return;
    const errors: FieldErrors = {};
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    if (!trimmedFirstName) {
      errors.firstName = 'Saisissez votre prénom.';
    } else if (trimmedFirstName.length > 100) {
      errors.firstName = 'Le prénom ne doit pas dépasser 100 caractères.';
    }
    if (!trimmedLastName) {
      errors.lastName = 'Saisissez votre nom.';
    } else if (trimmedLastName.length > 100) {
      errors.lastName = 'Le nom ne doit pas dépasser 100 caractères.';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      if (errors.firstName) firstNameRef.current?.focus();
      else if (errors.lastName) lastNameRef.current?.focus();
      return;
    }

    setMessage('');
    setSaving(true);
    try {
      const { data: updated, error } = await supabase
        .from('profiles')
        .update({ first_name: trimmedFirstName, last_name: trimmedLastName })
        .eq('id', userId)
        .select('first_name, last_name')
        .maybeSingle();

      if (!mountedRef.current || signingOutRef.current) return;
      if (error || !updated) {
        if (error && isAuthRejection(error)) {
          await verifyAccess(false);
          return;
        }
        setMessage('Impossible d’enregistrer votre profil. Vérifiez votre connexion, puis réessayez.');
        setMessageIsError(true);
        return;
      }
      setFirstName(updated.first_name);
      setLastName(updated.last_name);
      setMessage('Votre profil a été mis à jour.');
      setMessageIsError(false);
    } catch {
      if (!mountedRef.current || signingOutRef.current) return;
      setMessage('Impossible d’enregistrer votre profil. Vérifiez votre connexion, puis réessayez.');
      setMessageIsError(true);
    } finally {
      if (mountedRef.current) setSaving(false);
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
      // Ignore keystore/network errors on sign-out and redirect to sign-in.
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
        <ActivityIndicator accessibilityLabel="Chargement du profil" color={theme.primary} />
      </View>
    );
  }
  if (!authorized) return <Redirect href={redirectHref} />;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.surface }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={[styles.page, { paddingHorizontal: horizontalGutter }]} keyboardShouldPersistTaps="handled">
          <View style={styles.container}>
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={[styles.brand, { color: theme.primary }]}>TaskFlow</Text>
                <Text accessibilityRole="header" style={[styles.title, { color: theme.ink }]}>Mon profil</Text>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Retour à l’accueil"
                  disabled={signingOut}
                  onPress={() => router.replace('/home')}
                  style={[styles.signout, { backgroundColor: theme.subtle, borderColor: theme.border }]}
                >
                  <Text style={[styles.signoutText, { color: theme.ink }]}>Accueil</Text>
                </TouchableOpacity>
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
            </View>

            {!!email && <Text style={[styles.emailText, { color: theme.muted }]}>{email}</Text>}

            <Text style={[styles.label, { color: theme.ink }]}>Prénom</Text>
            <TextInput
              ref={firstNameRef}
              accessibilityLabel="Prénom"
              accessibilityHint={fieldErrors.firstName}
              autoComplete="given-name"
              editable={!saving && !signingOut}
              maxLength={100}
              value={firstName}
              onFocus={() => setFocusedField('firstName')}
              onBlur={() => setFocusedField((prev) => (prev === 'firstName' ? null : prev))}
              onChangeText={(val) => {
                setFirstName(val);
                if (fieldErrors.firstName) setFieldErrors((prev) => ({ ...prev, firstName: undefined }));
              }}
              style={[
                styles.input,
                {
                  color: theme.ink,
                  backgroundColor: theme.raised,
                  borderColor: fieldErrors.firstName ? theme.danger : focusedField === 'firstName' ? theme.focus : theme.border,
                },
              ]}
            />
            {!!fieldErrors.firstName && (
              <Text accessibilityRole="alert" style={[styles.fieldError, { color: theme.danger }]}>{fieldErrors.firstName}</Text>
            )}

            <Text style={[styles.label, { color: theme.ink }]}>Nom</Text>
            <TextInput
              ref={lastNameRef}
              accessibilityLabel="Nom"
              accessibilityHint={fieldErrors.lastName}
              autoComplete="family-name"
              editable={!saving && !signingOut}
              maxLength={100}
              value={lastName}
              onFocus={() => setFocusedField('lastName')}
              onBlur={() => setFocusedField((prev) => (prev === 'lastName' ? null : prev))}
              onChangeText={(val) => {
                setLastName(val);
                if (fieldErrors.lastName) setFieldErrors((prev) => ({ ...prev, lastName: undefined }));
              }}
              style={[
                styles.input,
                {
                  color: theme.ink,
                  backgroundColor: theme.raised,
                  borderColor: fieldErrors.lastName ? theme.danger : focusedField === 'lastName' ? theme.focus : theme.border,
                },
              ]}
            />
            {!!fieldErrors.lastName && (
              <Text accessibilityRole="alert" style={[styles.fieldError, { color: theme.danger }]}>{fieldErrors.lastName}</Text>
            )}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Enregistrer"
              accessibilityState={{ disabled: saving || signingOut, busy: saving }}
              disabled={saving || signingOut}
              onPress={saveProfile}
              style={({ pressed }) => [
                styles.button,
                {
                  backgroundColor: pressed ? theme.primaryPressed : theme.primary,
                  opacity: saving || signingOut ? 0.7 : 1,
                },
              ]}
            >
              {saving ? <ActivityIndicator color={theme.onPrimary} /> : <Text style={[styles.buttonText, { color: theme.onPrimary }]}>Enregistrer</Text>}
            </Pressable>

            {!!message && (
              <Text accessibilityRole="alert" style={[styles.message, { color: messageIsError ? theme.danger : theme.success }]}>
                {message}
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  page: { flexGrow: 1, paddingTop: 20, paddingBottom: 48 },
  container: { width: '100%', maxWidth: 560, alignSelf: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 },
  headerText: { flex: 1, minWidth: 180 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  brand: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  emailText: { fontSize: 15, lineHeight: 22, marginTop: 12, marginBottom: 8 },
  label: { fontSize: 16, fontWeight: '600', marginTop: 14, marginBottom: 8 },
  input: { minHeight: 52, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, fontSize: 17 },
  fieldError: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  button: { minHeight: 52, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 12, marginTop: 24 },
  buttonText: { fontWeight: '700', fontSize: 16 },
  message: { fontSize: 16, lineHeight: 24, marginTop: 16 },
  signout: { minHeight: 48, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  signoutText: { fontWeight: '600', fontSize: 15 },
});
