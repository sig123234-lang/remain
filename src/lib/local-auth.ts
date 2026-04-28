const LOCAL_TOKEN_PREFIX = "local-token-";
const DEMO_TOKEN_PREFIX = "demo-token-";

export function createLocalUserToken(userId: string) {
  return `${LOCAL_TOKEN_PREFIX}${userId}`;
}

export function extractBearerToken(request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim();
}

export function getUserIdFromToken(token: string | null) {
  if (!token) {
    return null;
  }

  if (token.startsWith(LOCAL_TOKEN_PREFIX)) {
    return token.slice(LOCAL_TOKEN_PREFIX.length);
  }

  if (token.startsWith(DEMO_TOKEN_PREFIX)) {
    return token.slice(DEMO_TOKEN_PREFIX.length);
  }

  return null;
}

export function isAuthorizedUser(request: Request, userId: string) {
  const token = extractBearerToken(request);
  return getUserIdFromToken(token) === userId;
}
