import { Stack, useLocalSearchParams } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useEffect, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api, type Message } from '@/api';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Newest first (the list is inverted), deduped by id.
function merge(a: Message[], b: Message[]) {
  const byId = new Map([...a, ...b].map((m) => [m.id, m]));
  return [...byId.values()].sort((x, y) => y.createdAt.localeCompare(x.createdAt));
}

export default function ChatScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const theme = useTheme();
  // iOS 26 draws content under the glass header, and an inverted list can't use automatic insets.
  const headerHeight = useHeaderHeight();
  const headerOffset = Platform.OS === 'ios' ? headerHeight : 0;
  const [meId, setMeId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [cursor, setCursor] = useState<string | null | undefined>();
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.me().then((me) => setMeId(me.id), (e) => setError(String(e)));

    let first = true;
    async function poll() {
      try {
        const page = await api.messages(id);
        setMessages((prev) => merge(prev, page.data));
        if (first) setCursor(page.nextCursor ?? null);
        first = false;
        setError('');
      } catch (e) {
        setError(String(e));
      }
    }
    poll();
    // ponytail: the API has no websocket/SSE, so poll the newest page every 3s.
    const timer = setInterval(poll, 3000);
    return () => clearInterval(timer);
  }, [id]);

  async function loadOlder() {
    if (!cursor) return;
    const c = cursor;
    setCursor(undefined); // block duplicate fetches while this one is in flight
    try {
      const page = await api.messages(id, c);
      setMessages((prev) => merge(prev, page.data));
      setCursor(page.nextCursor ?? null);
    } catch (e) {
      setCursor(c);
      setError(String(e));
    }
  }

  async function send() {
    const content = text.trim();
    if (!content) return;
    setText('');
    try {
      const msg = await api.send(id, content);
      setMessages((prev) => merge(prev, [msg]));
    } catch (e) {
      setText(content);
      setError(String(e));
    }
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: headerOffset }]}>
      <Stack.Screen options={{ title: name ?? 'Chat' }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={headerOffset}>
        {!!error && <ThemedText type="small" style={styles.error}>{error}</ThemedText>}
        <FlatList
          inverted
          data={messages}
          keyExtractor={(m) => m.id}
          onEndReached={loadOlder}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const mine = item.senderId === meId;
            return (
              <ThemedView
                type={mine ? undefined : 'backgroundElement'}
                style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                <ThemedText style={mine && styles.mineText}>{item.content}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={mine && styles.mineText}>
                  {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </ThemedText>
              </ThemedView>
            );
          }}
        />
        <SafeAreaView edges={['bottom']} style={styles.composer}>
          <TextInput
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            placeholder="Message"
            placeholderTextColor={theme.textSecondary}
            value={text}
            onChangeText={setText}
            onSubmitEditing={send}
          />
          <Pressable style={[styles.send, !text.trim() && styles.disabled]} disabled={!text.trim()} onPress={send}>
            <ThemedText style={styles.mineText}>Send</ThemedText>
          </Pressable>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: Spacing.three, gap: Spacing.two },
  bubble: { maxWidth: '80%', padding: Spacing.two, paddingHorizontal: Spacing.three, borderRadius: Spacing.three },
  mine: { alignSelf: 'flex-end', backgroundColor: '#3c87f7' },
  theirs: { alignSelf: 'flex-start' },
  mineText: { color: '#fff' },
  composer: { flexDirection: 'row', gap: Spacing.two, padding: Spacing.two },
  input: { flex: 1, padding: Spacing.three, borderRadius: Spacing.five, fontSize: 16 },
  send: { backgroundColor: '#3c87f7', paddingHorizontal: Spacing.three, borderRadius: Spacing.five, justifyContent: 'center' },
  disabled: { opacity: 0.5 },
  error: { color: '#e5484d', padding: Spacing.two },
});
