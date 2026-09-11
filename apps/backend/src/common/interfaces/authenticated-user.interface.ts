export interface AuthenticatedUser {
  userId: string;
  email: string;
  sessionId?: string;
  roles: string[];
  permissions: string[];
}
