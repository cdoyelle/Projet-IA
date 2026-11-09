import { useColorScheme } from 'react-native';

const light = {
  primary: '#2457A7', primaryPressed: '#194481', onPrimary: '#FFFFFF',
  accent: '#087F83', onAccent: '#FFFFFF',
  surface: '#F6F8FB', raised: '#FFFFFF', subtle: '#EAF0F7',
  ink: '#182334', muted: '#58677A', border: '#D9E1EA',
  danger: '#B33C43', warning: '#9A5A00', success: '#26734D', focus: '#1769AA',
};
const dark = {
  primary: '#8CB7FF', primaryPressed: '#A8C9FF', onPrimary: '#10213C',
  accent: '#61D2CD', onAccent: '#062C2D',
  surface: '#111923', raised: '#1B2735', subtle: '#263548',
  ink: '#EDF3FA', muted: '#B0BECE', border: '#39495B',
  danger: '#FF9A9F', warning: '#FFC66F', success: '#78D6A3', focus: '#8CB7FF',
};

export function useTheme() {
  return useColorScheme() === 'dark' ? dark : light;
}
