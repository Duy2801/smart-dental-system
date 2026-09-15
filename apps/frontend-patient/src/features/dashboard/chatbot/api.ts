import apiClient from "@/lib/axios";
import {
  buildRequestHistory,
  parseHistory,
  parseReply,
  type ChatMessage,
} from "./model";

const HISTORY_PATH = "/chatbot-conversations/history";
export const chatApi = {
  async send(
    message: string,
    history: ChatMessage[],
    metadata: Record<string, unknown>,
    authenticated: boolean,
    signal: AbortSignal,
  ) {
    const endpoint = authenticated
      ? "/chatbot-conversations/agent-chat"
      : "/chatbot-conversations/public-agent-chat";
    return parseReply(
      await apiClient.post(
        endpoint,
        { message, history: buildRequestHistory(history), metadata },
        { signal },
      ),
    );
  },
  async load(signal: AbortSignal) {
    return parseHistory(await apiClient.get(HISTORY_PATH, { signal }));
  },
  async save(messages: ChatMessage[], signal: AbortSignal) {
    await apiClient.put(HISTORY_PATH, { messages }, { signal });
  },
  async clear(signal: AbortSignal) {
    await apiClient.delete(HISTORY_PATH, { signal });
  },
};
