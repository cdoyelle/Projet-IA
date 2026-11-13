import { type ComponentRef, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/src/lib/theme';
import { supabase } from '@/src/lib/supabase';

type SignInFieldErrors = { email?: string; password?: string };
type TextInputInstance = ComponentRef<typeof TextInput>;

function isInvalidCredentialsError(authError: { code?: string; status?: number; message?: string } | null): boolean {
  if (!authError) return false;
  const msg = authError.message?.toLowerCase() ?? '';
  return (
    authError.code === 'invalid_credentials' ||
    msg.includes('invalid login credentials') ||
    msg.includes('invalid_credentials')
  );
}

function isBannedUserError(authError: { code?: string; message?: string } | null): boolean {
  if (!authError) return false;
  const msg = authError.message?.toLowerCase() ?? '';
  return authError.code === 'user_banned' || msg.includes('banned');
}

export default function SignIn() {
  const theme = useTheme();
  const router = useRouter();
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const { width } = useWindowDimensions();
  const horizontalGutter = width >= 768 ? 28 : 16;

  const mountedRef = useRef(true);
  const emailRef = useRef<TextInputInstance>(null);
  const passwordRef = useRef<TextInputInstance>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const [fieldErrors, setFieldErrors] = useState<SignInFieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dismissedNotice, setDismissedNotice] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (reason === 'expired') {
      setDismissedNotice(false);
    }
  }, [reason]);

  const showExpiredNotice = reason === 'expired' && !dismissedNotice && !error;

  async function submit() {
    if (loading) return;
    const nextErrors: SignInFieldErrors = {};
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = 'Saisissez une adresse e-mail valide.';
    }
    if (!password) {
      nextErrors.password = 'Saisissez votre mot de passe.';
    }
    setFieldErrors(nextErrors);
    setError('');
    setDismissedNotice(true);
    if (Object.keys(nextErrors).length > 0) {
      if (nextErrors.email) emailRef.current?.focus();
      else if (nextErrors.password) passwordRef.current?.focus();
      return;
    }

    setLoading(true);
    let signedIn = false;
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail.toLowerCase(),
        password,
      });
      if (authError || !authData.user) {
        if (!mountedRef.current) return;
        if (isBannedUserError(authError)) {
          setPassword('');
          setError('Ce compte n’est plus actif. Contactez votre administrateur.');
        } else if (isInvalidCredentialsError(authError)) {
          setPassword('');
          setError('Adresse e-mail ou mot de passe incorrect. Vérifiez vos identifiants, puis réessayez.');
        } else {
          setError('Connexion impossible. Vérifiez votre connexion Internet, puis réessayez.');
        }
        return;
      }
      signedIn = true;
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, active')
        .eq('id', authData.user.id)
        .maybeSingle();
      if (profileError) {
        try { await supabase.auth.signOut(); } catch { /* ignore */ }
        if (!mountedRef.current) return;
        setError('Impossible de vérifier votre profil. Vérifiez votre connexion, puis réessayez.');
        return;
      }
      if (!profile?.active) {
        try { await supabase.auth.signOut(); } catch { /* ignore */ }
        if (!mountedRef.current) return;
        setPassword('');
        setError('Ce compte n’est plus actif. Contactez votre administrateur.');
        return;
      }
      if (!mountedRef.current) return;
      setPassword('');
      router.replace('/home');
    } catch {
      if (signedIn) {
        try { await supabase.auth.signOut(); } catch { /* ignore */ }
      }
      if (!mountedRef.current) return;
      setError('Connexion impossible. Vérifiez votre connexion Internet, puis réessayez.');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.surface }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={[styles.page, { paddingHorizontal: horizontalGutter }]} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <Text style={[styles.brand, { color: theme.primary }]}>TaskFlow</Text>
            <Text accessibilityRole="header" style={[styles.title, { color: theme.ink }]}>Connexion</Text>
            <Text style={[styles.help, { color: theme.muted }]}>Connectez-vous pour retrouver votre espace TaskFlow.</Text>

            {showExpiredNotice && (
              <View
                accessibilityRole="alert"
                style={[styles.noticeCard, { backgroundColor: theme.raised, borderColor: theme.warning }]}
              >
                <Text style={[styles.noticeText, { color: theme.ink }]}>
                  Votre session a expiré ou votre accès n’est plus actif. Connectez-vous pour continuer.
                </Text>
              </View>
            )}

            <Text style={[styles.label, { color: theme.ink }]}>Adresse e-mail</Text>
            <TextInput
              ref={emailRef}
              accessibilityLabel="Adresse e-mail"
              accessibilityHint={fieldErrors.email}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              editable={!loading}
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

            <Text style={[styles.label, { color: theme.ink }]}>Mot de passe</Text>
            <TextInput
              ref={passwordRef}
              accessibilityLabel="Mot de passe"
              accessibilityHint={fieldErrors.password}
              autoComplete="password"
              secureTextEntry
              editable={!loading}
              value={password}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField((prev) => (prev === 'password' ? null : prev))}
              onChangeText={(val) => {
                setPassword(val);
                if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }}
              style={[
                styles.input,
                {
                  color: theme.ink,
                  backgroundColor: theme.raised,
                  borderColor: fieldErrors.password ? theme.danger : focusedField === 'password' ? theme.focus : theme.border,
                },
              ]}
            />
            {!!fieldErrors.password && (
              <Text accessibilityRole="alert" style={[styles.fieldError, { color: theme.danger }]}>{fieldErrors.password}</Text>
            )}

            {!!error && <Text accessibilityRole="alert" style={[styles.error, { color: theme.danger }]}>{error}</Text>}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Se connecter"
              accessibilityState={{ disabled: loading, busy: loading }}
              disabled={loading}
              onPress={submit}
              style={({ pressed }) => [
                styles.button,
                {
                  backgroundColor: pressed ? theme.primaryPressed : theme.primary,
                  opacity: loading ? 0.7 : 1,
                },
              ]}
            >
              {loading ? <ActivityIndicator color={theme.onPrimary} /> : <Text style={[styles.buttonText, { color: theme.onPrimary }]}>Se connecter</Text>}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={showHelp ? 'Masquer l’aide de connexion' : 'Mot de passe oublié ?'}
              disabled={loading}
              onPress={() => setShowHelp((prev) => !prev)}
              style={({ pressed }) => [
                styles.helpToggle,
                {
                  backgroundColor: theme.subtle,
                  borderColor: theme.border,
                  opacity: pressed || loading ? 0.8 : 1,
                },
              ]}
            >
              <Text style={[styles.helpToggleText, { color: theme.ink }]}>
                {showHelp ? 'Masquer l’aide' : 'Mot de passe oublié ?'}
              </Text>
            </Pressable>

            {showHelp && (
              <View
                accessibilityLiveRegion="polite"
                style={[styles.helpCard, { backgroundColor: theme.raised, borderColor: theme.border }]}
              >
                <Text accessibilityRole="header" style={[styles.helpCardTitle, { color: theme.ink }]}>
                  Retrouver votre accès
                </Text>
                <Text style={[styles.helpCardBody, { color: theme.muted }]}>
                  Aucun courriel de réinitialisation n’est envoyé dans cette application. Contactez votre administrateur afin qu’il génère un nouveau mot de passe et vous le transmette en dehors de l’application.
                </Text>
              </View>
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
  page: { flexGrow: 1, justifyContent: 'center', paddingVertical: 28 },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center' },
  brand: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  help: { fontSize: 16, lineHeight: 24, marginTop: 8, marginBottom: 24 },
  noticeCard: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 16 },
  noticeText: { fontSize: 15, lineHeight: 22, fontWeight: '500' },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 12, minHeight: 52, paddingHorizontal: 14, paddingVertical: 10, fontSize: 17 },
  fieldError: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  error: { fontSize: 15, lineHeight: 22, marginTop: 12 },
  button: { minHeight: 52, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  buttonText: { fontWeight: '700', fontSize: 16 },
  helpToggle: { minHeight: 48, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  helpToggleText: { fontWeight: '600', fontSize: 15 },
  helpCard: { borderWidth: 1, borderRadius: 14, padding: 16, marginTop: 14 },
  helpCardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  helpCardBody: { fontSize: 15, lineHeight: 22 },
});
