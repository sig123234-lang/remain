"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import {
  adminLogin,
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
} from "@/lib/api";
import {
  clearAdminToken,
  getAdminToken,
  saveAdminToken,
} from "@/lib/auth";
import type { AdminUser } from "@/lib/types";

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(() => getAdminToken());
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [form, setForm] = useState({ name: "", username: "", password: "" });

  useEffect(() => {
    if (!token) {
      return;
    }

    getAdminUsers(token)
      .then((result) => setUsers(result.users))
      .catch(() => {
        setError("관리자 데이터를 불러오지 못했어요.");
      });
  }, [token]);

  async function handleAdminLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await adminLogin(credentials.username, credentials.password);
      saveAdminToken(result.token);
      setToken(result.token);
    } catch {
      setError("관리자 로그인에 실패했어요.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      return;
    }

    setError("");

    try {
      const result = await createAdminUser(token, form);
      setUsers((prev) => [result.user, ...prev]);
      setForm({ name: "", username: "", password: "" });
    } catch (createError) {
      const message =
        createError instanceof Error ? createError.message : "사용자를 만들지 못했어요.";
      setError(message);
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!token) {
      return;
    }

    const confirmed = window.confirm("이 작업은 되돌릴 수 없어요. 삭제할까요?");
    if (!confirmed) {
      return;
    }

    await deleteAdminUser(token, userId);
    setUsers((prev) => prev.filter((user) => user.id !== userId));
  }

  if (!token) {
    return (
      <main className="app-shell flex min-h-screen items-center justify-center px-5 py-10">
        <div className="panel w-full max-w-md rounded-[32px] p-8">
          <div className="mb-8 space-y-3">
            <Logo size="md" />
            <h1 className="text-3xl font-bold text-white">관리자 로그인</h1>
            <p className="text-sm leading-6 text-[#94A3B8]">
              관리자 계정으로 접속해 사용자 계정을 관리하세요.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleAdminLogin}>
            <input
              className="field"
              placeholder="관리자 아이디"
              value={credentials.username}
              onChange={(event) =>
                setCredentials((prev) => ({ ...prev, username: event.target.value }))
              }
            />
            <input
              className="field"
              type="password"
              placeholder="관리자 비밀번호"
              value={credentials.password}
              onChange={(event) =>
                setCredentials((prev) => ({ ...prev, password: event.target.value }))
              }
            />
            {error ? (
              <p className="rounded-2xl border border-[#4a1f26] bg-[#1b1014] px-4 py-3 text-sm text-[#ffb4b4]">
                {error}
              </p>
            ) : null}
            <button className="primary-button w-full" disabled={loading} type="submit">
              {loading ? "확인 중..." : "로그인"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell min-h-screen px-5 py-6 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-center justify-between">
          <Logo />
          <button
            className="secondary-button"
            onClick={() => {
              clearAdminToken();
              setToken(null);
            }}
            type="button"
          >
            로그아웃
          </button>
        </header>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="panel rounded-[32px] p-6">
            <h2 className="text-2xl font-bold text-white">새 계정 추가</h2>
            <p className="mt-2 text-sm leading-6 text-[#94A3B8]">
              이름, 아이디, 비밀번호를 입력하면 새 사용자 계정을 만들 수 있어요.
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleCreateUser}>
              <input
                className="field"
                placeholder="이름"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
              <input
                className="field"
                placeholder="아이디"
                value={form.username}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, username: event.target.value }))
                }
              />
              <input
                className="field"
                type="password"
                placeholder="비밀번호"
                value={form.password}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, password: event.target.value }))
                }
              />
              {error ? (
                <p className="rounded-2xl border border-[#4a1f26] bg-[#1b1014] px-4 py-3 text-sm text-[#ffb4b4]">
                  {error}
                </p>
              ) : null}
              <button className="primary-button w-full" type="submit">
                계정 만들기
              </button>
            </form>
          </div>

          <div className="panel rounded-[32px] p-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-white">사용자 목록</h2>
                <p className="mt-2 text-sm leading-6 text-[#94A3B8]">
                  이름, 아이디, 가입일, 대화 횟수를 확인할 수 있어요.
                </p>
              </div>
              <div className="rounded-full border border-[#1e1e2e] bg-[#0f131c] px-4 py-2 text-sm text-[#cdd8e9]">
                총 {users.length}명
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-[24px] border border-[#1e1e2e]">
              <table className="min-w-full divide-y divide-[#1e1e2e] text-left text-sm">
                <thead className="bg-[#0f131c] text-[#94A3B8]">
                  <tr>
                    <th className="px-4 py-3 font-medium">이름</th>
                    <th className="px-4 py-3 font-medium">아이디</th>
                    <th className="px-4 py-3 font-medium">가입일</th>
                    <th className="px-4 py-3 font-medium">대화 수</th>
                    <th className="px-4 py-3 font-medium">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e1e2e] bg-[#111118] text-white">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-4 py-4">{user.name}</td>
                      <td className="px-4 py-4 text-[#c0d0e7]">{user.username}</td>
                      <td className="px-4 py-4 text-[#c0d0e7]">{user.joinedAt}</td>
                      <td className="px-4 py-4 text-[#c0d0e7]">{user.sessionCount}</td>
                      <td className="px-4 py-4">
                        <button
                          className="rounded-full border border-[#4b2326] px-3 py-2 text-xs font-semibold text-[#ffb4b4]"
                          onClick={() => void handleDeleteUser(user.id)}
                          type="button"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
