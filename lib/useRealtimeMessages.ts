'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './auth-context';
import { sendNotification } from './notifications';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Database } from './database.types';

type Message = Database['public']['Tables']['messages']['Row'];

export function useRealtimeMessages(matchId: string | null) {
  const { user, db } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const markRead = useCallback(async (mid: string) => {
    if (!user) return;
    await db
      .from('messages')
      .update({ is_read: true })
      .eq('match_id', mid)
      .neq('sender_id', user.id);
  }, [user, db]);

  useEffect(() => {
    if (!matchId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    let alive = true;
    setLoading(true);

    async function setup() {
      // Fetch initial batch
      const { data } = await db
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (!alive) return;
      setMessages(data || []);
      setLoading(false);
      if (user) markRead(matchId!);

      // Tear down any previous channel before subscribing
      if (channelRef.current) {
        await db.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      const channel: RealtimeChannel = db
        .channel(`messages:match_id=eq.${matchId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `match_id=eq.${matchId}`,
          },
          (payload: RealtimePostgresChangesPayload<Message>) => {
            if (!alive) return;
            const incoming = payload.new as Message;
            setMessages(prev => {
              // Avoid duplicates (optimistic inserts may already be in state)
              if (prev.some(m => m.id === incoming.id)) return prev;
              return [...prev, incoming];
            });
            markRead(matchId!);
            // Notify if the message is from the other person (not ourselves)
            if (incoming.sender_id !== user?.id) {
              sendNotification('New message', {
                body: incoming.content?.substring(0, 80) ?? 'Sent you a message',
                tag: `msg-${incoming.match_id}`,
                url: `/messages?match=${incoming.match_id}`,
              });
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `match_id=eq.${matchId}`,
          },
          (payload: RealtimePostgresChangesPayload<Message>) => {
            if (!alive) return;
            setMessages(prev =>
              prev.map(m => m.id === (payload.new as Message).id ? payload.new as Message : m)
            );
          }
        )
        .subscribe();

      channelRef.current = channel;
    }

    setup();

    return () => {
      alive = false;
      if (channelRef.current) {
        db.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [matchId, db, user, markRead]);

  return { messages, loading, markRead };
}
