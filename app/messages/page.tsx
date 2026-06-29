'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Send, ArrowLeft, AlertCircle } from 'lucide-react';
import AuthGuard from '@/components/shared/AuthGuard';
import { useAuth } from '@/lib/auth-context';
import { useRealtimeMessages } from '@/lib/useRealtimeMessages';
import { isOnline, formatLastActive, checkMessageSafety } from '@/lib/api';
import type { Database } from '@/lib/database.types';

type Message = Database['public']['Tables']['messages']['Row'];
type User = Database['public']['Tables']['users']['Row'];
type Match = Database['public']['Tables']['matches']['Row'];
type Photo = Database['public']['Tables']['photos']['Row'];

interface Conversation {
  match: Match;
  otherUser: User & { photos: Photo[] };
  lastMessage: Message | null;
  unreadCount: number;
}

export default function MessagesPage() {
  const { user, db } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [safetyWarning, setSafetyWarning] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, loading: messagesLoading } = useRealtimeMessages(selectedMatch);

  // Pre-select match from URL param (?match=uuid)
  useEffect(() => {
    const matchParam = searchParams.get('match');
    if (matchParam) setSelectedMatch(matchParam);
  }, [searchParams]);

  useEffect(() => { document.title = 'Messages | DateInIndia'; }, []);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }, [messages]);

  const loadConversations = useCallback(async () => {
    if (!user) return;

    const [outgoing, incoming] = await Promise.all([
      db.from('blocks').select('blocked_id').eq('blocker_id', user.id),
      db.from('blocks').select('blocker_id').eq('blocked_id', user.id),
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blockedSet = new Set([
      ...(outgoing.data || []).map((b: any) => b.blocked_id),
      ...(incoming.data || []).map((b: any) => b.blocker_id),
    ]);

    const { data: rawMatches } = await db
      .from('matches')
      .select('*')
      .or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id}`)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!rawMatches) { setLoading(false); return; }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filtered = (rawMatches as any[]).filter(m => {
      const otherId = m.user_1_id === user.id ? m.user_2_id : m.user_1_id;
      return !blockedSet.has(otherId);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const convos: Conversation[] = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filtered.map(async (match: any) => {
        const otherId = match.user_1_id === user.id ? match.user_2_id : match.user_1_id;
        const { data: otherUser } = await db.from('users').select('*, photos(*)').eq('id', otherId).single();
        const { data: msgs } = await db.from('messages').select('*').eq('match_id', match.id)
          .order('created_at', { ascending: false }).limit(1);
        const { count } = await db.from('messages').select('*', { count: 'exact', head: true })
          .eq('match_id', match.id).eq('is_read', false).neq('sender_id', user.id);
        return {
          match: match as Match,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          otherUser: otherUser as any,
          lastMessage: (msgs?.[0] || null) as Message | null,
          unreadCount: count || 0,
        };
      })
    );
    setConversations(convos);
    setLoading(false);
  }, [user, db]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Refresh conversation list when messages arrive (updates last message + unread badge)
  useEffect(() => {
    if (messages.length > 0) loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  async function sendMessage() {
    if (!user || !selectedMatch || !newMessage.trim()) return;
    const safety = checkMessageSafety(newMessage);
    if (!safety.safe) { setSafetyWarning(safety.reason || 'Message blocked.'); return; }
    setSafetyWarning('');
    setSending(true);
    const content = newMessage;
    setNewMessage('');
    await db.from('messages').insert({
      match_id: selectedMatch, sender_id: user.id,
      content, message_type: 'text', is_read: false,
    });
    // No manual reload needed — realtime subscription delivers the new message
    setSending(false);
  }

  const selectedConvo = conversations.find(c => c.match.id === selectedMatch);

  return (
    <AuthGuard>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 180px)', minHeight: 500 }}>
          <div className="flex h-full">
            {/* Conversation list */}
            <div className={`w-full lg:w-80 flex-shrink-0 border-r border-gray-100 flex flex-col ${selectedMatch ? 'hidden lg:flex' : 'flex'}`}>
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-display font-bold text-gray-900 mb-3">Messages</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input placeholder="Search conversations..." className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-orange-300" readOnly />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex gap-3 animate-pulse">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex-shrink-0" />
                        <div className="flex-1 space-y-2"><div className="h-4 bg-gray-100 rounded w-3/4" /><div className="h-3 bg-gray-100 rounded w-1/2" /></div>
                      </div>
                    ))}
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="text-4xl mb-3">💬</div>
                    <p className="text-gray-500 text-sm">No conversations yet.</p>
                    <p className="text-gray-400 text-xs mt-1">Like someone and get a mutual match to start chatting!</p>
                    <button onClick={() => router.push('/browse')} className="mt-4 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600">
                      Browse Members
                    </button>
                  </div>
                ) : conversations.map(({ match, otherUser, lastMessage, unreadCount }) => {
                  const photo = otherUser?.photos?.find(p => p.is_primary) || otherUser?.photos?.[0];
                  const online = otherUser ? isOnline(otherUser.last_active_at) : false;
                  return (
                    <button key={match.id} onClick={() => setSelectedMatch(match.id)}
                      className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left ${selectedMatch === match.id ? 'bg-orange-50' : ''}`}>
                      <div className="relative flex-shrink-0">
                        {photo ? (
                          <img src={`${photo.storage_url}?auto=compress&cs=tinysrgb&w=80`} alt={otherUser?.name} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 font-bold">
                            {otherUser?.name?.[0]}
                          </div>
                        )}
                        {online && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900 text-sm truncate">{otherUser?.name}</span>
                          {lastMessage && <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{new Date(lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500 truncate">{lastMessage?.content || 'Start the conversation!'}</p>
                          {unreadCount > 0 && <span className="ml-2 w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0 font-bold">{unreadCount}</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chat window */}
            <div className={`flex-1 flex flex-col ${!selectedMatch ? 'hidden lg:flex' : 'flex'}`}>
              {!selectedMatch ? (
                <div className="flex-1 flex items-center justify-center text-center p-8">
                  <div>
                    <div className="text-6xl mb-4">💬</div>
                    <h3 className="text-xl font-display font-bold text-gray-700 mb-2">Select a conversation</h3>
                    <p className="text-gray-400 text-sm">Choose a match from the left to start chatting</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                    <button onClick={() => setSelectedMatch(null)} className="lg:hidden mr-1"><ArrowLeft className="w-5 h-5 text-gray-500" /></button>
                    {selectedConvo && (() => {
                      const photo = selectedConvo.otherUser?.photos?.find(p => p.is_primary) || selectedConvo.otherUser?.photos?.[0];
                      const online = isOnline(selectedConvo.otherUser?.last_active_at || '');
                      return (
                        <>
                          <div className="relative flex-shrink-0">
                            {photo ? (
                              <img src={`${photo.storage_url}?auto=compress&cs=tinysrgb&w=80`} alt="" className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 font-bold text-sm">{selectedConvo.otherUser?.name?.[0]}</div>
                            )}
                            {online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />}
                          </div>
                          <div>
                            <button onClick={() => router.push(`/profile/${selectedConvo.otherUser?.id}`)} className="font-semibold text-gray-900 hover:text-orange-500">{selectedConvo.otherUser?.name}</button>
                            <p className="text-xs text-gray-400">{online ? 'Online now' : formatLastActive(selectedConvo.otherUser?.last_active_at || '')}</p>
                          </div>
                        </>
                      );
                    })()}
                    <div className="ml-auto">
                      <div className="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">
                        {selectedConvo?.match?.compatibility_score ? `${selectedConvo.match.compatibility_score}% match` : 'Matched'}
                      </div>
                    </div>
                  </div>

                  {selectedConvo?.match?.icebreakers && selectedConvo.match.icebreakers.length > 0 && messages.length === 0 && !messagesLoading && (
                    <div className="p-4 bg-orange-50 border-b border-orange-100">
                      <p className="text-xs font-medium text-orange-700 mb-2">Icebreaker suggestions:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedConvo.match.icebreakers.map((q, i) => (
                          <button key={i} onClick={() => setNewMessage(q)} className="text-xs bg-white text-orange-600 border border-orange-200 px-3 py-1.5 rounded-full hover:bg-orange-50">{q}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messagesLoading ? (
                      <div className="space-y-3 animate-pulse">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                            <div className="h-10 bg-gray-100 rounded-2xl w-40" />
                          </div>
                        ))}
                      </div>
                    ) : messages.map(msg => {
                      const isMine = msg.sender_id === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] ${isMine ? 'chat-bubble-sent' : 'chat-bubble-received'}`}>
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                            <div className={`flex items-center justify-end gap-1 mt-1 ${isMine ? 'text-orange-100' : 'text-gray-400'}`}>
                              <span className="text-xs">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {safetyWarning && (
                    <div className="mx-4 mb-2 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-red-700">Message blocked</p>
                        <p className="text-xs text-red-600 mt-0.5">{safetyWarning}</p>
                      </div>
                      <button onClick={() => setSafetyWarning('')} className="ml-auto text-red-400 hover:text-red-600 text-xs">✕</button>
                    </div>
                  )}

                  {selectedConvo && (() => {
                    const daysSinceMatch = (Date.now() - new Date(selectedConvo.match.created_at).getTime()) / (1000 * 60 * 60 * 24);
                    if (daysSinceMatch < 7) {
                      return <div className="mx-4 mb-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 text-xs text-blue-600">Phone numbers and social handles are blocked for the first 7 days for your safety.</div>;
                    }
                    return null;
                  })()}

                  <div className="p-4 border-t border-gray-100">
                    <div className="flex gap-3">
                      <input value={newMessage} onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        maxLength={1000} />
                      <button onClick={sendMessage} disabled={!newMessage.trim() || sending}
                        className="w-11 h-11 bg-orange-500 text-white rounded-xl flex items-center justify-center hover:bg-orange-600 disabled:opacity-50">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

