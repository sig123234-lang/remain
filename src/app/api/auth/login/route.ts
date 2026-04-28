import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/admin-store";
import { createLocalUserToken } from "@/lib/local-auth";

export async function POST(request: Request) {
  const { username, password } = (await request.json()) as {
    username?: string;
    password?: string;
  };

  if (!username || !password) {
    return new NextResponse("아이디와 비밀번호를 모두 입력해 주세요.", {
      status: 400,
    });
  }

  const user = authenticateUser(username, password);

  if (!user) {
    return new NextResponse("관리자가 만든 어르신 계정을 확인해 주세요.", {
      status: 401,
    });
  }

  return NextResponse.json({
    token: createLocalUserToken(user.id),
    userId: user.id,
    name: user.name,
  });
}
