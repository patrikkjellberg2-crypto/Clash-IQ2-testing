export type ClashIQNotificationOptions = {
  title?: string;
  body?: string;
  tag?: string;
};

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationsSupported()) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  return Notification.requestPermission();
}

export async function sendTestNotification(): Promise<{ ok: boolean; message: string }> {
  const permission = await requestNotificationPermission();
  if (permission === 'unsupported') {
    return { ok: false, message: 'Den här webbläsaren stöder inte notiser.' };
  }
  if (permission !== 'granted') {
    return { ok: false, message: 'Notistillstånd nekades. Tillåt notiser för Clash IQ i webbläsarens inställningar.' };
  }

  try {
    const notification = new Notification('⚔️ Clash IQ', {
      body: 'Notiser fungerar! Detta är ett test från Clash IQ.',
      tag: 'clash-iq-test',
      icon: '/favicon.ico',
    });
    window.setTimeout(() => notification.close(), 7000);
    return { ok: true, message: 'Testnotisen skickades.' };
  } catch {
    return { ok: false, message: 'Notisen kunde inte visas på den här enheten.' };
  }
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  return notificationsSupported() ? Notification.permission : 'unsupported';
}
