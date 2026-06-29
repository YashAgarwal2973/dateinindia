/// <reference lib="webworker" />

self.addEventListener('push', (event) => {
  const data = event.data?.json?.() ?? {};
  const title = data.title ?? 'DateInIndia';
  const options = {
    body: data.body ?? '',
    icon: data.icon ?? '/favicon.ico',
    badge: data.badge ?? '/favicon.ico',
    tag: data.tag ?? 'dateinindia',
    data: { url: data.url ?? '/' },
    requireInteraction: false,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if ('focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        return clients.openWindow(url);
      })
  );
});
