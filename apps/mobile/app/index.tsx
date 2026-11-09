import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { supabase } from '@/src/lib/supabase';
import { useTheme } from '@/src/lib/theme';

export default function Index() {
  const theme = useTheme();
  const [destination, setDestination] = useState<'/accounts' | '/sign-in' | null>(null);

  useEffect(() => {
    let active = true;
    async function resolveSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
          if (active) setDestination('/sign-in');
          return;
        }
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, active')
          .eq('id', data.session.user.id)
          .maybeSingle();
        if (profileError) {
          if (active) setDestination('/sign-in');
          return;
        }
        if (!profile?.active || profile.role !== 'admin') {
          try { await supabase.auth.signOut(); } catch { /* ignore */ }
          if (active) setDestination('/sign-in');
          return;
        }
        if (active) setDestination('/accounts');
      } catch {
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
