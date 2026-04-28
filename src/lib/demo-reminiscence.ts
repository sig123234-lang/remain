import {
  buildReminiscenceSystemPrompt,
  type ReminiscenceProfile,
} from "@/lib/reminiscence-prompt";

export type DemoTurnResult = {
  speech: string;
  currentTopic:
    | "childhood"
    | "school"
    | "youth"
    | "marriage"
    | "children"
    | "work"
    | "present";
  emotionDetected:
    | "neutral"
    | "positive"
    | "nostalgic"
    | "sad"
    | "anxious"
    | "resistant";
  action: "continue" | "deepen" | "soften" | "transition" | "listen";
  systemPrompt: string;
};

const TOPIC_KEYWORDS: Record<DemoTurnResult["currentTopic"], string[]> = {
  childhood: ["어릴", "동네", "고향", "집", "놀", "명절"],
  school: ["학교", "선생", "친구", "공부", "소풍"],
  youth: ["스무", "청춘", "연애", "군대", "첫 월급", "젊"],
  marriage: ["결혼", "배우자", "남편", "아내", "신혼"],
  children: ["아이", "아들", "딸", "손주", "육아", "자녀"],
  work: ["일", "직장", "가게", "기술", "은퇴", "회사"],
  present: ["요즘", "오늘", "지금", "하루", "최근"],
};

const SAD_PATTERNS = ["힘들", "슬펐", "울", "아팠", "돌아가", "외롭", "무섭", "걱정"];
const POSITIVE_PATTERNS = ["좋았", "행복", "즐거", "반갑", "웃", "고마", "따뜻"];
const RESISTANT_PATTERNS = ["모르겠", "기억 안", "생각 안", "잘 모르", "말하기 싫"];

function detectTopic(text: string): DemoTurnResult["currentTopic"] {
  const lowered = text.trim();

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS) as Array<
    [DemoTurnResult["currentTopic"], string[]]
  >) {
    if (keywords.some((keyword) => lowered.includes(keyword))) {
      return topic;
    }
  }

  return "childhood";
}

function detectEmotion(text: string): DemoTurnResult["emotionDetected"] {
  if (RESISTANT_PATTERNS.some((pattern) => text.includes(pattern))) {
    return "resistant";
  }

  if (SAD_PATTERNS.some((pattern) => text.includes(pattern))) {
    return "sad";
  }

  if (POSITIVE_PATTERNS.some((pattern) => text.includes(pattern))) {
    return "positive";
  }

  if (text.includes("그때") || text.includes("예전") || text.includes("옛날")) {
    return "nostalgic";
  }

  return "neutral";
}

function acknowledge(text: string, name?: string | null) {
  const prefix = name ? `${name} 어르신, ` : "";

  if (text.includes("학교")) {
    return `${prefix}학교 기억이 또렷하시군요.`;
  }

  if (text.includes("가족") || text.includes("아들") || text.includes("딸")) {
    return `${prefix}가족 이야기가 참 소중하시군요.`;
  }

  if (text.includes("고향") || text.includes("동네")) {
    return `${prefix}그곳 풍경이 아직 마음에 남아 계시군요.`;
  }

  if (text.includes("일") || text.includes("직장")) {
    return `${prefix}그 시절 일이 많이 떠오르시나 봐요.`;
  }

  return `${prefix}그 장면이 아직 선명하게 남아 있으시군요.`;
}

function followUpByTopic(
  topic: DemoTurnResult["currentTopic"],
  emotion: DemoTurnResult["emotionDetected"],
): Pick<DemoTurnResult, "speech" | "action"> {
  if (emotion === "resistant") {
    return {
      speech: "괜찮아요. 잠깐 쉬었다가 편한 이야기부터 해볼까요?",
      action: "soften",
    };
  }

  if (emotion === "sad" || emotion === "anxious") {
    return {
      speech: "많이 마음에 남으셨겠어요. 그 곁에 누가 계셨어요?",
      action: "soften",
    };
  }

  switch (topic) {
    case "childhood":
      return {
        speech: "그때 동네엔 어떤 소리가 들렸어요?",
        action: "deepen",
      };
    case "school":
      return {
        speech: "학교 가는 길 풍경은 어땠어요?",
        action: "deepen",
      };
    case "youth":
      return {
        speech: "그 시절 가장 자주 만난 분은 누구셨어요?",
        action: "deepen",
      };
    case "marriage":
      return {
        speech: "그분을 처음 뵀을 때 느낌이 어떠셨어요?",
        action: "deepen",
      };
    case "children":
      return {
        speech: "그때 가장 먼저 떠오르는 표정은 누구 얼굴이에요?",
        action: "deepen",
      };
    case "work":
      return {
        speech: "그 일터엔 어떤 냄새나 소리가 있었어요?",
        action: "deepen",
      };
    case "present":
      return {
        speech: "요즘 하루에서 제일 반가운 순간은 언제세요?",
        action: "continue",
      };
    default:
      return {
        speech: "그 이야기를 조금만 더 들려주실래요?",
        action: "continue",
      };
  }
}

export function generateDemoTurn(
  input: string,
  profile?: ReminiscenceProfile | null,
): DemoTurnResult {
  const systemPrompt = buildReminiscenceSystemPrompt(profile);

  if (input === "__START_SESSION__") {
    return {
      speech: profile?.nickname
        ? `${profile.nickname} 어르신, 안녕하세요. 오늘은 어떤 이야기를 나눠볼까요?`
        : "안녕하세요. 오늘은 어떤 이야기를 나눠볼까요?",
      currentTopic: "childhood",
      emotionDetected: "neutral",
      action: "continue",
      systemPrompt,
    };
  }

  const topic = detectTopic(input);
  const emotionDetected = detectEmotion(input);
  const next = followUpByTopic(topic, emotionDetected);
  const lead = acknowledge(input, profile?.nickname);

  return {
    speech: `${lead} ${next.speech}`.trim(),
    currentTopic: topic,
    emotionDetected,
    action: next.action,
    systemPrompt,
  };
}
