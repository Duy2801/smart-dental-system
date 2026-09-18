import { api } from '~src/config';

export type SupportConversationStatus = 'WAITING' | 'ASSIGNED' | 'CLOSED';
export type SupportMessageSender = 'PATIENT' | 'STAFF' | 'SYSTEM';

export type SupportConversation = {
  assignedAt: string | null;
  assignedTo: { fullName: string; id: string } | null;
  assignedToId: string | null;
  closedAt: string | null;
  createdAt: string;
  id: string;
  lastMessageAt: string;
  patient: {
    email: string | null;
    fullName: string | null;
    id: string;
    phone: string | null;
  };
  patientId: string;
  status: SupportConversationStatus;
};

export type SupportMessage = {
  content: string;
  conversationId: string;
  createdAt: string;
  id: string;
  readAt: string | null;
  senderId: string | null;
  senderType: SupportMessageSender;
};

export async function openSupportConversation(): Promise<SupportConversation> {
  const response = await api.post('/support-conversations');
  return response.data.data;
}

/**
 * Peeks at the patient's currently open conversation without creating one —
 * safe to call when the chat screen opens so it doesn't by itself create a
 * row or notify staff.
 */
export async function getCurrentSupportConversation(): Promise<SupportConversation | null> {
  const response = await api.get('/support-conversations/current');
  return response.data.data ?? null;
}

export async function getSupportMessages(
  conversationId: string,
): Promise<SupportMessage[]> {
  const response = await api.get(
    `/support-conversations/${conversationId}/messages`,
  );
  return response.data.data ?? [];
}

export async function sendSupportMessage(
  conversationId: string,
  content: string,
): Promise<SupportMessage> {
  const response = await api.post(
    `/support-conversations/${conversationId}/messages`,
    { content },
  );
  return response.data.data;
}
