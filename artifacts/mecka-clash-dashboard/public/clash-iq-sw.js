self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'CLASH_IQ_PUSH_NOTIFICATION') {
    event.waitUntil(
      self.registration.showNotification(event.data.title || '⚔️ Clash IQ', {
        body: event.data.body || '',
        tag: event.data.tag || 'clash-iq-notification',
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        data: { url: '/' },
      }),
    );
  }

  if (event.data?.type === 'CLASH_IQ_TEST_NOTIFICATION') {
    event.waitUntil(
      self.registration.showNotification('⚔️ Clash IQ', {
        body: 'Notiser fungerar! Detta är ett test från Clash IQ.',
        tag: 'clash-iq-test',
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        data: { url: '/' },
      }),
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => 'focus' in client);
      if (existing) return existing.focus();
      return self.clients.openWindow(event.notification.data?.url || '/');
    }),
  );
});
