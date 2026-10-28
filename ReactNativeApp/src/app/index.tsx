import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';

import { api, setCredentials } from '@/api';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function LoginScreen() {
  const theme = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true);
    setError('');
    setCredentials(username.trim(), password);
    try {
      await api.me(); // backend auto-creates the user on first sign-in
      router.replace('/users');
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  const input = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">Chat</ThemedText>
      <TextInput
        style={input}
        placeholder="Username"
        placeholderTextColor={theme.textSecondary}
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={input}
        placeholder="Password"
        placeholderTextColor={theme.textSecondary}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={signIn}
      />
      {!!error && <ThemedText type="small" style={styles.error}>{error}</ThemedText>}
      <Pressable
        style={[styles.button, (busy || !username.trim() || !password) && styles.disabled]}
        disabled={busy || !username.trim() || !password}
        onPress={signIn}>
        <ThemedText style={styles.buttonText}>{busy ? 'Signing in…' : 'Sign in'}</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: Spacing.four, gap: Spacing.three },
  input: { padding: Spacing.three, borderRadius: Spacing.two, fontSize: 16 },
  button: { backgroundColor: '#3c87f7', padding: Spacing.three, borderRadius: Spacing.two, alignItems: 'center' },
  buttonText: { color: '#fff' },
  disabled: { opacity: 0.5 },
  error: { color: '#e5484d' },
});
