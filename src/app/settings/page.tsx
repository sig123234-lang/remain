"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ElderAppShell } from "@/components/elder-app-shell";
import { clearAuth } from "@/lib/auth";
import {
  FONT_SIZE_STYLE,
  getPreferences,
  savePreferences,
  type FontSize,
  type Preferences,
  type RecordingDuration,
  type TtsSpeed,
} from "@/lib/preferences";

const FONT_SIZE_OPTIONS: Array<{ key: FontSize; label: string }> = [
  { key: "small", label: "작게" },
  { key: "medium", label: "보통" },
  { key: "large", label: "크게" },
];

const TTS_SPEED_OPTIONS: Array<{ key: TtsSpeed; label: string; sub: string; emoji: string }> = [
  { key: "slow", label: "느리게", sub: "0.75x", emoji: "🐢" },
  { key: "normal", label: "보통", sub: "1.0x", emoji: "🎵" },
  { key: "fast", label: "빠르게", sub: "1.25x", emoji: "🐇" },
];

const RECORDING_OPTIONS: Array<{
  key: RecordingDuration;
  label: string;
  sub: string;
  emoji: string;
}> = [
  { key: 12, label: "짧게", sub: "12초", emoji: "⚡" },
  { key: 20, label: "보통", sub: "20초", emoji: "🎙" },
  { key: 30, label: "길게", sub: "30초", emoji: "🕒" },
];

export default function SettingsPage() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<Preferences>(() => getPreferences());

  function updatePreferences(next: Preferences) {
    setPreferences(next);
    savePreferences(next);
  }

  return (
    <ElderAppShell>
      <div className="space-y-4 px-4 py-4">
        <section className="remain-card rounded-3xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--remain-primary-soft)] text-lg text-[var(--remain-primary)]">
              👤
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--remain-text)]">어르신 설정</p>
              <p className="text-xs text-[var(--remain-muted)]">대화를 더 편안하게 맞춰드릴게요</p>
            </div>
          </div>
        </section>

        <section className="remain-card overflow-hidden rounded-3xl">
          <div className="border-b border-[var(--remain-border)] px-4 pb-3 pt-4">
            <p className="text-sm font-semibold text-[var(--remain-text)]">채팅 글자 크기</p>
            <p className="mt-1 text-xs text-[var(--remain-muted)]">
              대화 화면의 말풍선 글자 크기를 조절합니다
            </p>
          </div>
          <div className="px-4 py-4">
            <div className="mb-4 flex gap-2">
              {FONT_SIZE_OPTIONS.map((option) => {
                const selected = preferences.fontSize === option.key;
                return (
                  <button
                    key={option.key}
                    className={`flex-1 rounded-xl border-2 px-2 py-3 transition-all ${
                      selected
                        ? "border-[var(--remain-primary)] bg-[var(--remain-primary-soft)] shadow-[0_10px_24px_rgba(31,45,74,0.10)]"
                        : "border-[var(--remain-border)] bg-white"
                    }`}
                    onClick={() =>
                      updatePreferences({ ...preferences, fontSize: option.key })
                    }
                    type="button"
                  >
                    <p
                      className={`font-semibold ${selected ? "text-[var(--remain-primary)]" : "text-[var(--remain-text)]"}`}
                      style={{ fontSize: FONT_SIZE_STYLE[option.key] }}
                    >
                      가
                    </p>
                    <p className="mt-1 text-[11px] text-[var(--remain-muted)]">{option.label}</p>
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl bg-[var(--remain-surface-muted)] p-3">
              <p className="mb-2 text-[10px] text-[var(--remain-muted)]">미리보기</p>
              <div className="space-y-2">
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-sm border border-[var(--remain-border)] bg-white px-3 py-2">
                    <p style={{ fontSize: FONT_SIZE_STYLE[preferences.fontSize] }}>
                      어르신, 오늘 기분은 어떠세요?
                    </p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="rounded-2xl rounded-br-sm bg-[var(--remain-primary)] px-3 py-2 text-white">
                    <p style={{ fontSize: FONT_SIZE_STYLE[preferences.fontSize] }}>
                      네, 오늘은 날씨가 좋아서 기분이 좋아요.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="remain-card overflow-hidden rounded-3xl">
          <div className="border-b border-[var(--remain-border)] px-4 pb-3 pt-4">
            <p className="text-sm font-semibold text-[var(--remain-text)]">AI 음성 속도</p>
            <p className="mt-1 text-xs text-[var(--remain-muted)]">
              AI가 응답을 읽어주는 속도를 조절합니다
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 px-4 py-4">
            {TTS_SPEED_OPTIONS.map((option) => {
              const selected = preferences.ttsSpeed === option.key;
              return (
                <button
                  key={option.key}
                  className={`rounded-xl border-2 px-2 py-3 transition-all ${
                    selected
                      ? "border-[var(--remain-primary)] bg-[var(--remain-primary-soft)] shadow-[0_10px_24px_rgba(31,45,74,0.10)]"
                      : "border-[var(--remain-border)] bg-white"
                  }`}
                  onClick={() => updatePreferences({ ...preferences, ttsSpeed: option.key })}
                  type="button"
                >
                  <p className="text-lg">{option.emoji}</p>
                  <p className="mt-1 text-xs font-semibold text-[var(--remain-text)]">{option.label}</p>
                  <p className="mt-1 text-[10px] text-[var(--remain-muted)]">{option.sub}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="remain-card overflow-hidden rounded-3xl">
          <div className="border-b border-[var(--remain-border)] px-4 pb-3 pt-4">
            <p className="text-sm font-semibold text-[var(--remain-text)]">녹음 시간</p>
            <p className="mt-1 text-xs text-[var(--remain-muted)]">
              한 번에 말씀하실 수 있는 최대 녹음 시간입니다
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 px-4 py-4">
            {RECORDING_OPTIONS.map((option) => {
              const selected = preferences.recordingDuration === option.key;
              return (
                <button
                  key={option.key}
                  className={`rounded-xl border-2 px-2 py-3 transition-all ${
                    selected
                      ? "border-[var(--remain-primary)] bg-[var(--remain-primary-soft)] shadow-[0_10px_24px_rgba(31,45,74,0.10)]"
                      : "border-[var(--remain-border)] bg-white"
                  }`}
                  onClick={() =>
                    updatePreferences({ ...preferences, recordingDuration: option.key })
                  }
                  type="button"
                >
                  <p className="text-lg">{option.emoji}</p>
                  <p className="mt-1 text-xs font-semibold text-[var(--remain-text)]">{option.label}</p>
                  <p className="mt-1 text-[10px] text-[var(--remain-muted)]">{option.sub}</p>
                </button>
              );
            })}
          </div>
        </section>

        <button
          className="remain-card flex w-full items-center justify-between rounded-3xl px-4 py-4 text-left"
          onClick={() => {
            clearAuth();
            router.replace("/login");
          }}
          type="button"
        >
          <span className="text-sm font-medium text-[#d05b5b]">로그아웃</span>
          <span className="text-[#d05b5b]">→</span>
        </button>
      </div>
    </ElderAppShell>
  );
}
