export type AuthResult = {
  token: string;
  userId: string;
  name: string;
};

export type StoredAuth = AuthResult & {
  username: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type SessionStats = {
  totalSessions: number;
  lastSessionDate: string | null;
};

export type HistorySession = {
  id: string;
  startedAt: string;
  summary: string;
  messageCount: number;
};

export type AdminUser = {
  id: string;
  name: string;
  username: string;
  joinedAt: string;
  sessionCount: number;
};
