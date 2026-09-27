export type WarChatSource = 'war-planner' | 'war-log' | 'ai-coach' | 'manual';

export type WarChatMessage = {
  id: string;
  source: WarChatSource;
  title: string;
  body: string;
  createdAt: string;
};

const STORAGE_KEY = 'clashiq-war-chat-v1';

function readMessages(): WarChatMessage[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getWarChatMessages(): WarChatMessage[] {
  return readMessages();
}

export function publishWarChatMessage(
  message: Omit<WarChatMessage, 'id' | 'createdAt'>,
): WarChatMessage {
  const next: WarChatMessage = {
    ...message,
    id: typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `war-chat-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
  };

  const messages = [next, ...readMessages()].slice(0, 100);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  window.dispatchEvent(new Event('clashiq-war-chat-changed'));
  return next;
}

export function clearWarChatMessages(): void {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event('clashiq-war-chat-changed'));
}

export function removeWarChatMessage(id: string): void {
  const messages = readMessages().filter(message => message.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  window.dispatchEvent(new Event('clashiq-war-chat-changed'));
}
