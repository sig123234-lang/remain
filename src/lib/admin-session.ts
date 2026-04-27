import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;

type AdminPayload = {
  role: "admin";
  username: string;
  exp: number;
};

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV !== "production") {
    return "local-admin-session-secret";
  }

  throw new Error("운영 배포에서는 ADMIN_SESSION_SECRET이 필요합니다.");
}

function encode(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function decode(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function createAdminToken(username: string) {
  const payload: AdminPayload = {
    role: "admin",
    username,
    exp: Date.now() + TOKEN_TTL_MS,
  };

  const encodedPayload = encode(JSON.stringify(payload));
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifyAdminToken(token: string | null) {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (provided.length !== expected.length) {
    return null;
  }

  if (!timingSafeEqual(provided, expected)) {
    return null;
  }

  try {
    const payload = JSON.parse(decode(encodedPayload)) as AdminPayload;

    if (payload.role !== "admin" || payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
