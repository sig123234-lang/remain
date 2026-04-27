import { NextResponse } from "next/server";
import { createAdminToken } from "@/lib/admin-session";

const defaultUsername = process.env.ADMIN_USERNAME ?? "admin";
const defaultPassword = process.env.ADMIN_PASSWORD;

export async function POST(request: Request) {
  const { username, password } = (await request.json()) as {
    username?: string;
    password?: string;
  };

  if (!defaultPassword) {
    return new NextResponse(
      "ADMIN_PASSWORD 환경변수가 설정되지 않았습니다. 운영 배포 전 반드시 설정해 주세요.",
      { status: 500 },
    );
  }

  if (username !== defaultUsername || password !== defaultPassword) {
    return new NextResponse("관리자 계정이 일치하지 않습니다.", { status: 401 });
  }

  return NextResponse.json({
    token: createAdminToken(username),
  });
}
