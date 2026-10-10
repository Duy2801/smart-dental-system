import { useCallback, useEffect, useRef, useState } from 'react';
import { useSocket } from '~src/service/useSocket';
import {
  getCurrentSupportConversation,
  getSupportMessages,
  openSupportConversation,
  sendSupportMessage,
  sendSupportAttachment,
  type SupportConversation,
  type SupportMessage,
} from './api';

export function useSupportChat() {
  const { socket } = useSocket();
  const [conversation, setConversation] = useState<SupportConversation | null>(
    null,
  );
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversationRef = useRef<SupportConversation | null>(null);

  const joinConversation = useCallback(
    (conv: SupportConversation) => {
      conversationRef.current = conv;
      setConversation(conv);
      socket?.emit('support:join', { conversationId: conv.id });
    },
    [socket],
  );

  // Resumes an existing WAITING/ASSIGNED conversation if the patient already
  // has one — never creates a new one, so just opening the chat screen
  // doesn't produce an empty conversation nobody asked to start.
  const start = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const conv = await getCurrentSupportConversation();
      if (!conv) return;
      joinConversation(conv);
      const history = await getSupportMessages(conv.id);
      setMessages(prev => [
        ...history,
        ...prev.filter(item => item.conversationId === conv.id && !history.some(old => old.id === item.id)),
      ]);
    } catch (cause) {
      setError('Không tải được hội thoại. Vui lòng thử lại.');
      throw cause;
    } finally {
      setLoading(false);
    }
  }, [joinConversation]);

  const send = useCallback(
    async (content: string, replyToId?: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      setSending(true);
      setError(null);
      try {
        let conv = conversationRef.current;
        if (!conv) {
          // First message ever: this is what actually creates the
          // conversation and (server-side) triggers auto-assign/notifies
          // staff — not the earlier act of opening the chat screen.
          conv = await openSupportConversation();
          joinConversation(conv);
        }
        const message = await sendSupportMessage(conv.id, trimmed, replyToId);
        setMessages(prev => prev.some(item => item.id === message.id) ? prev : [...prev, message]);
      } catch (cause) {
        setError('Không gửi được tin nhắn. Vui lòng thử lại.');
        throw cause;
      } finally {
        setSending(false);
      }
    },
    [joinConversation],
  );

  const sendAttachment = useCallback(async (file: { uri: string; name: string; type: string }, replyToId?: string) => {
    setSending(true);
    setError(null);
    try {
      let conv = conversationRef.current;
      if (!conv) {
        conv = await openSupportConversation();
        joinConversation(conv);
      }
      const message = await sendSupportAttachment(conv.id, file, replyToId);
      setMessages(prev => prev.some(item => item.id === message.id) ? prev : [...prev, message]);
    } catch (cause) {
      setError('Không gửi được tệp. Vui lòng thử lại.');
      throw cause;
    } finally {
      setSending(false);
    }
  }, [joinConversation]);

  useEffect(() => {
    if (!socket) return;

    function onConnect() {
      const conv = conversationRef.current;
      if (!conv) return;
      socket?.emit('support:join', { conversationId: conv.id });
      getSupportMessages(conv.id).then(history => {
        setMessages(prev => [
          ...history,
          ...prev.filter(item => item.conversationId === conv.id && !history.some(old => old.id === item.id)),
        ]);
      }).catch(() => {});
    }

    function onMessage(message: SupportMessage) {
      if (conversationRef.current?.id !== message.conversationId) return;
      setMessages(prev =>
        prev.some(m => m.id === message.id) ? prev : [...prev, message],
      );
    }

    function onAssigned(updated: SupportConversation) {
      if (conversationRef.current?.id !== updated.id) return;
      conversationRef.current = updated;
      setConversation(updated);
    }

    function onClosed(payload: { conversationId: string }) {
      if (conversationRef.current?.id !== payload.conversationId) return;
      conversationRef.current = { ...conversationRef.current, status: 'CLOSED' };
      setConversation(prev => (prev ? { ...prev, status: 'CLOSED' } : prev));
    }

    socket.on('support:message', onMessage);
    socket.on('connect', onConnect);
    socket.on('support:assigned', onAssigned);
    socket.on('support:closed', onClosed);
    if (socket.connected) onConnect();

    return () => {
      socket.off('support:message', onMessage);
      socket.off('connect', onConnect);
      socket.off('support:assigned', onAssigned);
      socket.off('support:closed', onClosed);
    };
  }, [socket]);

  useEffect(() => {
    return () => {
      const conv = conversationRef.current;
      if (conv) socket?.emit('support:leave', { conversationId: conv.id });
    };
  }, [socket]);

  return { conversation, loading, messages, send, sendAttachment, sending, error, start };
}
