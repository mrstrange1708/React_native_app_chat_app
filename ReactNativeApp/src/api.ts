export const BASE_URL = 'http://10.7.1.51:3000';

export type User = { id: string; name: string; bio?: string };
export type Conversation = { id: string; name?: string; type: 'DM' | 'GROUP'; participants_ids: string[] };
export type Message = { id: string; content: string; createdAt: string; senderId: string; conversationId: string };
export type MessagePage = { data: Message[]; nextCursor?: string | null; count: number };

// ponytail: credentials live in memory only, so a reload logs you out. Add expo-secure-store if that matters.
let auth = '';

// The backend expects the raw `Basic <username>:<password>` header (not base64), per /docs-json.
export function setCredentials(username: string, password: string) {
  auth = `Basic ${username}:${password}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE_URL + path, {
    ...init,
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

export const api = {
  me: () => request<User>('/user/profile'),
  users: () => request<User[]>('/user'),
  openDm: (recipient_id: string) =>
    request<Conversation>('/conversation', { method: 'POST', body: JSON.stringify({ recipient_id }) }),
  messages: (conversation_id: string, cursor?: string) =>
    request<MessagePage>(
      `/message?conversation_id=${conversation_id}` + (cursor ? `&from_message_cursor=${cursor}` : '')
    ),
  send: (conversation_id: string, content: string) =>
    request<Message>('/message', { method: 'POST', body: JSON.stringify({ conversation_id, content }) }),
};
