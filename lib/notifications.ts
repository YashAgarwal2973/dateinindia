'use client';

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | undefined> {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return reg;
  } catch {
    // SW registration failing is non-fatal
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function sendNotification(title: string, options?: NotificationOptions & { url?: string }): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const { url, ...notifOptions } = options ?? {};
  const payload: NotificationOptions = { icon: '/favicon.ico', ...notifOptions };

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(reg => reg.showNotification(title, { ...payload, data: { url } }))
      .catch(() => new Notification(title, payload));
  } else {
    const n = new Notification(title, payload);
    if (url) n.onclick = () => { window.focus(); window.location.href = url; };
  }
}
