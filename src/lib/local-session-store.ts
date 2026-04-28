import type { ChatMessage, HistorySession } from "@/lib/types";

type SessionRecord = {
  id: string;
  userId: string;
  startedAt: string;
  endedAt: string | null;
  messages: ChatMessage[];
  summary: string;
};

declare global {
  var __remainSessions: Map<string, SessionRecord> | undefined;
}

const sessions = globalThis.__remainSessions ?? new Map<string, SessionRecord>();

if (!globalThis.__remainSessions) {
  globalThis.__remainSessions = sessions;
}

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildSummary(session: SessionRecord) {
  const userMessages = session.messages.filter((message) => message.role === "user");
  const text = userMessages
    .slice(0, 2)
    .map((message) => message.content.trim())
    .filter(Boolean)
    .join(" / ");

  if (!text) {
    return "오늘 나눈 이야기를 기록하고 있어요.";
  }

  return text.length > 80 ? `${text.slice(0, 80)}...` : text;
}

export function createSession(userId: string) {
  const session: SessionRecord = {
    id: makeId("session"),
    userId,
    startedAt: new Date().toISOString(),
    endedAt: null,
    messages: [],
    summary: "오늘 나눈 이야기를 기록하고 있어요.",
  };

  sessions.set(session.id, session);
  return session;
}

export function getSession(sessionId: string) {
  return sessions.get(sessionId) ?? null;
}

export function addSessionMessage(
  sessionId: string,
  message: Pick<ChatMessage, "role" | "content">,
) {
  const session = sessions.get(sessionId);
  if (!session) {
    return null;
  }

  session.messages.push({
    id: makeId(message.role),
    role: message.role,
    content: message.content,
    createdAt: new Date().toISOString(),
  });
  session.summary = buildSummary(session);
  return session;
}

export function endSessionRecord(userId: string, sessionId: string) {
  const session = sessions.get(sessionId);
  if (!session || session.userId !== userId) {
    return false;
  }

  session.endedAt = new Date().toISOString();
  return true;
}

export function listUserSessions(userId: string): HistorySession[] {
  return [...sessions.values()]
    .filter((session) => session.userId === userId)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .map((session) => ({
      id: session.id,
      startedAt: session.startedAt,
      summary: session.summary,
      messageCount: session.messages.length,
    }));
}

export function getRecentMessages(sessionId: string, limit = 12) {
  const session = sessions.get(sessionId);
  if (!session) {
    return [];
  }

  return session.messages.slice(-limit);
}
