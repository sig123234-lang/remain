"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ElderAppShell } from "@/components/elder-app-shell";
import { endSession, sendMessage, startSession } from "@/lib/api";
import { getStoredAuth } from "@/lib/auth";
import {
  FONT_SIZE_STYLE,
  getPreferences,
  TTS_RATE,
  type RecordingDuration,
} from "@/lib/preferences";
import type { ChatMessage, StoredAuth } from "@/lib/types";

const SESSION_DURATION = 30 * 60;

type Phase = "idle" | "connecting" | "listening" | "processing" | "thinking" | "speaking";

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
    ? `${name} 님, 안녕하세요. 오늘은 어떤 이야기를 들려주실래요?`
    : "안녕하세요. 오늘은 어떤 이야기를 들려주실래요?";
}

function phaseLabel(phase: Phase) {
  switch (phase) {
    case "connecting":
      return "연결 중...";
    case "listening":
      return "듣고 있어요";
    case "processing":
      return "처리 중...";
    case "thinking":
      return "생각 중...";
    case "speaking":
      return "말하는 중";
    default:
      return "마이크를 눌러 말씀해 주세요";
  }
}

function phaseColor(phase: Phase) {
  switch (phase) {
    case "connecting":
      return "#4d7ef7";
    case "listening":
      return "#1f9d63";
    case "processing":
      return "#d48d1c";
    case "thinking":
      return "#7d5ad8";
    case "speaking":
      return "var(--remain-primary)";
    default:
      return "var(--remain-muted)";
  }
}

