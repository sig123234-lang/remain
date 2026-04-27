"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { login } from "@/lib/api";
import { saveAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const auth = await login(username, password);
      saveAuth({ ...auth, username });
      router.replace("/home");
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "로그인에 실패했어요.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell flex min-h-screen items-center justify-center px-5 py-10">
      <div className="panel w-full max-w-md rounded-[32px] p-7 sm:p-9">
        <div className="mb-8 space-y-4">
          <Logo size="lg" />
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">다시 오셨군요</h1>
            <p className="text-sm leading-6 text-[#94A3B8]">
              관리자에게 받은 아이디로 로그인하세요. 이전 이야기를 이어갈게요.
            </p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#cbd5e1]">아이디</span>
            <input
              className="field"
              placeholder="아이디를 입력하세요"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#cbd5e1]">비밀번호</span>
            <input
              className="field"
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error ? (
            <p className="rounded-2xl border border-[#4a1f26] bg-[#1b1014] px-4 py-3 text-sm text-[#ffb4b4]">
              {error}
            </p>
          ) : null}

          <button className="primary-button w-full" disabled={loading} type="submit">
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div className="mt-6 rounded-2xl border border-[#1e1e2e] bg-[#0f131c] px-4 py-3 text-sm leading-6 text-[#94A3B8]">
          데모 환경에서는 어떤 아이디로도 들어갈 수 있고, 실제 API를 연결하면 문서 기준
          로그인 흐름으로 바로 교체됩니다.
        </div>
      </div>
    </main>
  );
}
