export type NotificationType =
  | "APPOINTMENT_CONFIRMED"
  | "APPOINTMENT_REMINDER"
  | "PAYMENT_SUCCESS"
  | "PROMOTION_CAMPAIGN"
  | "SYSTEM_ANNOUNCEMENT"
  | "MARKETING"
  | string;

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
  appointmentId?: string | null;
  targetId?: string | null;
  promotionId?: string | null;
}

export type NotificationCategoryFilter =
  | "ALL"
  | "UNREAD"
  | "APPOINTMENTS"
  | "PAYMENTS"
  | "PROMOTIONS";

export interface UnreadCountResponse {
  unreadCount: number;
}
