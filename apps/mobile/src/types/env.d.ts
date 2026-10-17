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
  export const GOOGLE_WEB_CLIENT_ID: string;
  export const GOOGLE_ANDROID_CLIENT_ID: string;
  export const GOOGLE_IOS_CLIENT_ID: string;
  /** Site key công khai WAU Captcha (pk_...), giống web bệnh nhân */
  export const NEXT_PUBLIC_WAU_CAPTCHA_SITE_KEY: string;
  /** Domain web bệnh nhân gửi kèm header Origin khi giải CAPTCHA, ví dụ http://localhost:3001 */
  export const NEXT_PUBLIC_WAU_CAPTCHA_ORIGIN: string;
}
