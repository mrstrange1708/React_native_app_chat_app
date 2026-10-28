import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';

import { api, type User } from '@/api';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function UsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    Promise.all([api.me(), api.users()])
      .then(([me, all]) => {
        setUsers(all.filter((u) => u.id !== me.id));
        setError('');
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [reloadKey]);

  async function openChat(user: User) {
    try {
      const convo = await api.openDm(user.id); // returns the existing DM if there is one
      router.push({ pathname: '/chat/[id]', params: { id: convo.id, name: user.name } });
    } catch (e) {
      setError(String(e));
    }
  }

  return (
    <ThemedView style={styles.container}>
      {!!error && <ThemedText type="small" style={styles.error}>{error}</ThemedText>}
      <FlatList
        data={users}
        keyExtractor={(u) => u.id}
        refreshing={loading}
        onRefresh={() => {
          setLoading(true);
          setReloadKey((k) => k + 1);
        }}
        ListEmptyComponent={!loading ? <ThemedText style={styles.empty}>No other users yet</ThemedText> : undefined}
        renderItem={({ item }) => (
          <Pressable onPress={() => openChat(item)}>
            <ThemedView type="backgroundElement" style={styles.row}>
              <ThemedText type="smallBold">{item.name}</ThemedText>
              {!!item.bio && <ThemedText type="small" themeColor="textSecondary">{item.bio}</ThemedText>}
            </ThemedView>
          </Pressable>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: { padding: Spacing.three, marginHorizontal: Spacing.three, marginTop: Spacing.two, borderRadius: Spacing.two },
  empty: { textAlign: 'center', marginTop: Spacing.five },
  error: { color: '#e5484d', padding: Spacing.three },
});
