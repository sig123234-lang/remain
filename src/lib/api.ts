import type {
  AdminUser,
  AuthResult,
  ChatMessage,
  HistorySession,
  SessionStats,
} from "@/lib/types";
import { getApiBase } from "@/lib/config";

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

export async function login(username: string, password: string): Promise<AuthResult> {
  if (!API_BASE) {
    return fetchJson<AuthResult>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  }

  return fetchJson<AuthResult>(`${API_BASE}/auth/login`, {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function startSession(userId: string, token: string) {
  if (!API_BASE) {
    return fetchJson<{ sessionId: string }>("/api/session/start", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId }),
    });
  }

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
  history: ChatMessage[] = [],
) {
  if (!API_BASE) {
    return fetchJson<{ reply: string }>("/api/message", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId,
        sessionId,
        content,
        history,
        userMessage: content,
      }),
    });
  }

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
        history,
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
  if (!API_BASE) {
    return fetchJson<{ ok?: boolean }>("/api/session/end", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, sessionId }),
    });
  }

  return fetchJson<{ ok?: boolean }>(`${API_BASE}/session/end`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId, sessionId }),
  });
}

export async function getHistory(userId: string, token: string) {
  if (!API_BASE) {
    return fetchJson<{ sessions: HistorySession[] }>("/api/session/history", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId }),
    });
  }

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
