"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatBubble } from "@/components/chat-bubble";
import { Logo } from "@/components/logo";
import { TypingDots } from "@/components/typing-dots";
import { endSession, sendMessage, startSession } from "@/lib/api";
import { getStoredAuth } from "@/lib/auth";
import type { ChatMessage, StoredAuth } from "@/lib/types";

function createMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id: `${role}-${Math.random().toString(36).slice(2, 10)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

function welcomeMessage(name?: string) {
  return name
    ? `${name} 어르신, 안녕하세요. 오늘 어떤 이야기를 나눠볼까요?`
    : "안녕하세요. 오늘 어떤 이야기를 나눠볼까요?";
}

export default function ConversationPage() {
  const router = useRouter();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [auth] = useState<StoredAuth | null>(() => getStoredAuth());
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechSupported] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auth) {
      router.replace("/login");
      return;
    }

    startSession(auth.userId, auth.token)
      .then(async ({ sessionId: nextSessionId }) => {
        setSessionId(nextSessionId);

        try {
          const response = await sendMessage(
            auth.userId,
            nextSessionId,
            "__START_SESSION__",
            auth.token,
          );

          setMessages([createMessage("assistant", response.reply || welcomeMessage(auth.name))]);
        } catch {
          setMessages([createMessage("assistant", welcomeMessage(auth.name))]);
        }
      })
      .catch(() => {
        setError("대화를 시작하지 못했어요.");
      });
  }, [auth, router]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition || null;

    if (!Recognition) {
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "ko-KR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onerror = () => {
      setListening(false);
      setError("음성 인식을 사용할 수 없어요.");
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  async function handleSend() {
    if (!auth || !sessionId || !input.trim() || pending) {
      return;
    }

    const nextText = input.trim();
    const userMessage = createMessage("user", nextText);

    setInput("");
    setError("");
    setPending(true);
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await sendMessage(auth.userId, sessionId, nextText, auth.token);
      setMessages((prev) => [...prev, createMessage("assistant", response.reply)]);
    } catch {
      setError("응답을 가져오지 못했어요.");
    } finally {
      setPending(false);
    }
  }

  async function handleEndSession() {
    if (!auth || !sessionId) {
      router.replace("/home");
      return;
    }

    const confirmed = window.confirm("대화를 마치고 홈으로 돌아갈까요?");

    if (!confirmed) {
      return;
    }

    try {
      await endSession(auth.userId, sessionId, auth.token);
    } finally {
      router.replace("/home");
    }
  }

  function toggleListening() {
    if (!recognitionRef.current) {
      return;
    }

    if (listening) {
      recognitionRef.current.stop();
      return;
    }

    setError("");
    recognitionRef.current.start();
  }

  return (
    <main className="app-shell min-h-screen px-4 py-5 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <header className="flex items-center justify-between rounded-[28px] border border-[#1e1e2e] bg-[#0b1019]/90 px-5 py-4">
          <div className="flex items-center gap-4">
            <Logo />
            <p className="hidden text-sm text-[#94A3B8] sm:block">
              오늘의 이야기를 천천히 이어가요
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link className="secondary-button" href="/history">
              기록 보기
            </Link>
            <button className="secondary-button" onClick={handleEndSession} type="button">
              종료
            </button>
          </div>
        </header>

        <section className="panel flex min-h-[72vh] flex-1 flex-col rounded-[32px] p-4 sm:p-5">
          <div className="flex-1 space-y-4 overflow-y-auto px-1 py-2">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-center text-sm leading-7 text-[#94A3B8]">
                  대화 준비 중이에요.
                </p>
              </div>
            ) : (
              messages.map((message) => <ChatBubble key={message.id} message={message} />)
            )}

            {pending ? (
              <div className="flex justify-start">
                <TypingDots />
              </div>
            ) : null}
          </div>

          {error ? (
            <p className="mb-3 rounded-2xl border border-[#4a1f26] bg-[#1b1014] px-4 py-3 text-sm text-[#ffb4b4]">
              {error}
            </p>
          ) : null}

          <div className="rounded-[28px] border border-[#1e1e2e] bg-[#0b1019] p-3">
            <div className="flex items-end gap-3">
              <textarea
                className="field min-h-28 resize-none"
                placeholder="오늘 떠오르는 이야기를 적어주세요"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
              />

              <button
                className={`flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full border text-2xl ${
                  listening
                    ? "border-[#378ADD] bg-[#0D1929] shadow-[0_0_0_12px_rgba(55,138,221,0.15)]"
                    : "border-[#1e1e2e] bg-[#111118]"
                }`}
                disabled={!speechSupported}
                onClick={toggleListening}
                type="button"
              >
                🎙
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-sm text-[#94A3B8]">
                {speechSupported
                  ? listening
                    ? "음성을 듣고 있어요."
                    : "마이크를 눌러 음성 입력을 시작할 수 있어요."
                  : "이 브라우저에서는 음성 인식을 지원하지 않아요."}
              </p>
              <button className="primary-button" onClick={() => void handleSend()} type="button">
                전송
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
