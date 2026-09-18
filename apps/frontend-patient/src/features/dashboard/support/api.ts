import apiClient from "@/lib/axios";

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
};

export type SupportMessage = {
  id: string;
  conversationId: string;
  senderType: SupportMessageSender;
  senderId: string | null;
  content: string;
  readAt: string | null;
  createdAt: string;
};

export async function openSupportConversation(): Promise<SupportConversation> {
  const response = await apiClient.post<SupportConversation>("/support-conversations");
  return response.data;
}

/**
 * Peeks at the patient's currently open conversation without creating one —
 * safe to call when the chat panel opens so browsing to the "Nhắn tin lễ
 * tân" tab doesn't by itself create a row or notify staff.
 */
export async function getCurrentSupportConversation(): Promise<SupportConversation | null> {
  const response = await apiClient.get<SupportConversation | null>("/support-conversations/current");
  return response.data;
}

export async function getSupportMessages(conversationId: string): Promise<SupportMessage[]> {
  const response = await apiClient.get<SupportMessage[]>(
    `/support-conversations/${conversationId}/messages`,
  );
  return response.data;
}

export async function sendSupportMessage(
  conversationId: string,
  content: string,
): Promise<SupportMessage> {
  const response = await apiClient.post<SupportMessage>(
    `/support-conversations/${conversationId}/messages`,
    { content },
  );
  return response.data;
}
