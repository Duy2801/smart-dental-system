import { useCallback, useEffect, useRef, useState } from 'react';
import { useSocket } from '~src/service/useSocket';
import {
  getCurrentSupportConversation,
  getSupportMessages,
  openSupportConversation,
  sendSupportMessage,
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
  const conversationRef = useRef<SupportConversation | null>(null);
  conversationRef.current = conversation;

  const joinConversation = useCallback(
    (conv: SupportConversation) => {
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
    try {
      const conv = await getCurrentSupportConversation();
      if (!conv) return;
      joinConversation(conv);
      const history = await getSupportMessages(conv.id);
      setMessages(history);
    } finally {
      setLoading(false);
    }
  }, [joinConversation]);

  const send = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      setSending(true);
      try {
        let conv = conversationRef.current;
        if (!conv) {
          // First message ever: this is what actually creates the
          // conversation and (server-side) triggers auto-assign/notifies
          // staff — not the earlier act of opening the chat screen.
          conv = await openSupportConversation();
          joinConversation(conv);
        }
        await sendSupportMessage(conv.id, trimmed);
      } finally {
        setSending(false);
      }
    },
    [joinConversation],
  );

  useEffect(() => {
    if (!socket) return;

    function onMessage(message: SupportMessage) {
      if (conversationRef.current?.id !== message.conversationId) return;
      setMessages(prev =>
        prev.some(m => m.id === message.id) ? prev : [...prev, message],
      );
    }

    function onAssigned(updated: SupportConversation) {
      if (conversationRef.current?.id !== updated.id) return;
      setConversation(updated);
    }

    function onClosed(payload: { conversationId: string }) {
      if (conversationRef.current?.id !== payload.conversationId) return;
      setConversation(prev => (prev ? { ...prev, status: 'CLOSED' } : prev));
    }

    socket.on('support:message', onMessage);
    socket.on('support:assigned', onAssigned);
    socket.on('support:closed', onClosed);

    return () => {
      socket.off('support:message', onMessage);
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

  return { conversation, loading, messages, send, sending, start };
}
