export function presentChatbotMessage(message: string): string {
  return message
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*/g, "")
    .replace(/`{1,3}/g, "")
    .trim();
}
