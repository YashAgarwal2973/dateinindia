'use client';

import { useEffect } from 'react';
import { registerServiceWorker, requestNotificationPermission } from '@/lib/notifications';
import { useNotifications } from '@/lib/useNotifications';

export function NotificationBootstrap() {
  useEffect(() => {
    registerServiceWorker();
    // Delay permission prompt slightly so it doesn't fire immediately on landing
    const t = setTimeout(() => requestNotificationPermission(), 3000);
    return () => clearTimeout(t);
  }, []);

  useNotifications();

  return null;
}
