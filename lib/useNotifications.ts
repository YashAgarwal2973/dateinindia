'use client';

import { useEffect } from 'react';
import { useAuth } from './auth-context';
import { sendNotification } from './notifications';

export function useNotifications() {
  const { db, user } = useAuth();

  useEffect(() => {
    if (!user || !db) return;

    // New likes — filter by liked_id is supported by Realtime
    const likesChannel = db
      .channel(`notif:likes:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'likes',
          filter: `liked_id=eq.${user.id}`,
        },
        () => {
          sendNotification('Someone liked your profile!', {
            body: 'Go to Likes to see who it is.',
            tag: 'new-like',
            url: '/likes',
          });
        }
      )
      .subscribe();

    // New messages — RLS on the authenticated client restricts events to
    // messages in matches the user participates in; filter client-side for
    // messages we didn't send ourselves.
    const messagesChannel = db
      .channel(`notif:messages:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const msg = payload.new as any;
          if (msg.sender_id === user.id) return;
          sendNotification('New message', {
            body: msg.content?.substring(0, 80) ?? 'Sent you a message',
            tag: `msg-${msg.match_id}`,
            url: `/messages?match=${msg.match_id}`,
          });
        }
      )
      .subscribe();

    return () => {
      db.removeChannel(likesChannel);
      db.removeChannel(messagesChannel);
    };
  }, [user, db]);
}
