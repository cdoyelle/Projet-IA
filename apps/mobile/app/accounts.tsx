import { type ComponentRef, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, KeyboardAvoidingView, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, type Href, useRouter } from 'expo-router';
import { useTheme } from '@/src/lib/theme';
import { supabase } from '@/src/lib/supabase';
import type { AdminAccountSummary, CreateDemoAccountRequest, CreateDemoAccountSuccess, EdgeErrorCode, EdgeErrorResponse, ListDemoAccountsSuccess, ToggleAccountStatusRequest, ToggleAccountStatusSuccess } from '@/src/lib/contracts';

type FieldErrors = { firstName?: string; lastName?: string; email?: string };
type TextInputInstance = ComponentRef<typeof TextInput>;

function isAuthRejection(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const code = error.code ?? '';
  const msg = error.message?.toLowerCase() ?? '';
  return code === 'PGRST301' || code === '42501' || msg.includes('jwt') || msg.includes('unauthorized');
}

async function readFunctionErrorCode(error: unknown, response?: Response): Promise<EdgeErrorCode | undefined> {
  const context = response ?? (
    error && typeof error === 'object' && 'context' in error
      ? (error as { context?: unknown }).context
      : undefined
  );
  if (!context || typeof context !== 'object') return undefined;

  const res = context as {
    status?: number;
    json?: () => Promise<unknown>;
    text?: () => Promise<string>;
  };

  try {
    if (typeof res.text === 'function') {
      const raw = await res.text();
      if (raw) {
        const body = JSON.parse(raw) as Partial<EdgeErrorResponse>;
        if (body.code) return body.code;
      }
    } else if (typeof res.json === 'function') {
      const body = (await res.json()) as Partial<EdgeErrorResponse>;
      if (body?.code) return body.code;
    }
  } catch {
    // Fall back to HTTP status code if the response stream cannot be parsed.
  }

  if (res.status === 409) return 'CONFLICT';
  if (res.status === 403) return 'FORBIDDEN';
  if (res.status === 401) return 'AUTH_REQUIRED';
  if (res.status === 400) return 'VALIDATION_ERROR';
  return undefined;
}

