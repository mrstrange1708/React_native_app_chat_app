import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/* expo-router makes headers transparent on iOS 26, which slides lists under them */}
      <Stack screenOptions={{ headerTransparent: false }}>
        <Stack.Screen name="index" options={{ title: 'Sign in' }} />
        <Stack.Screen name="users" options={{ title: 'Users', headerBackVisible: false }} />
        <Stack.Screen name="chat/[id]" options={{ title: 'Chat' }} />
      </Stack>
    </ThemeProvider>
  );
}
