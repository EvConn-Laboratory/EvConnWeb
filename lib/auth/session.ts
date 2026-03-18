import { cookies } from "next/headers";
import { verifyToken, type JWTPayload } from "./jwt";

export const SESSION_COOKIE = "evconn_session";

export interface Session {
  user: JWTPayload & { id: string };
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  return { user: { ...payload, id: payload.sub } };
}

export function requireRole(
  session: Session | null,
  roles: Array<JWTPayload["role"]>
): session is Session {
  if (!session) return false;
  return roles.includes(session.user.role);
}