export default function Accounts() {
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
  const emailRef = useRef<TextInputInstance>(null);

  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [redirectHref, setRedirectHref] = useState<Href>('/sign-in?reason=expired');
  const [signingOut, setSigningOut] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [focusedField, setFocusedField] = useState<'firstName' | 'lastName' | 'email' | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState('');
  const [messageIsError, setMessageIsError] = useState(false);
  const [password, setPassword] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<AdminAccountSummary[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const verifyAccess = useCallback(async () => {
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
          setAuthorized(false);
          setPassword(null);
          setChecking(false);
          router.replace(target);
        }
        return;
      }
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, active')
        .eq('id', data.session.user.id)
        .maybeSingle();
      if (error) {
        if (hasVerifiedRef.current && !isAuthRejection(error)) {
          return;
        }
        try { await supabase.auth.signOut(); } catch { /* ignore */ }
        if (mountedRef.current && !signingOutRef.current && seq === checkSeqRef.current) {
          hasVerifiedRef.current = false;
          setRedirectHref('/sign-in?reason=expired');
          setAuthorized(false);
          setPassword(null);
          setChecking(false);
          router.replace('/sign-in?reason=expired');
        }
        return;
      }
      if (!profile?.active) {
        try { await supabase.auth.signOut(); } catch { /* ignore */ }
        if (mountedRef.current && !signingOutRef.current && seq === checkSeqRef.current) {
          hasVerifiedRef.current = false;
          setRedirectHref('/sign-in?reason=expired');
          setAuthorized(false);
          setPassword(null);
          setChecking(false);
          router.replace('/sign-in?reason=expired');
        }
        return;
      }
      if (profile.role !== 'admin') {
        if (mountedRef.current && !signingOutRef.current && seq === checkSeqRef.current) {
          hasVerifiedRef.current = false;
          setRedirectHref('/home');
          setAuthorized(false);
          setPassword(null);
          setChecking(false);
          router.replace('/home');
        }
        return;
      }
      if (mountedRef.current && !signingOutRef.current && seq === checkSeqRef.current) {
        hasVerifiedRef.current = true;
        setCurrentUserId(data.session.user.id);
        setAuthorized(true);
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
        setAuthorized(false);
        setPassword(null);
        setChecking(false);
        router.replace('/sign-in?reason=expired');
      }
    }
  }, [router]);

  useEffect(() => {
    mountedRef.current = true;
    verifyAccess();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mountedRef.current) return;
      if (!session || event === 'SIGNED_OUT') {
        const target: Href = signingOutRef.current ? '/sign-in' : '/sign-in?reason=expired';
        hasVerifiedRef.current = false;
        setRedirectHref(target);
        setAuthorized(false);
        setPassword(null);
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
      listener.subscription.unsubscribe();
      appStateSubscription.remove();
    };
  }, [router, verifyAccess]);

  const loadAccounts = useCallback(async () => {
    setAccountsLoading(true);
    setAccountsError('');
    try {
      const { data, error, response } = await supabase.functions.invoke<ListDemoAccountsSuccess & Partial<EdgeErrorResponse>>('admin-accounts', {
        body: { action: 'list' },
      });
      if (!mountedRef.current || signingOutRef.current) return;
      if (error || !Array.isArray(data?.accounts)) {
        const code = data?.code ?? await readFunctionErrorCode(error, response);
        if (code === 'FORBIDDEN' || code === 'AUTH_REQUIRED') {
          await verifyAccess();
          return;
        }
        setAccountsError('Impossible de charger la liste des comptes.');
        return;
      }
      setAccounts(data.accounts);
    } catch {
      if (!mountedRef.current || signingOutRef.current) return;
      setAccountsError('Impossible de charger la liste des comptes.');
    } finally {
      if (mountedRef.current) setAccountsLoading(false);
    }
  }, [verifyAccess]);

  useEffect(() => {
    if (authorized) {
      loadAccounts();
    }
  }, [authorized, loadAccounts]);

  async function toggleAccountStatus(account: AdminAccountSummary) {
    if (togglingId || signingOut || account.id === currentUserId) return;
    setTogglingId(account.id);
    setAccountsError('');
    try {
      const payload: ToggleAccountStatusRequest = {
        userId: account.id,
        active: !account.active,
      };
      const { data, error, response } = await supabase.functions.invoke<ToggleAccountStatusSuccess & Partial<EdgeErrorResponse>>('admin-accounts', {
        body: { action: 'toggle', ...payload },
      });
      if (!mountedRef.current || signingOutRef.current) return;
      if (error || typeof data?.active !== 'boolean') {
        const code = data?.code ?? await readFunctionErrorCode(error, response);
        if (code === 'FORBIDDEN' || code === 'AUTH_REQUIRED') {
          await verifyAccess();
          return;
        }
        setAccountsError('Impossible de modifier le statut du compte.');
        return;
      }
      setAccounts((prev) =>
        prev.map((item) => (item.id === account.id ? { ...item, active: data.active } : item))
      );
    } catch {
      if (!mountedRef.current || signingOutRef.current) return;
      setAccountsError('Impossible de modifier le statut du compte.');
    } finally {
      if (mountedRef.current) setTogglingId(null);
    }
  }

  async function createAccount() {
    if (loading || signingOut) return;
    const errors: FieldErrors = {};
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedFirstName) {
      errors.firstName = 'Saisissez le prénom.';
    } else if (trimmedFirstName.length > 100) {
      errors.firstName = 'Le prénom ne doit pas dépasser 100 caractères.';
    }
    if (!trimmedLastName) {
      errors.lastName = 'Saisissez le nom.';
    } else if (trimmedLastName.length > 100) {
      errors.lastName = 'Le nom ne doit pas dépasser 100 caractères.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Saisissez une adresse e-mail valide.';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      if (errors.firstName) firstNameRef.current?.focus();
      else if (errors.lastName) lastNameRef.current?.focus();
      else if (errors.email) emailRef.current?.focus();
      return;
    }

    setMessage('');
    setPassword(null);
    setLoading(true);
    try {
      const payload: CreateDemoAccountRequest = {
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        email: trimmedEmail.toLowerCase(),
      };
      const { data, error, response } = await supabase.functions.invoke<CreateDemoAccountSuccess & Partial<EdgeErrorResponse>>('admin-accounts', {
        body: payload,
      });
      if (!mountedRef.current || signingOutRef.current) return;
      if (error || typeof data?.password !== 'string' || !data.password) {
        const code = data?.code ?? await readFunctionErrorCode(error, response);
        if (!mountedRef.current || signingOutRef.current) return;
        if (code === 'FORBIDDEN') {
          await verifyAccess();
          return;
        }
        if (code === 'AUTH_REQUIRED') {
          hasVerifiedRef.current = false;
          setAuthorized(false);
          setPassword(null);
          try { await supabase.auth.signOut(); } catch { /* ignore */ }
          if (!mountedRef.current || signingOutRef.current) return;
          setRedirectHref('/sign-in?reason=expired');
          router.replace('/sign-in?reason=expired');
          return;
        }
        setMessage(
          code === 'CONFLICT'
            ? 'Cette adresse e-mail est déjà utilisée. Vérifiez l’adresse ou choisissez-en une autre.'
            : code === 'VALIDATION_ERROR'
              ? 'Certaines informations sont invalides. Vérifiez les champs saisis, puis réessayez.'
              : 'Impossible de créer le compte. Vérifiez votre connexion, puis réessayez.'
        );
        setMessageIsError(true);
        return;
      }
      setPassword(data.password);
      setMessage('Le compte a été créé. Transmettez ce mot de passe à la personne par un moyen externe à l’application.');
      setMessageIsError(false);
      setFirstName('');
      setLastName('');
      setEmail('');
      setFieldErrors({});
      loadAccounts();
    } catch {
      if (!mountedRef.current || signingOutRef.current) return;
      setMessage('Impossible de créer le compte. Vérifiez votre connexion, puis réessayez.');
      setMessageIsError(true);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  async function sharePassword() {
    if (!password) return;
    try {
      await Share.share({ message: password });
    } catch {
      // Ignore dismissed share sheet.
    }
  }

  async function signOut() {
    if (signingOut) return;
    signingOutRef.current = true;
    checkSeqRef.current += 1;
    hasVerifiedRef.current = false;
    setSigningOut(true);
    setPassword(null);
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
        <ActivityIndicator accessibilityLabel="Chargement" color={theme.primary} />
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
                <Text style={[styles.brand, { color: theme.primary }]}>TaskFlow · Administration</Text>
                <Text accessibilityRole="header" style={[styles.title, { color: theme.ink }]}>Créer un compte de démonstration</Text>
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
            <Text style={[styles.intro, { color: theme.muted }]}>
              Le mot de passe sera généré après validation et affiché une seule fois pour remise hors application. Aucun courriel n’est envoyé.
            </Text>

            <Text style={[styles.label, { color: theme.ink }]}>Prénom</Text>
            <TextInput
              ref={firstNameRef}
              accessibilityLabel="Prénom"
              accessibilityHint={fieldErrors.firstName}
              autoComplete="given-name"
              editable={!loading && !signingOut}
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
              editable={!loading && !signingOut}
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

            <Text style={[styles.label, { color: theme.ink }]}>Adresse e-mail</Text>
            <TextInput
              ref={emailRef}
              accessibilityLabel="Adresse e-mail"
              accessibilityHint={fieldErrors.email}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              editable={!loading && !signingOut}
              value={email}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField((prev) => (prev === 'email' ? null : prev))}
              onChangeText={(val) => {
                setEmail(val);
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }}
              style={[
                styles.input,
                {
                  color: theme.ink,
                  backgroundColor: theme.raised,
                  borderColor: fieldErrors.email ? theme.danger : focusedField === 'email' ? theme.focus : theme.border,
                },
              ]}
            />
            {!!fieldErrors.email && (
              <Text accessibilityRole="alert" style={[styles.fieldError, { color: theme.danger }]}>{fieldErrors.email}</Text>
            )}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Créer le compte"
              accessibilityState={{ disabled: loading || signingOut, busy: loading }}
              disabled={loading || signingOut}
              onPress={createAccount}
              style={({ pressed }) => [
                styles.button,
                {
                  backgroundColor: pressed ? theme.primaryPressed : theme.primary,
                  opacity: loading || signingOut ? 0.7 : 1,
                },
              ]}
            >
              {loading ? <ActivityIndicator color={theme.onPrimary} /> : <Text style={[styles.buttonText, { color: theme.onPrimary }]}>Créer le compte</Text>}
            </Pressable>

            {!!message && (
              <Text accessibilityRole="alert" style={[styles.message, { color: messageIsError ? theme.danger : theme.success }]}>
                {message}
              </Text>
            )}

            {password !== null && (
              <View accessibilityLiveRegion="polite" style={[styles.secretCard, { backgroundColor: theme.raised, borderColor: theme.border }]}>
                <Text style={[styles.label, { color: theme.ink, marginTop: 0 }]}>Mot de passe à transmettre</Text>
                <Text selectable accessibilityLabel="Mot de passe généré" style={[styles.password, { color: theme.ink }]}>{password}</Text>
                <Text style={[styles.footnote, { color: theme.muted }]}>
                  Notez-le maintenant. Il ne sera plus affiché après avoir quitté cet écran.
                </Text>
                <View style={styles.secretActions}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Partager le mot de passe"
                    onPress={sharePassword}
                    style={[styles.secondaryButton, { backgroundColor: theme.subtle }]}
                  >
                    <Text style={{ color: theme.ink, fontWeight: '600' }}>Partager le mot de passe</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Masquer le mot de passe"
                    onPress={() => setPassword(null)}
                    style={[styles.secondaryButton, { backgroundColor: theme.subtle }]}
                  >
                    <Text style={{ color: theme.ink, fontWeight: '600' }}>Masquer le mot de passe</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.listSection}>
              <Text accessibilityRole="header" style={[styles.listTitle, { color: theme.ink }]}>Liste des comptes</Text>
              {accountsLoading && (
                <ActivityIndicator accessibilityLabel="Chargement des comptes" color={theme.primary} style={{ marginTop: 12 }} />
              )}
              {!!accountsError && (
                <Text accessibilityRole="alert" style={[styles.message, { color: theme.danger }]}>{accountsError}</Text>
              )}
              {accounts.map((account) => {
                const isSelf = account.id === currentUserId;
                const isBusy = togglingId === account.id;
                return (
                  <View
                    key={account.id}
                    style={[styles.accountCard, { backgroundColor: theme.raised, borderColor: theme.border }]}
                  >
                    <View style={styles.accountInfo}>
                      <Text style={[styles.accountName, { color: theme.ink }]}>
                        {account.first_name} {account.last_name}
                      </Text>
                      <Text style={[styles.accountMeta, { color: theme.muted }]}>
                        {account.role === 'admin' ? 'Administrateur' : account.role === 'owner' ? 'Responsable' : 'Membre'} · {account.active ? 'Actif' : 'Désactivé'}
                      </Text>
                    </View>
                    {!isSelf && (
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={account.active ? `Désactiver ${account.first_name}` : `Réactiver ${account.first_name}`}
                        disabled={isBusy || signingOut}
                        onPress={() => toggleAccountStatus(account)}
                        style={[
                          styles.toggleButton,
                          {
                            backgroundColor: theme.subtle,
                            borderColor: account.active ? theme.danger : theme.primary,
                            opacity: isBusy ? 0.6 : 1,
                          },
                        ]}
                      >
                        <Text style={{ color: account.active ? theme.danger : theme.primary, fontWeight: '600', fontSize: 14 }}>
                          {account.active ? 'Désactiver' : 'Réactiver'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
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
  headerText: { flex: 1, minWidth: 200 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  brand: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  title: { fontSize: 26, lineHeight: 33, fontWeight: '700' },
  intro: { fontSize: 16, lineHeight: 24, marginTop: 12, marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', marginTop: 14, marginBottom: 8 },
  input: { minHeight: 52, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, fontSize: 17 },
  fieldError: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  button: { minHeight: 52, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 12, marginTop: 24 },
  buttonText: { fontWeight: '700', fontSize: 16 },
  message: { fontSize: 16, lineHeight: 24, marginTop: 16 },
  signout: { minHeight: 48, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  signoutText: { fontWeight: '600', fontSize: 15 },
  secretCard: { borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 20 },
  password: { fontSize: 20, fontWeight: '700', letterSpacing: 1.2, paddingVertical: 8 },
  footnote: { fontSize: 14, lineHeight: 20 },
  secretActions: { gap: 10, marginTop: 16 },
  secondaryButton: { minHeight: 48, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  listSection: { marginTop: 32, gap: 12 },
  listTitle: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
  accountCard: { borderWidth: 1, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  accountInfo: { flex: 1 },
  accountName: { fontSize: 16, fontWeight: '700' },
  accountMeta: { fontSize: 14, marginTop: 2 },
  toggleButton: { minHeight: 44, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
