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
    <main className="app-shell flex min-h-screen justify-center px-5 py-8">
      <div className="v1-mobile-frame v1-screen flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-between px-7 py-8">
        <div className="space-y-10">
          <div className="v1-logo-row pt-2">
            <Logo />
          </div>

          <div className="space-y-2">
            <h1 className="text-[28px] font-bold text-[#EEEDFE]">다시 오셨군요</h1>
            <p className="text-sm text-[#555A6B]">이전 이야기를 이어갈게요</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-xs font-medium tracking-[0.02em] text-[#666D7E]">
                아이디
              </span>
              <input
                className="w-full rounded-xl border border-[#1e1e2e] bg-[#111118] px-4 py-[15px] text-base text-[#EEEDFE] outline-none placeholder:text-[#33384A]"
                placeholder="아이디를 입력하세요"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-medium tracking-[0.02em] text-[#666D7E]">
                비밀번호
              </span>
              <input
                className="w-full rounded-xl border border-[#1e1e2e] bg-[#111118] px-4 py-[15px] text-base text-[#EEEDFE] outline-none placeholder:text-[#33384A]"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            {error ? (
              <p className="rounded-xl border border-[#4a1f26] bg-[#1b1014] px-4 py-3 text-sm text-[#ffb4b4]">
                {error}
              </p>
            ) : null}

            <button className="v1-primary-button mt-2 flex w-full justify-center" disabled={loading} type="submit">
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-[#1e1e2e] bg-[#111118] px-4 py-4 text-sm leading-6 text-[#555A6B]">
          회원가입은 따로 없어요. 관리자 화면에서 만든 어르신 계정으로 로그인할 수
          있어요.
        </div>
      </div>
    </main>
  );
}
