import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect, type Href } from 'expo-router';
import { supabase } from '@/src/lib/supabase';
import { useTheme } from '@/src/lib/theme';

export default function Index() {
  const theme = useTheme();
  const [destination, setDestination] = useState<Href | null>(null);

  useEffect(() => {
    let active = true;
    async function resolveSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          try { await supabase.auth.signOut(); } catch { /* ignore */ }
          if (active) setDestination('/sign-in?reason=expired');
          return;
        }
        if (!data.session) {
          if (active) setDestination('/sign-in');
          return;
        }
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, active')
          .eq('id', data.session.user.id)
          .maybeSingle();
        if (profileError || !profile?.active) {
          try { await supabase.auth.signOut(); } catch { /* ignore */ }
          if (active) setDestination('/sign-in?reason=expired');
          return;
        }
        if (active) setDestination('/home');
      } catch {
        try { await supabase.auth.signOut(); } catch { /* ignore */ }
        if (active) setDestination('/sign-in');
      }
    }
    resolveSession();
    return () => { active = false; };
  }, []);

  if (!destination) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.surface }}>
        <ActivityIndicator accessibilityLabel="Chargement de la session" color={theme.primary} />
      </View>
    );
  }
  return <Redirect href={destination} />;
}
