export type ClashIQNotificationOptions = {
  title?: string;
  body?: string;
  tag?: string;
};

const SERVICE_WORKER_URL = '/clash-iq-sw.js';

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

export async function registerNotificationServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register(SERVICE_WORKER_URL, { scope: '/' });
  } catch {
    return null;
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationsSupported()) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  return Notification.requestPermission();
}

export async function sendTestNotification(): Promise<{ ok: boolean; message: string }> {
  const permission = await requestNotificationPermission();
  if (permission === 'unsupported') {
    return { ok: false, message: 'Den här Android-miljön stöder inte web-notiser.' };
  }
  if (permission !== 'granted') {
    return { ok: false, message: 'Notistillstånd nekades. Tillåt notiser för Clash IQ i Android/webbläsarens inställningar.' };
  }

  const registration = await registerNotificationServiceWorker();
  if (!registration) {
    return { ok: false, message: 'Clash IQ:s notification service worker kunde inte startas.' };
  }

  try {
    await navigator.serviceWorker.ready;
    const worker = navigator.serviceWorker.controller;
    if (worker) {
      worker.postMessage({ type: 'CLASH_IQ_TEST_NOTIFICATION' });
    } else {
      const active = (await navigator.serviceWorker.ready).active;
      active?.postMessage({ type: 'CLASH_IQ_TEST_NOTIFICATION' });
    }
    return { ok: true, message: 'Testnotisen skickades via Clash IQ:s service worker.' };
  } catch {
    return { ok: false, message: 'Service worker-notisen kunde inte visas på den här enheten.' };
  }
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  return notificationsSupported() ? Notification.permission : 'unsupported';
}


export async function sendClashIQNotification(
  title: string,
  body: string,
  tag: string,
): Promise<boolean> {
  if (!notificationsSupported() || Notification.permission !== 'granted') return false;
  const registration = await registerNotificationServiceWorker();
  if (!registration) return false;
  const worker = (await navigator.serviceWorker.ready).active;
  if (!worker) return false;
  worker.postMessage({ type: 'CLASH_IQ_PUSH_NOTIFICATION', title, body, tag });
  return true;
}
