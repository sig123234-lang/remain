import type {
  AdminUser,
  AuthResult,
  HistorySession,
  SessionStats,
} from "@/lib/types";
import { assertApiConfigured, canUseDemoMode, getApiBase } from "@/lib/config";

const API_BASE = getApiBase();

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || "요청에 실패했습니다.");
  }

  return (await response.json()) as T;
}

function mockReply(content: string) {
  if (content === "__START_SESSION__") {
    return "안녕하세요. 오늘 어떤 이야기를 나눠볼까요?";
  }

  if (content.includes("학교")) {
    return "학교 다니실 때 기억나는 풍경이 있으세요?";
  }

  if (content.includes("가족")) {
    return "가족분들과 계실 때 가장 따뜻했던 순간은 언제셨어요?";
  }

  return "그 이야기를 조금 더 들려주실 수 있으세요?";
}

export async function login(username: string, password: string): Promise<AuthResult> {
  if (!API_BASE && canUseDemoMode()) {
    return fetchJson<AuthResult>("/api/demo/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  }

  assertApiConfigured();

  return fetchJson<AuthResult>(`${API_BASE}/auth/login`, {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function startSession(userId: string, token: string) {
  if (!API_BASE && canUseDemoMode()) {
    return { sessionId: makeId("session") };
  }

  assertApiConfigured();

  return fetchJson<{ sessionId: string }>(`${API_BASE}/session/start`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId }),
  });
}

export async function sendMessage(
  userId: string,
  sessionId: string,
  content: string,
  token: string,
) {
  if (!API_BASE && canUseDemoMode()) {
    return {
      reply: mockReply(content),
    };
  }

  assertApiConfigured();

  const result = await fetchJson<{ message?: string; reply?: string }>(
    `${API_BASE}/message`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId,
        sessionId,
        content,
        userMessage: content,
      }),
    },
  );

  return {
    reply: result.reply ?? result.message ?? "",
  };
}

export async function endSession(
  userId: string,
  sessionId: string,
  token: string,
) {
  if (!API_BASE && canUseDemoMode()) {
    return { ok: true };
  }

  assertApiConfigured();

  return fetchJson<{ ok?: boolean }>(`${API_BASE}/session/end`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId, sessionId }),
  });
}

export async function getHistory(userId: string, token: string) {
  if (!API_BASE && canUseDemoMode()) {
    const now = new Date();
    const sessions: HistorySession[] = [
      {
        id: "demo-1",
        startedAt: now.toISOString(),
        summary: "어린 시절 살던 동네와 학교 이야기를 나눴어요.",
        messageCount: 14,
      },
      {
        id: "demo-2",
        startedAt: new Date(now.getTime() - 86400000).toISOString(),
        summary: "가족과 함께 보낸 명절의 기억을 떠올렸어요.",
        messageCount: 11,
      },
    ];

    return { sessions };
  }

  assertApiConfigured();

  const result = await fetchJson<{
    sessions: Array<{
      id?: string;
      sessionId?: string;
      started_at?: string;
      startedAt?: string;
      summary?: string;
      message_count?: number;
      messageCount?: number;
    }>;
  }>(`${API_BASE}/session/history`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId }),
  });

  return {
    sessions: result.sessions.map((session) => ({
      id: session.id ?? session.sessionId ?? makeId("session"),
      startedAt: session.startedAt ?? session.started_at ?? new Date().toISOString(),
      summary: session.summary ?? "요약이 아직 없어요.",
      messageCount: session.messageCount ?? session.message_count ?? 0,
    })),
  };
}

export async function getSessionStats(userId: string, token: string) {
  const history = await getHistory(userId, token);
  const first = history.sessions[0];
  const stats: SessionStats = {
    totalSessions: history.sessions.length,
    lastSessionDate: first?.startedAt ?? null,
  };

  return stats;
}

export async function adminLogin(username: string, password: string) {
  return fetchJson<{ token: string }>("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function getAdminUsers(token: string) {
  return fetchJson<{ users: AdminUser[] }>("/api/admin/users", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function createAdminUser(
  token: string,
  payload: { name: string; username: string; password: string },
) {
  return fetchJson<{ user: AdminUser }>("/api/admin/users", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminUser(token: string, userId: string) {
  return fetchJson<{ ok: boolean }>("/api/admin/users", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId }),
  });
}
