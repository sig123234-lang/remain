import { NextResponse } from "next/server";
import { findUserById } from "@/lib/admin-store";
import { isAuthorizedUser } from "@/lib/local-auth";
import {
  addSessionMessage,
  getRecentMessages,
  getSession,
} from "@/lib/local-session-store";
import { generateAssistantTurn } from "@/lib/openai-chat";

export async function POST(request: Request) {
  const { userId, sessionId, content } = (await request.json()) as {
    userId?: string;
    sessionId?: string;
    content?: string;
  };

  if (!userId || !sessionId || !content) {
    return new NextResponse("userId, sessionId, content가 필요합니다.", {
      status: 400,
    });
  }

  if (!isAuthorizedUser(request, userId)) {
    return new NextResponse("인증이 올바르지 않습니다.", { status: 401 });
  }

  const user = findUserById(userId);
  const session = getSession(sessionId);

  if (!user || !session || session.userId !== userId) {
    return new NextResponse("세션 정보를 찾지 못했습니다.", { status: 404 });
  }

  if (content !== "__START_SESSION__") {
    addSessionMessage(sessionId, {
      role: "user",
      content,
    });
  }

  try {
    const result = await generateAssistantTurn({
      input: content,
      history: getRecentMessages(sessionId),
      profile: {
        nickname: user.name,
      },
    });

    addSessionMessage(sessionId, {
      role: "assistant",
      content: result.speech,
    });

    return NextResponse.json({
      reply: result.speech,
      meta: {
        topic: result.currentTopic,
        emotion: result.emotionDetected,
        action: result.action,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "대화 응답을 생성하지 못했습니다.";
    return new NextResponse(message, { status: 500 });
  }
}