function phaseIcon(phase: Phase) {
  switch (phase) {
    case "connecting":
      return "⏳";
    case "listening":
      return "🎙";
    case "processing":
      return "⚙️";
    case "thinking":
      return "💭";
    case "speaking":
      return "🔊";
    default:
      return "🎤";
  }
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export default function ConversationPage() {
  const router = useRouter();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const sessionTimerRef = useRef<number | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const activeRef = useRef(true);
  const pendingTranscriptRef = useRef("");
  const [auth] = useState<StoredAuth | null>(() => getStoredAuth());
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [phase, setPhase] = useState<Phase>(() => (auth ? "connecting" : "idle"));
  const [timeLeft, setTimeLeft] = useState(SESSION_DURATION);
  const [recordingCountdown, setRecordingCountdown] = useState<RecordingDuration>(12);
  const [preferences, setPreferences] = useState(() => getPreferences());
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [speechSupported] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncPreferences = () => setPreferences(getPreferences());
    window.addEventListener("storage", syncPreferences);
    return () => window.removeEventListener("storage", syncPreferences);
  }, []);

  const countdownRatio = useMemo(
    () => (recordingCountdown / preferences.recordingDuration) * 100,
    [preferences.recordingDuration, recordingCountdown],
  );

  const clearRecordingTimer = useCallback(() => {
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    activeRef.current = false;
    clearRecordingTimer();
    if (sessionTimerRef.current) {
      window.clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
  }, [clearRecordingTimer]);

  const startListening = useCallback(() => {
    clearRecordingTimer();
    pendingTranscriptRef.current = "";
    setRecordingCountdown(preferences.recordingDuration);
    setPhase("listening");
    setError("");

    if (!speechSupported || !recognitionRef.current) {
      return;
    }

    recognitionRef.current.start();

    let count = preferences.recordingDuration;
    recordingTimerRef.current = window.setInterval(() => {
      count -= 1;
      setRecordingCountdown(count as RecordingDuration);
      if (count <= 0) {
        clearRecordingTimer();
        recognitionRef.current?.stop();
        setPhase("processing");
      }
    }, 1000);
  }, [clearRecordingTimer, preferences.recordingDuration, speechSupported]);

  const speakText = useCallback(
    async (text: string) => {
      setPhase("speaking");

      if (typeof window === "undefined" || !window.speechSynthesis) {
        startListening();
        return;
      }

      window.speechSynthesis.cancel();

      await new Promise<void>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        synthRef.current = utterance;
        utterance.lang = "ko-KR";
        utterance.pitch = 0.92;
        utterance.rate = TTS_RATE[preferences.ttsSpeed];
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        window.speechSynthesis.speak(utterance);
      });

      if (activeRef.current) {
        startListening();
      }
    },
    [preferences.ttsSpeed, startListening],
  );

  const runTurn = useCallback(
    async (userText: string) => {
      if (!auth || !sessionId || !activeRef.current) {
        return;
      }

      if (userText !== "__START_SESSION__") {
        setMessages((prev) => [...prev, createMessage("user", userText)]);
      }

      setPending(true);
      setPhase("thinking");
      setError("");

      try {
        const response = await sendMessage(auth.userId, sessionId, userText, auth.token);
        const reply = response.reply || welcomeMessage(auth.name);
        setMessages((prev) => [...prev, createMessage("assistant", reply)]);
        setPending(false);
        await speakText(reply);
      } catch {
        setPending(false);
        setPhase("idle");
        setError("응답을 가져오지 못했어요.");
      }
    },
    [auth, sessionId, speakText],
  );

  const handleEndSession = useCallback(
    async (forced = false) => {
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
        router.replace("/history");
      }
    },
    [auth, cleanup, router, sessionId],
  );

  const handleSendText = useCallback(
    async (textOverride?: string) => {
      const text = (textOverride ?? input).trim();
      if (!text || pending) {
        return;
      }

      clearRecordingTimer();
      recognitionRef.current?.stop();
      setInput("");
      setPhase("processing");
      await runTurn(text);
    },
    [clearRecordingTimer, input, pending, runTurn],
  );

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
          await speakText(reply);
        } catch {
          const reply = welcomeMessage(auth.name);
          setMessages([createMessage("assistant", reply)]);
          await speakText(reply);
        }
      })
      .catch(() => {
        setPhase("idle");
        setError("대화를 시작하지 못했어요.");
      });

    return () => cleanup();
  }, [auth, cleanup, handleEndSession, router, speakText]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "ko-KR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      pendingTranscriptRef.current = event.results[0]?.[0]?.transcript ?? "";
    };
    recognition.onend = () => {
      if (pendingTranscriptRef.current.trim()) {
        void handleSendText(pendingTranscriptRef.current);
        pendingTranscriptRef.current = "";
        return;
      }
      setPhase("idle");
    };
    recognition.onerror = () => {
      setPhase("idle");
      setError("음성 인식을 사용할 수 없어요.");
    };

    recognitionRef.current = recognition;

    return () => recognition.stop();
  }, [handleSendText]);

  const rightSlot = (
    <div className="flex items-center gap-2">
      <span
        className="font-mono text-sm font-semibold tabular-nums"
        style={{
          color:
            timeLeft < 5 * 60 ? "#d05b5b" : timeLeft < 10 * 60 ? "#d48d1c" : "#1f9d63",
        }}
      >
        {formatTime(timeLeft)}
      </span>
      <button
        className="rounded-xl bg-[#fff4f4] px-3 py-1.5 text-xs text-[#c64545] transition hover:bg-[#ffeaea]"
        onClick={() => void handleEndSession()}
        type="button"
      >
        종료
      </button>
    </div>
  );

  return (
    <ElderAppShell hideBottomNav rightSlot={rightSlot}>
      <div className="flex h-full flex-col px-4 py-4">
        <div className="flex-1 overflow-y-auto pb-4">
          {messages.length === 0 && !pending ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--remain-primary-soft)] text-3xl">
                🎙
              </div>
              <div>
                <p className="text-sm text-[var(--remain-muted)]">
                  안녕하세요. 오늘 어떤 이야기를 나눠볼까요?
                </p>
                <p className="mt-1 text-xs text-[var(--remain-muted)]">편안하게 말씀해주세요.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isUser = message.role === "user";
                return (
                  <div
                    key={message.id}
                    className={`flex items-start gap-2 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {!isUser ? (
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--remain-primary-soft)]">
                        ✦
                      </div>
                    ) : null}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        isUser
                          ? "rounded-br-sm bg-[var(--remain-primary)] text-white"
                          : "rounded-bl-sm border border-[var(--remain-border)] bg-white text-[var(--remain-text)]"
                      }`}
                    >
                      <p
                        className="whitespace-pre-wrap leading-relaxed"
                        style={{ fontSize: FONT_SIZE_STYLE[preferences.fontSize] }}
                      >
                        {message.content}
                      </p>
                    </div>
                  </div>
                );
              })}

              {pending ? (
                <div className="flex items-start gap-2">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--remain-primary-soft)]">
                    ✦
                  </div>
                  <div className="rounded-2xl rounded-bl-sm border border-[var(--remain-border)] bg-white px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="typing-dot h-2 w-2 rounded-full bg-[var(--remain-primary)]" />
                      <span className="typing-dot h-2 w-2 rounded-full bg-[var(--remain-primary)]" />
                      <span className="typing-dot h-2 w-2 rounded-full bg-[var(--remain-primary)]" />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="remain-card rounded-3xl p-4">
            <div className="flex items-center justify-center">
              <div
                className={`flex h-20 w-20 items-center justify-center rounded-full border-2 text-[30px] ${
                  phase === "listening" ? "wave-ring" : ""
                }`}
                style={{ borderColor: phaseColor(phase), color: phaseColor(phase) }}
              >
                {phaseIcon(phase)}
              </div>
            </div>

            <p className="mt-4 text-center text-sm font-semibold" style={{ color: phaseColor(phase) }}>
              {phaseLabel(phase)}
            </p>

            {phase === "listening" ? (
              <div className="mt-4">
                <div className="h-2 overflow-hidden rounded-full bg-[var(--remain-surface-muted)]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${countdownRatio}%`,
                      backgroundColor: recordingCountdown <= 3 ? "#d05b5b" : "#1f9d63",
                    }}
                  />
                </div>
                <p className="mt-2 text-center text-xs text-[var(--remain-muted)]">
                  {recordingCountdown}초 남았어요
                </p>
              </div>
            ) : null}

            {error ? (
              <div className="mt-4 rounded-2xl bg-[#fff1f1] px-4 py-3 text-sm text-[#c64545]">
                {error}
              </div>
            ) : null}
          </div>

          <div className="remain-card rounded-3xl p-3">
            <textarea
              className="min-h-[88px] w-full resize-none bg-transparent text-[15px] leading-6 text-[var(--remain-text)] outline-none placeholder:text-[var(--remain-muted-2)]"
              placeholder="직접 입력하고 싶으시면 여기에 적어주세요"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSendText();
                }
              }}
            />

            <div className="mt-3 flex items-center gap-3">
              <button
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border ${
                  phase === "listening"
                    ? "border-[#d05b5b] bg-[#fff1f1] text-[#d05b5b]"
                    : "border-[var(--remain-border)] bg-[var(--remain-primary-soft)] text-[var(--remain-primary)]"
                }`}
                disabled={!speechSupported || pending}
                onClick={() => {
                  if (phase === "listening") {
                    clearRecordingTimer();
                    recognitionRef.current?.stop();
                    setPhase("processing");
                    return;
                  }
                  startListening();
                }}
                type="button"
              >
                {phase === "listening" ? "■" : "🎤"}
              </button>

              <button
                className="remain-primary-button flex-1 justify-center"
                disabled={!input.trim() || pending}
                onClick={() => void handleSendText()}
                type="button"
              >
                보내기
              </button>
            </div>

            <p className="mt-3 text-xs text-[var(--remain-muted)]">
              {speechSupported
                ? "말씀하시면 대화를 듣고, 답하고, 다시 다음 이야기를 기다릴게요."
                : "이 브라우저에서는 음성 인식이 지원되지 않아 입력으로만 대화를 이어갈 수 있어요."}
            </p>
          </div>
        </div>
      </div>
    </ElderAppShell>
  );
}
