// leave-request-system/backend/server/utils/session.ts
import type { H3Event } from "h3";
import { useSession } from "h3";

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export async function getSession(event: H3Event) {
  return useSession<SessionUser>(event, {
    password:
      process.env.SESSION_SECRET || "insecure-default-change-in-production",
    name: "session",
    maxAge: 60 * 60 * 24, // 24 hours
  });
}
