import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, type Href, useRouter } from 'expo-router';
import { supabase } from '@/src/lib/supabase';
import { useTheme } from '@/src/lib/theme';

type Citation = {
  document: string;
  passage: string;
};

type Message = {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  citations?: Citation[];
};

export default function Assistant() {
  const theme = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const horizontalGutter = width >= 768 ? 28 : 16;

  const mountedRef = useRef(true);
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [redirectHref, setRedirectHref] = useState<Href>('/sign-in?reason=expired');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Bonjour ! Posez-moi une question sur les documents de l’application.',
    },
  ]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    mountedRef.current = true;
    async function checkAuth() {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !data.session) {
        if (mountedRef.current) {
          setAuthorized(false);
          setChecking(false);
          router.replace('/sign-in?reason=expired');
        }
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('active')
        .eq('id', data.session.user.id)
        .maybeSingle();
      if (!profile?.active) {
        try { await supabase.auth.signOut(); } catch { /* ignore */ }
        if (mountedRef.current) {
          setAuthorized(false);
          setChecking(false);
          router.replace('/sign-in?reason=expired');
        }
        return;
      }
      if (mountedRef.current) {
        setAuthorized(true);
        setChecking(false);
      }
    }
    checkAuth();
    return () => { mountedRef.current = false; };
  }, [router]);

  async function askQuestion() {
    if (loading) return;
    const trimmed = question.trim();
    if (!trimmed) return;

    setError('');
    setQuestion('');
    const userMsg: Message = { id: `u-${Date.now()}`, sender: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const { data, error: fnError, response } = await supabase.functions.invoke<{
        found?: boolean;
        answer?: string;
        citations?: Citation[];
        code?: string;
        details?: string;
      }>('project-assistant', {
        body: { action: 'ask', question: trimmed },
      });
      if (!mountedRef.current) return;
      const parsed = typeof data === 'string' ? (JSON.parse(data) as typeof data) : data;
      if (fnError || !parsed?.answer) {
        let extra = parsed?.details ?? parsed?.code ?? '';
        if (!extra && response) {
          try { extra = await response.text(); } catch { /* ignore */ }
        }
        setError(`L’assistant est momentanément indisponible.${extra ? ` (${extra})` : ''}`);
        return;
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          sender: 'assistant',
          text: parsed.answer!,
          citations: parsed.citations ?? [],
        },
      ]);
    } catch {
      if (mountedRef.current) {
        setError('L’assistant est momentanément indisponible. Vérifiez votre connexion.');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  if (checking) {
    return (
      <View style={[styles.center, { backgroundColor: theme.surface }]}>
        <ActivityIndicator accessibilityLabel="Chargement de l’assistant" color={theme.primary} />
      </View>
    );
  }
  if (!authorized) return <Redirect href={redirectHref} />;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.surface }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={[styles.container, { paddingHorizontal: horizontalGutter }]}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={[styles.brand, { color: theme.primary }]}>TaskFlow</Text>
              <Text accessibilityRole="header" style={[styles.title, { color: theme.ink }]}>Assistant</Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Retour à l’accueil"
              onPress={() => router.replace('/home')}
              style={[styles.headerBtn, { backgroundColor: theme.subtle, borderColor: theme.border }]}
            >
              <Text style={[styles.headerBtnText, { color: theme.ink }]}>Accueil</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.messagesList} contentContainerStyle={{ gap: 12, paddingVertical: 12 }}>
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.bubble,
                  msg.sender === 'user'
                    ? { alignSelf: 'flex-end', backgroundColor: theme.primary }
                    : { alignSelf: 'flex-start', backgroundColor: theme.raised, borderColor: theme.border, borderWidth: 1 },
                ]}
              >
                <Text style={{ color: msg.sender === 'user' ? theme.onPrimary : theme.ink, fontSize: 15, lineHeight: 22 }}>
                  {msg.text}
                </Text>
                {msg.citations && msg.citations.length > 0 && (
                  <View style={styles.citationsBox}>
                    <Text style={[styles.citationsTitle, { color: theme.primary }]}>Sources utilisées :</Text>
                    {msg.citations.map((cit, idx) => (
                      <View key={idx} style={[styles.citationCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Text style={[styles.citationDoc, { color: theme.ink }]}>{cit.document}</Text>
                        <Text style={[styles.citationPassage, { color: theme.muted }]}>« {cit.passage} »</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
            {loading && <ActivityIndicator color={theme.primary} style={{ alignSelf: 'flex-start', marginTop: 6 }} />}
          </ScrollView>

          {!!error && <Text accessibilityRole="alert" style={[styles.errorText, { color: theme.danger }]}>{error}</Text>}

          <View style={styles.inputRow}>
            <TextInput
              accessibilityLabel="Votre question"
              placeholder="Posez votre question..."
              placeholderTextColor={theme.muted}
              editable={!loading}
              value={question}
              onChangeText={setQuestion}
              onSubmitEditing={askQuestion}
              style={[styles.input, { color: theme.ink, backgroundColor: theme.raised, borderColor: theme.border }]}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Envoyer"
              disabled={loading || !question.trim()}
              onPress={askQuestion}
              style={[styles.sendBtn, { backgroundColor: theme.primary, opacity: loading || !question.trim() ? 0.6 : 1 }]}
            >
              <Text style={{ color: theme.onPrimary, fontWeight: '700', fontSize: 15 }}>Envoyer</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, width: '100%', maxWidth: 640, alignSelf: 'center', paddingTop: 16, paddingBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  headerText: { flex: 1 },
  brand: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  title: { fontSize: 26, fontWeight: '700' },
  headerBtn: { minHeight: 44, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerBtnText: { fontWeight: '600', fontSize: 15 },
  messagesList: { flex: 1 },
  bubble: { maxWidth: '88%', borderRadius: 16, padding: 14 },
  citationsBox: { marginTop: 10, gap: 6 },
  citationsTitle: { fontSize: 13, fontWeight: '700' },
  citationCard: { borderWidth: 1, borderRadius: 10, padding: 10, gap: 4 },
  citationDoc: { fontSize: 13, fontWeight: '700' },
  citationPassage: { fontSize: 13, lineHeight: 18 },
  errorText: { fontSize: 14, marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8 },
  input: { flex: 1, minHeight: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 16 },
  sendBtn: { minHeight: 48, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
