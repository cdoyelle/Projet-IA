import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/src/lib/theme';

export default function RootLayout() {
  const theme = useTheme();
  return <>
    <StatusBar style="auto" />
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.surface } }} />
  </>;
}
