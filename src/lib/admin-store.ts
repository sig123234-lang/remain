import type { AdminUser } from "@/lib/types";

const users: AdminUser[] = [
  {
    id: "user-1",
    name: "김영희",
    username: "younghee",
    joinedAt: "2026-04-01",
    sessionCount: 12,
  },
  {
    id: "user-2",
    name: "박철수",
    username: "chulsoo",
    joinedAt: "2026-04-08",
    sessionCount: 7,
  },
];

export function listUsers() {
  return [...users];
}

export function addUser(payload: Omit<AdminUser, "id" | "joinedAt" | "sessionCount">) {
  const user: AdminUser = {
    id: `user-${Math.random().toString(36).slice(2, 10)}`,
    joinedAt: new Date().toISOString().slice(0, 10),
    sessionCount: 0,
    ...payload,
  };

  users.unshift(user);
  return user;
}

export function removeUser(userId: string) {
  const index = users.findIndex((user) => user.id === userId);

  if (index === -1) {
    return false;
  }

  users.splice(index, 1);
  return true;
}

export function hasUsername(username: string) {
  return users.some((user) => user.username === username);
}
