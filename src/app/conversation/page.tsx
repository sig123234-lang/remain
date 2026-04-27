"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { endSession, sendMessage, startSession } from "@/lib/api";
import { getStoredAuth } from "@/lib/auth";
import type { ChatMessage, StoredAuth } from "@/lib/types";

const SESSION_DURATION = 30 * 60;
const AUTO_STOP_SEC = 12;

type Phase = "init" | "thinking" | "speaking" | "listening" | "processing";

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
  const phaseRef = useRef<Phase>("init");
  const sessionTimerRef = useRef<number | null>(null);
  const autoStopRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const activeRef = useRef(true);
  const [auth] = useState<StoredAuth | null>(() => getStoredAuth());
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [listening, setListening] = useState(false);
  const [phase, setPhase] = useState<Phase>("init");
  const [timeLeft, setTimeLeft] = useState(SESSION_DURATION);
  const [countdown, setCountdown] = useState(AUTO_STOP_SEC);
  const [speechSupported] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  });
  const [error, setError] = useState("");

  function setPhaseSync(nextPhase: Phase) {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
  }

  const clearListeningTimers = useCallback(() => {
    if (autoStopRef.current) {
      window.clearTimeout(autoStopRef.current);
      autoStopRef.current = null;
    }
    if (countdownRef.current) {
      window.clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    activeRef.current = false;
    clearListeningTimers();
    if (sessionTimerRef.current) {
      window.clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
  }, [clearListeningTimers]);

  const startListeningPhase = useCallback(() => {
    clearListeningTimers();
    setListening(false);
    setCountdown(AUTO_STOP_SEC);
    setPhaseSync("listening");

    if (!speechSupported || !recognitionRef.current) {
      return;
    }

    recognitionRef.current.start();
    countdownRef.current = window.setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    autoStopRef.current = window.setTimeout(() => {
      if (phaseRef.current === "listening") {
        recognitionRef.current?.stop();
        setPhaseSync("processing");
      }
    }, AUTO_STOP_SEC * 1000);
  }, [clearListeningTimers, speechSupported]);

  const speakAndContinue = useCallback(async (text: string) => {
    setPhaseSync("speaking");

    if (typeof window === "undefined" || !window.speechSynthesis) {
      startListeningPhase();
      return;
    }

    window.speechSynthesis.cancel();

    await new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      speechRef.current = utterance;
      utterance.lang = "ko-KR";
      utterance.pitch = 0.92;
      utterance.rate = 0.88;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });

    if (activeRef.current) {
      startListeningPhase();
    }
  }, [startListeningPhase]);

  const conversationTurn = useCallback(async (userText: string) => {
    if (!auth || !sessionId || !activeRef.current) {
      return;
    }

    if (userText !== "__START_SESSION__") {
      const userMessage = createMessage("user", userText);
      setMessages((prev) => [...prev, userMessage]);
    }

    setPending(true);
    setPhaseSync("thinking");
    setError("");

    try {
      const response = await sendMessage(auth.userId, sessionId, userText, auth.token);
      const reply = response.reply || welcomeMessage(auth.name);
      setMessages((prev) => [...prev, createMessage("assistant", reply)]);
      setPending(false);
      await speakAndContinue(reply);
    } catch {
      setPending(false);
      setError("응답을 가져오지 못했어요.");
      startListeningPhase();
    }
  }, [auth, sessionId, startListeningPhase, speakAndContinue]);

  const handleManualSend = useCallback(async (textOverride?: string) => {
    const nextText = (textOverride ?? input).trim();

    if (!nextText || pending) {
      return;
    }

    clearListeningTimers();
    recognitionRef.current?.stop();
    setInput("");
    setListening(false);
    setPhaseSync("processing");
    await conversationTurn(nextText);
  }, [clearListeningTimers, conversationTurn, input, pending]);

  async function handleEndSession(forced = false) {
    if (!auth || !sessionId) {
      router.replace("/home");
      return;
    }

    if (!forced) {
      const confirmed = window.confirm("지금까지의 대화를 저장하고 종료할까요?");
      if (!confirmed) {
        return;
      }
    }

    cleanup();

    try {
      await endSession(auth.userId, sessionId, auth.token);
    } finally {
      if (forced) {
        window.alert("30분 대화가 끝났어요. 오늘 나눈 이야기를 저장했어요.");
      }
      router.replace("/home");
    }
  }

  useEffect(() => {
    if (!auth) {
      router.replace("/login");
      return;
    }

    startSession(auth.userId, auth.token)
      .then(async ({ sessionId: nextSessionId }) => {
        setSessionId(nextSessionId);
        sessionTimerRef.current = window.setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              void handleEndSession(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        try {
          const response = await sendMessage(
            auth.userId,
            nextSessionId,
            "__START_SESSION__",
            auth.token,
          );
          const reply = response.reply || welcomeMessage(auth.name);
          setMessages([createMessage("assistant", reply)]);
          await speakAndContinue(reply);
        } catch {
          const reply = welcomeMessage(auth.name);
          setMessages([createMessage("assistant", reply)]);
          await speakAndContinue(reply);
        }
      })
      .catch(() => {
        setError("대화를 시작하지 못했어요.");
      });

    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    recognition.onend = () => {
      setListening(false);
      if (phaseRef.current === "listening") {
        setPhaseSync("processing");
      }
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      if (transcript.trim()) {
        void handleManualSend(transcript);
      }
    };
    recognition.onerror = () => {
      setListening(false);
      setError("음성 인식을 사용할 수 없어요.");
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speechSupported]);

  function toggleListening() {
    if (!speechSupported || pending) {
      return;
    }

    if (listening || phaseRef.current === "listening") {
      clearListeningTimers();
      recognitionRef.current?.stop();
      setListening(false);
      setPhaseSync("processing");
      return;
    }
    setError("");
    startListeningPhase();
  }

  const timeColor = timeLeft < 300 ? "#E24B4A" : timeLeft < 600 ? "#EF9F27" : "#444";
  const phaseInfo: Record<Phase, { label: string; color: string; icon: string }> = {
    init: { label: "연결 중...", color: "#444", icon: "⏳" },
    thinking: { label: "생각 중...", color: "#666", icon: "💭" },
    speaking: { label: "말하는 중...", color: "#378ADD", icon: "🔊" },
    listening: { label: "듣고 있어요", color: "#4DB87A", icon: "🎙" },
    processing: { label: "처리 중...", color: "#EF9F27", icon: "⚙️" },
  };
  const currentPhase = phaseInfo[phase];
  const progressWidth = `${(countdown / AUTO_STOP_SEC) * 100}%`;

  function formatTime(seconds: number) {
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  }

  return (
    <main className="app-shell flex min-h-screen justify-center px-5 py-8">
      <div className="v1-mobile-frame v1-screen flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col">
        <header className="flex items-center justify-between px-5 py-4">
          <div className="v1-logo-row text-[24px] font-bold">
            <span className="text-[#EEEDFE]">rem</span>
            <span className="text-[#378ADD]">AI</span>
            <span className="text-[#EEEDFE]">n</span>
          </div>
          <p className="text-sm font-semibold" style={{ color: timeColor }}>
            {formatTime(timeLeft)}
          </p>
          <button className="text-sm text-[#444A59]" onClick={() => void handleEndSession()} type="button">
            종료
          </button>
        </header>

        <section className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-4">
            {messages.map((message) => {
              const isUser = message.role === "user";
              return (
                <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[82%] rounded-[18px] px-4 py-3 ${
                      isUser
                        ? "rounded-br-[4px] border border-[#185FA5] bg-[#0D1929]"
                        : "rounded-bl-[4px] border border-[#1e1e2e] bg-[#111118]"
                    }`}
                  >
                    {!isUser ? (
                      <div className="mb-2 flex items-baseline text-[11px] font-semibold">
                        <span className="text-[#EEEDFE]/70">rem</span>
                        <span className="text-[#378ADD]">AI</span>
                        <span className="text-[#EEEDFE]/70">n</span>
                      </div>
                    ) : null}
                    <p
                      className={`whitespace-pre-wrap text-base leading-[1.6] ${
                        isUser ? "text-[#EEEDFE]" : "text-[#EEEDFE]"
                      }`}
                    >
                      {message.content}
                    </p>
                  </div>
                </div>
              );
            })}

            {pending ? (
              <div className="flex justify-start">
                <div className="rounded-[18px] rounded-bl-[4px] border border-[#1e1e2e] bg-[#111118] px-4 py-3 text-sm text-[#667085]">
                  생각 중...
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="relative px-6 pb-6 pt-2">
          {phase === "listening" ? (
            <div
              className="pointer-events-none absolute left-1/2 top-[2.1rem] h-24 w-24 -translate-x-1/2 rounded-full border v1-wave"
              style={{ borderColor: currentPhase.color, opacity: 0.35 }}
            />
          ) : null}

          <div
            className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full border-[1.5px] bg-[#0a0a0f] text-[28px]"
            style={{ borderColor: currentPhase.color }}
          >
            {currentPhase.icon}
          </div>

          <p className="mt-4 text-center text-sm font-semibold" style={{ color: currentPhase.color }}>
            {currentPhase.label}
          </p>

          {phase === "listening" ? (
            <>
              <div className="mx-auto mt-4 h-2 w-full overflow-hidden rounded-full bg-[#161923]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: progressWidth,
                    backgroundColor: countdown <= 3 ? "#E24B4A" : "#4DB87A",
                  }}
                />
              </div>
              <button
                className="mx-auto mt-4 block rounded-2xl border border-[#1e1e2e] bg-[#111118] px-5 py-3 text-sm font-semibold text-[#EEEDFE]"
                onClick={() => {
                  clearListeningTimers();
                  recognitionRef.current?.stop();
                  setPhaseSync("processing");
                }}
                type="button"
              >
                ✓ 말씀 완료
              </button>
            </>
          ) : null}

          {error ? (
            <p className="mt-4 rounded-xl border border-[#4a1f26] bg-[#1b1014] px-4 py-3 text-sm text-[#ffb4b4]">
              {error}
            </p>
          ) : null}

          <div className="mt-4 rounded-[18px] border border-[#1e1e2e] bg-[#111118] p-3">
            <textarea
              className="min-h-[96px] w-full resize-none bg-transparent text-[15px] leading-6 text-[#EEEDFE] outline-none placeholder:text-[#444A59]"
              placeholder="직접 입력하고 싶으시면 여기에 적어주세요"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleManualSend();
                }
              }}
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <button
                className={`flex h-[56px] w-[56px] items-center justify-center rounded-full border text-2xl ${
                  listening
                    ? "border-[#4DB87A] bg-[#102017] text-[#4DB87A]"
                    : "border-[#1e1e2e] bg-[#0D1929] text-[#EEEDFE]"
                }`}
                disabled={!speechSupported || pending}
                onClick={toggleListening}
                type="button"
              >
                🎙
              </button>
              <button
                className="v1-primary-button flex-1 justify-center"
                disabled={!input.trim() || pending}
                onClick={() => void handleManualSend()}
                type="button"
              >
                입력 전송
              </button>
            </div>
            <p className="mt-3 text-xs text-[#555A6B]">
              {speechSupported
                ? "말씀하시면 자동으로 듣고, 답한 뒤 다시 다음 이야기를 기다릴게요."
                : "이 브라우저에서는 음성 인식이 지원되지 않아 입력으로 대화를 이어갈 수 있어요."}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
