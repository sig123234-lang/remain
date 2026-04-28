import { NextResponse } from "next/server";
import { createSession } from "@/lib/local-session-store";
import { isAuthorizedUser } from "@/lib/local-auth";

export async function POST(request: Request) {
  const { userId } = (await request.json()) as { userId?: string };

  if (!userId) {
    return new NextResponse("userId가 필요합니다.", { status: 400 });
  }

  if (!isAuthorizedUser(request, userId)) {
    return new NextResponse("인증이 올바르지 않습니다.", { status: 401 });
  }

  const session = createSession(userId);
  return NextResponse.json({ sessionId: session.id });
}
