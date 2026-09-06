import { api } from '~src/config';

export type AiChatSuggestion = {
  label: string;
  metadata?: Record<string, unknown>;
  type: 'date' | 'quick_reply' | 'service' | 'time_slot' | string;
  value: string;
};

export type AiChatHistoryItem = {
  content: string;
  metadata?: Record<string, unknown>;
  role: 'assistant' | 'user';
};

type AiChatResponse = {
  data?: AiChatResponse;
  reply?: string;
  suggestions?: AiChatSuggestion[];
};

type SendAiChatParams = {
  history: AiChatHistoryItem[];
  isLoggedIn: boolean;
  message: string;
  metadata?: Record<string, unknown>;
};

const unwrapChatResponse = (payload: unknown): AiChatResponse => {
  const root = (payload as { data?: unknown })?.data ?? payload;
  return (root as AiChatResponse) ?? {};
};

export async function sendAiChatMessage({
  history,
  isLoggedIn,
  message,
  metadata = {},
}: SendAiChatParams) {
  const body = {
    history,
    message,
    metadata,
  };

  try {
    if (isLoggedIn) {
      const response = await api.post('/chatbot-conversations/agent-chat', body);
      return unwrapChatResponse(response.data);
    }
  } catch {
    // Fallback to public AI chat if the authenticated agent route is unavailable.
  }

  const response = await api.post(
    '/chatbot-conversations/public-agent-chat',
    body,
  );
  return unwrapChatResponse(response.data);
}
