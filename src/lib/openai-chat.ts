import { generateDemoTurn } from "@/lib/demo-reminiscence";
import { canUseDemoMode } from "@/lib/config";
import {
  buildReminiscenceSystemPrompt,
  type ReminiscenceProfile,
} from "@/lib/reminiscence-prompt";
import type { ChatMessage } from "@/lib/types";

export type StructuredTurn = {
  speech: string;
  currentTopic: string;
  currentSubtopic: string;
  emotionDetected: string;
  riskLevel: string;
  action: string;
  facilitatorNote: string;
  sessionSummaryUpdate: string;
  turnSummary: string;
};

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const TURN_SCHEMA = {
  name: "reminiscence_turn",
  strict: true,
  schema: {
    type: "object",
    properties: {
      speech: { type: "string" },
      currentTopic: { type: "string" },
      currentSubtopic: { type: "string" },
      emotionDetected: { type: "string" },
      riskLevel: { type: "string" },
      action: { type: "string" },
      facilitatorNote: { type: "string" },
      sessionSummaryUpdate: { type: "string" },
      turnSummary: { type: "string" },
    },
    required: [
      "speech",
      "currentTopic",
      "currentSubtopic",
      "emotionDetected",
      "riskLevel",
      "action",
      "facilitatorNote",
      "sessionSummaryUpdate",
      "turnSummary",
    ],
    additionalProperties: false,
  },
} as const;

function buildConversationPrompt(currentInput: string, history: ChatMessage[]) {
  const historyText = history
    .map((message) => `${message.role === "assistant" ? "도우미" : "어르신"}: ${message.content}`)
    .join("\n");

  return [
    "다음은 지금까지의 대화입니다.",
    historyText || "(이전 대화 없음)",
    "",
    "이번 어르신 발화:",
    currentInput,
    "",
    "반드시 JSON으로만 답하세요.",
    "speech는 어르신에게 실제로 들려줄 짧은 말로 작성하세요.",
  ].join("\n");
}

function demoFallback(input: string, profile?: ReminiscenceProfile | null): StructuredTurn {
  const result = generateDemoTurn(input, profile);

  return {
    speech: result.speech,
    currentTopic: result.currentTopic,
    currentSubtopic: "기본 회상 대화",
    emotionDetected: result.emotionDetected,
    riskLevel: "low",
    action: result.action,
    facilitatorNote: "데모 응답으로 처리됨",
    sessionSummaryUpdate: input === "__START_SESSION__" ? "대화를 시작했어요." : input,
    turnSummary: input === "__START_SESSION__" ? "첫 인사를 건넸어요." : input,
  };
}

export async function generateAssistantTurn(params: {
  input: string;
  history: ChatMessage[];
  profile?: ReminiscenceProfile | null;
}): Promise<StructuredTurn> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    if (canUseDemoMode()) {
      return demoFallback(params.input, params.profile);
    }

    throw new Error("OPENAI_API_KEY가 설정되지 않았습니다.");
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: buildReminiscenceSystemPrompt(params.profile),
        },
        {
          role: "user",
          content: buildConversationPrompt(params.input, params.history),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: TURN_SCHEMA,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || "OpenAI 응답을 가져오지 못했습니다.");
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI 응답 형식이 올바르지 않습니다.");
  }

  return JSON.parse(content) as StructuredTurn;
}
