import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE_MAX_AGE_SECONDS, SESSION_COOKIE_NAME } from "./sessionConstants";

export { SESSION_COOKIE_MAX_AGE_SECONDS, SESSION_COOKIE_NAME } from "./sessionConstants";

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
  };
}

export async function readSessionCookie(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function writeSessionCookie(rawToken: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE_NAME, rawToken, cookieOptions());
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).set(SESSION_COOKIE_NAME, "", {
    ...cookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  });
}
