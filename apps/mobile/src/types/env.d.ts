/**
 * Type declarations for @env (react-native-dotenv)
 * Các biến này được đọc trực tiếp từ file .env lúc Metro bundle
 * → Đổi .env rồi restart Metro là có hiệu lực, KHÔNG cần rebuild native
 */
declare module '@env' {
  export const NEXT_PUBLIC_API_URL: string;
  export const BACKEND_URL: string;
  export const NEXT_PUBLIC_AI_SERVICE_URL: string;
  export const NEXT_PUBLIC_GOOGLE_CLIENT_ID: string;
}
