import apiClient from "@/src/lib/api/client";

export type SupportConversationStatus = "WAITING" | "ASSIGNED" | "CLOSED";
export type SupportMessageSender = "PATIENT" | "STAFF" | "SYSTEM";

export type SupportConversation = {
  id: string;
  patientId: string;
  status: SupportConversationStatus;
  assignedToId: string | null;
  assignedAt: string | null;
  lastMessageAt: string;
  createdAt: string;
  closedAt: string | null;
  patient: { id: string; fullName: string | null; phone: string | null; email: string | null };
  assignedTo: { id: string; fullName: string } | null;
  unreadCount?: number;
};

export type SupportMessage = {
  id: string;
  conversationId: string;
  senderType: SupportMessageSender;
  senderId: string | null;
  content: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  attachmentMime: string | null;
  replyToId: string | null;
  replyPreview: string | null;
  replySenderType: SupportMessageSender | null;
  readAt: string | null;
  createdAt: string;
};

export async function listUnclaimedConversations(): Promise<SupportConversation[]> {
  const response = await apiClient.get<SupportConversation[]>("/support-conversations/unclaimed");
  return response.data;
}

export async function listMyConversations(): Promise<SupportConversation[]> {
  const response = await apiClient.get<SupportConversation[]>("/support-conversations/mine");
  return response.data;
}

export async function claimConversation(id: string): Promise<SupportConversation> {
  const response = await apiClient.post<SupportConversation>(`/support-conversations/${id}/claim`);
  return response.data;
}

export async function getConversationMessages(id: string): Promise<SupportMessage[]> {
  const response = await apiClient.get<SupportMessage[]>(`/support-conversations/${id}/messages`);
  return response.data;
}

export async function sendConversationMessage(
  id: string,
  content: string,
  replyToId?: string,
): Promise<SupportMessage> {
  const response = await apiClient.post<SupportMessage>(
    `/support-conversations/${id}/messages`,
    { content, replyToId },
  );
  return response.data;
}

export async function sendConversationAttachment(id: string, file: File, replyToId?: string): Promise<SupportMessage> {
  const form = new FormData();
  form.append('file', file);
  if (replyToId) form.append('replyToId', replyToId);
  const response = await apiClient.post<SupportMessage>(
    `/support-conversations/${id}/attachments`, form,
    { headers: { 'Content-Type': undefined } },
  );
  return response.data;
}

export async function markConversationRead(id: string): Promise<void> {
  await apiClient.patch(`/support-conversations/${id}/read`);
}

export async function closeConversation(id: string): Promise<SupportConversation> {
  const response = await apiClient.post<SupportConversation>(`/support-conversations/${id}/close`);
  return response.data;
}
