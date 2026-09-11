import axios from 'axios';
import { NEXT_PUBLIC_AI_SERVICE_URL } from '@env';
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

export type AiChatResponse = {
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

const AI_SERVICE_FALLBACK_URL = (
  NEXT_PUBLIC_AI_SERVICE_URL
).replace(/\/$/, '');

const unwrapChatResponse = (payload: unknown): AiChatResponse => {
  if (!payload || typeof payload !== 'object') {
    return {};
  }
  const anyPayload = payload as Record<string, any>;
  const data = anyPayload.data?.data ?? anyPayload.data ?? anyPayload;
  return {
    reply: data?.reply || anyPayload?.reply || '',
    suggestions: data?.suggestions || anyPayload?.suggestions || [],
    data,
  };
};

export async function sendAiChatMessage({
  history,
  isLoggedIn,
  message,
  metadata = {},
}: SendAiChatParams): Promise<AiChatResponse> {
  const body = {
    history,
    message,
    metadata,
  };

  // 1. First priority: Backend Agent Chat (authenticated if logged in)
  if (isLoggedIn) {
    try {
      const response = await api.post('/chatbot-conversations/agent-chat', body, {
        timeout: 45000,
      });
      const parsed = unwrapChatResponse(response.data);
      if (parsed.reply) {
        return parsed;
      }
    } catch {
      // If agent-chat fails (401, timeout, etc.), continue to public endpoints
    }
  }

  // 2. Second priority: Backend Public Agent Chat
  try {
    const response = await api.post(
      '/chatbot-conversations/public-agent-chat',
      body,
      { timeout: 45000 },
    );
    const parsed = unwrapChatResponse(response.data);
    if (parsed.reply) {
      return parsed;
    }
  } catch {
    // If backend proxy fails or times out, fallback to direct AI microservice
  }

  // 3. Third priority: Direct AI microservice fallback (ultra-fast & bypasses backend proxy)
  try {
    const directResponse = await axios.post(
      `${AI_SERVICE_FALLBACK_URL}/api/v1/chatbot/agent-chat`,
      body,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'dev-local-key',
        },
        timeout: 45000,
      },
    );
    const parsed = unwrapChatResponse(directResponse.data);
    if (parsed.reply) {
      return parsed;
    }
  } catch {
    // Both backend and direct AI microservice failed
  }

  // 4. Graceful fallback message so the user is never stranded with an error screen
  return {
    reply:
      'Dạ hiện tại máy chủ AI đang nhận lượng lớn yêu cầu nên phản hồi chậm. Quý khách có thể chọn nhanh câu hỏi gợi ý bên dưới hoặc liên hệ Hotline 1900 1234 để được tư vấn viên hỗ trợ ngay lập tức ạ!',
    suggestions: [
      {
        type: 'quick_reply',
        label: 'Đặt lịch khám',
        value: 'Tôi muốn đặt lịch khám',
      },
      {
        type: 'quick_reply',
        label: 'Xem bảng giá dịch vụ',
        value: 'Cho tôi xem bảng giá dịch vụ',
      },
      {
        type: 'quick_reply',
        label: 'Giờ làm việc phòng khám',
        value: 'Giờ làm việc phòng khám',
      },
    ],
  };
}
