import { type ComponentRef, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/lib/theme';
import { supabase } from '@/src/lib/supabase';

type SignInFieldErrors = { email?: string; password?: string };
type TextInputInstance = ComponentRef<typeof TextInput>;

export default function SignIn() {
  const theme = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const horizontalGutter = width >= 768 ? 28 : 16;

  const emailRef = useRef<TextInputInstance>(null);
  const passwordRef = useRef<TextInputInstance>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const [fieldErrors, setFieldErrors] = useState<SignInFieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    if (Object.keys(nextErrors).length > 0) {
      if (nextErrors.email) emailRef.current?.focus();
      else if (nextErrors.password) passwordRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail.toLowerCase(),
        password,
      });
      if (authError || !authData.user) {
        setError('Connexion impossible. Vérifiez vos identifiants ou votre connexion, puis réessayez.');
        return;
      }
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, active')
        .eq('id', authData.user.id)
        .maybeSingle();
      if (profileError) {
        setError('Impossible de vérifier le profil. Vérifiez votre connexion, puis réessayez.');
        return;
      }
      if (!profile?.active || profile.role !== 'admin') {
        try { await supabase.auth.signOut(); } catch { /* ignore */ }
        setError('Accès refusé. Cet espace est réservé à un administrateur actif.');
        return;
      }
      router.replace('/accounts');
    } catch {
      setError('Connexion impossible. Vérifiez votre connexion Internet, puis réessayez.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.surface }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={[styles.page, { paddingHorizontal: horizontalGutter }]} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <Text style={[styles.brand, { color: theme.primary }]}>TaskFlow</Text>
            <Text accessibilityRole="header" style={[styles.title, { color: theme.ink }]}>Connexion administrateur</Text>
            <Text style={[styles.help, { color: theme.muted }]}>Connectez-vous pour gérer les comptes de démonstration.</Text>

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
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 12, minHeight: 52, paddingHorizontal: 14, paddingVertical: 10, fontSize: 17 },
  fieldError: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  error: { fontSize: 15, lineHeight: 22, marginTop: 12 },
  button: { minHeight: 52, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  buttonText: { fontWeight: '700', fontSize: 16 },
});
