import type { StoredAuth } from "@/lib/types";

const AUTH_KEY = "remain_auth";
const ADMIN_KEY = "remain_admin_token";

export function saveAuth(auth: StoredAuth) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

export function getStoredAuth(): StoredAuth | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export function clearAuth() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_KEY);
}

export function saveAdminToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(ADMIN_KEY, token);
}

export function getAdminToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage.getItem(ADMIN_KEY);
}

export function clearAdminToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(ADMIN_KEY);
}
