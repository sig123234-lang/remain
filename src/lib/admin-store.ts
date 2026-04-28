import type { AdminUser } from "@/lib/types";

type StoredUser = AdminUser & {
  password: string;
};

const users: StoredUser[] = [
  {
    id: "user-1",
    name: "김영희",
    username: "younghee",
    joinedAt: "2026-04-01",
    sessionCount: 12,
    password: "younghee1234",
  },
  {
    id: "user-2",
    name: "박철수",
    username: "chulsoo",
    joinedAt: "2026-04-08",
    sessionCount: 7,
    password: "chulsoo1234",
  },
];

function toSafeUser(user: StoredUser): AdminUser {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    joinedAt: user.joinedAt,
    sessionCount: user.sessionCount,
  };
}

export function listUsers() {
  return users.map(toSafeUser);
}

export function addUser(
  payload: Omit<StoredUser, "id" | "joinedAt" | "sessionCount">,
) {
  const user: StoredUser = {
    id: `user-${Math.random().toString(36).slice(2, 10)}`,
    joinedAt: new Date().toISOString().slice(0, 10),
    sessionCount: 0,
    ...payload,
  };

  users.unshift(user);
  return toSafeUser(user);
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

export function authenticateUser(username: string, password: string) {
  const user = users.find(
    (entry) => entry.username === username && entry.password === password,
  );

  if (!user) {
    return null;
  }

  return toSafeUser(user);
}

export function findUserById(userId: string) {
  const user = users.find((entry) => entry.id === userId);
  return user ? toSafeUser(user) : null;
}
