"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { getStoredAuth } from "@/lib/auth";

const features = [
  {
    icon: "🎙",
    title: "음성으로 대화",
    description: "말씀만 하세요. 받아쓰기는 AI가 도와드릴게요.",
  },
  {
    icon: "🧠",
    title: "AI가 모두 기억",
    description: "지난 이야기를 이어서 천천히 대화를 나눕니다.",
  },
  {
    icon: "📖",
    title: "기록으로 남습니다",
    description: "나눈 이야기는 다시 돌아볼 수 있도록 남겨집니다.",
  },
];

export default function Page() {
  const router = useRouter();
  const [hasAuth] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return Boolean(getStoredAuth());
  });

  useEffect(() => {
    if (hasAuth) {
      router.replace("/home");
    }
  }, [hasAuth, router]);

  if (hasAuth) {
    return (
      <main className="app-shell flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Logo size="lg" />
          <p className="mt-5 text-sm text-[#667085]">기억을 불러오는 중이에요.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell flex min-h-screen justify-center px-5 py-8">
      <div className="v1-mobile-frame v1-screen flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-between px-7 py-10">
        <section className="flex flex-col items-center gap-5 pt-6 text-center">
          <Logo size="lg" />
          <p className="max-w-xs text-sm leading-6 text-[#667085]">
            당신의 이야기를 영원히 기억합니다
          </p>
        </section>

        <section className="space-y-4">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-[18px] border border-[#1e1e2e] bg-[#111118] px-4 py-4"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">{feature.icon}</span>
                <div className="space-y-1">
                  <h2 className="text-left text-[15px] font-semibold text-[#EEEDFE]">
                    {feature.title}
                  </h2>
                  <p className="text-left text-[13px] leading-5 text-[#555A6B]">
                    {feature.description}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="space-y-4 pb-2">
          <Link className="v1-primary-button flex w-full justify-center" href="/login">
            시작하기
          </Link>
          <p className="text-center text-xs leading-5 text-[#444A59]">
            어르신 계정은 관리자 화면에서 만들어드릴 수 있어요.
          </p>
        </section>
      </div>
    </main>
  );
}
