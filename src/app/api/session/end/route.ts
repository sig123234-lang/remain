import { NextResponse } from "next/server";
import { endSessionRecord } from "@/lib/local-session-store";
import { isAuthorizedUser } from "@/lib/local-auth";

export async function POST(request: Request) {
  const { userId, sessionId } = (await request.json()) as {
    userId?: string;
    sessionId?: string;
  };

  if (!userId || !sessionId) {
    return new NextResponse("userId와 sessionId가 필요합니다.", { status: 400 });
  }

  if (!isAuthorizedUser(request, userId)) {
    return new NextResponse("인증이 올바르지 않습니다.", { status: 401 });
  }

  const ok = endSessionRecord(userId, sessionId);
  if (!ok) {
    return new NextResponse("세션을 찾지 못했습니다.", { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
