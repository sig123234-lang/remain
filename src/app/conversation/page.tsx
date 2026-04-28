"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ElderAppShell } from "@/components/elder-app-shell";
import { endSession, sendMessage, startSession } from "@/lib/api";
import { getStoredAuth } from "@/lib/auth";
import { FONT_SIZE_STYLE, getPreferences, TTS_RATE } from "@/lib/preferences";
import type { ChatMessage, StoredAuth } from "@/lib/types";

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

export default function ConversationPage() {
  const router = useRouter();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const activeRef = useRef(true);
  const manualStopRef = useRef(false);
  const transcriptRef = useRef("");
  const [auth] = useState<StoredAuth | null>(() => getStoredAuth());
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [phase, setPhase] = useState<Phase>(() => (auth ? "connecting" : "idle"));
  const [preferences, setPreferences] = useState(() => getPreferences());
  const [error, setError] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
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

  const cleanup = useCallback(() => {
    activeRef.current = false;
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
  }, []);

  const startListening = useCallback(() => {
    if (!speechSupported || !recognitionRef.current || pending) {
      return;
    }

    manualStopRef.current = false;
    transcriptRef.current = "";
    setLiveTranscript("");
    setError("");
    setPhase("listening");
    try {
      recognitionRef.current.start();
    } catch {
      setPhase("idle");
      setError("마이크를 시작하지 못했어요. 다시 한 번 눌러주세요.");
    }
  }, [pending, speechSupported]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) {
      return;
    }

    manualStopRef.current = true;
    recognitionRef.current.stop();
    setPhase("processing");
  }, []);

  const speakText = useCallback(
    async (text: string) => {
      setPhase("speaking");

      if (typeof window === "undefined" || !window.speechSynthesis) {
        setPhase("idle");
        return;
      }

      window.speechSynthesis.cancel();

      await new Promise<void>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "ko-KR";
        utterance.pitch = 0.92;
        utterance.rate = TTS_RATE[preferences.ttsSpeed];
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        window.speechSynthesis.speak(utterance);
      });

      if (activeRef.current) {
        setPhase("idle");
      }
    },
    [preferences.ttsSpeed],
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
        transcriptRef.current = "";
        setLiveTranscript("");
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
  }, [auth, cleanup, router, speakText]);

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
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript ?? "";

        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      transcriptRef.current = `${finalTranscript}${interimTranscript}`.trim();
      setLiveTranscript(transcriptRef.current);
    };
    recognition.onend = () => {
      if (manualStopRef.current) {
        const transcript = transcriptRef.current.trim();
        manualStopRef.current = false;

        if (transcript) {
          void runTurn(transcript);
          return;
        }

        setPhase("idle");
        return;
      }

      setPhase("idle");
    };
    recognition.onerror = () => {
      setPhase("idle");
      setError("이 브라우저에서는 음성 인식이 잘 동작하지 않아요.");
    };

    recognitionRef.current = recognition;

    return () => recognition.stop();
  }, [runTurn]);

  const rightSlot = (
    <div className="flex items-center gap-2">
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
              <button
                className={`flex h-28 w-28 items-center justify-center rounded-full border-2 text-[42px] transition ${
                  phase === "listening" ? "wave-ring" : ""
                }`}
                disabled={!speechSupported || pending || phase === "speaking" || phase === "thinking"}
                onClick={() => {
                  if (phase === "listening") {
                    stopListening();
                    return;
                  }

                  startListening();
                }}
                style={{ borderColor: phaseColor(phase), color: phaseColor(phase) }}
                type="button"
              >
                {phase === "listening" ? "■" : phaseIcon(phase)}
              </button>
            </div>

            <p className="mt-4 text-center text-sm font-semibold" style={{ color: phaseColor(phase) }}>
              {phaseLabel(phase)}
            </p>

            {speechSupported ? (
              <div className="mt-4 rounded-2xl bg-[var(--remain-surface-muted)] px-4 py-4 text-center">
                <p className="text-xs text-[var(--remain-muted)]">
                  {phase === "listening"
                    ? "말씀을 마치시면 다시 버튼을 눌러 보내주세요."
                    : "가운데 마이크를 누르면 듣기 시작해요."}
                </p>
                {liveTranscript ? (
                  <p
                    className="mt-3 whitespace-pre-wrap leading-relaxed text-[var(--remain-text)]"
                    style={{ fontSize: FONT_SIZE_STYLE[preferences.fontSize] }}
                  >
                    {liveTranscript}
                  </p>
                ) : null}
              </div>
            ) : null}

            {error ? (
              <div className="mt-4 rounded-2xl bg-[#fff1f1] px-4 py-3 text-sm text-[#c64545]">
                {error}
              </div>
            ) : null}

            <p className="mt-4 text-center text-xs text-[var(--remain-muted)]">
              {speechSupported
                ? "처음 인사는 제가 먼저 읽어드릴게요."
                : "이 브라우저에서는 음성 인식이 지원되지 않을 수 있어요."}
            </p>
          </div>
        </div>
      </div>
    </ElderAppShell>
  );
}
