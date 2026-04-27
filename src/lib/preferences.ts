export type FontSize = "small" | "medium" | "large";
export type TtsSpeed = "slow" | "normal" | "fast";
export type RecordingDuration = 12 | 20 | 30;

export type Preferences = {
  fontSize: FontSize;
  ttsSpeed: TtsSpeed;
  recordingDuration: RecordingDuration;
};

const STORAGE_KEY = "remain_preferences";

const DEFAULT_PREFERENCES: Preferences = {
  fontSize: "medium",
  ttsSpeed: "normal",
  recordingDuration: 12,
};

export function getDefaultPreferences() {
  return DEFAULT_PREFERENCES;
}

export function getPreferences(): Preferences {
  if (typeof window === "undefined") {
    return DEFAULT_PREFERENCES;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return DEFAULT_PREFERENCES;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return {
      fontSize:
        parsed.fontSize === "small" || parsed.fontSize === "large"
          ? parsed.fontSize
          : "medium",
      ttsSpeed:
        parsed.ttsSpeed === "slow" || parsed.ttsSpeed === "fast"
          ? parsed.ttsSpeed
          : "normal",
      recordingDuration:
        parsed.recordingDuration === 20 || parsed.recordingDuration === 30
          ? parsed.recordingDuration
          : 12,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(preferences: Preferences) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}

export const FONT_SIZE_STYLE: Record<FontSize, string> = {
  small: "15px",
  medium: "17px",
  large: "19px",
};

export const TTS_RATE: Record<TtsSpeed, number> = {
  slow: 0.78,
  normal: 0.9,
  fast: 1.05,
};
