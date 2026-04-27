import { NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/admin-session";
import { addUser, hasUsername, listUsers, removeUser } from "@/lib/admin-store";

function isAuthorized(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "") ?? null;
  return Boolean(verifyAdminToken(token));
}

function adminApiEnabled() {
  return process.env.ENABLE_INMEMORY_ADMIN === "true";
}

export async function GET(request: Request) {
  if (!adminApiEnabled()) {
    return new NextResponse(
      "인메모리 관리자 API가 비활성화되어 있습니다. 실제 관리자 백엔드 또는 ENABLE_INMEMORY_ADMIN=true 설정이 필요합니다.",
      { status: 503 },
    );
  }

  if (!isAuthorized(request)) {
    return new NextResponse("권한이 없습니다.", { status: 401 });
  }

  return NextResponse.json({
    users: listUsers(),
  });
}

export async function POST(request: Request) {
  if (!adminApiEnabled()) {
    return new NextResponse(
      "인메모리 관리자 API가 비활성화되어 있습니다. 실제 관리자 백엔드 또는 ENABLE_INMEMORY_ADMIN=true 설정이 필요합니다.",
      { status: 503 },
    );
  }

  if (!isAuthorized(request)) {
    return new NextResponse("권한이 없습니다.", { status: 401 });
  }

  const { name, username, password } = (await request.json()) as {
    name?: string;
    username?: string;
    password?: string;
  };

  if (!name || !username || !password) {
    return new NextResponse("필수값이 비어 있습니다.", { status: 400 });
  }

  if (hasUsername(username)) {
    return new NextResponse("이미 존재하는 아이디입니다.", { status: 409 });
  }

  const user = addUser({ name, username, password });

  return NextResponse.json({ user });
}

export async function DELETE(request: Request) {
  if (!adminApiEnabled()) {
    return new NextResponse(
      "인메모리 관리자 API가 비활성화되어 있습니다. 실제 관리자 백엔드 또는 ENABLE_INMEMORY_ADMIN=true 설정이 필요합니다.",
      { status: 503 },
    );
  }

  if (!isAuthorized(request)) {
    return new NextResponse("권한이 없습니다.", { status: 401 });
  }

  const { userId } = (await request.json()) as { userId?: string };

  if (!userId) {
    return new NextResponse("삭제할 사용자 ID가 필요합니다.", { status: 400 });
  }

  const ok = removeUser(userId);

  if (!ok) {
    return new NextResponse("사용자를 찾지 못했습니다.", { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
