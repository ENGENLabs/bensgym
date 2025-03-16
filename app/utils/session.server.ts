import { createCookieSessionStorage, redirect } from "@remix-run/node";
import { getEnv } from "./env.server";

// Get session secret from environment variables
const { SESSION_SECRET } = getEnv();

// Create session storage
const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "gym_admin_session",
    secure: process.env.NODE_ENV === "production",
    secrets: [SESSION_SECRET || "fallback-secret-for-development-only"],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
  },
});

// Create a session
export async function createAdminSession(redirectTo: string) {
  const session = await sessionStorage.getSession();
  session.set("isAdmin", true);
  
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

// Get the session
export async function getAdminSession(request: Request) {
  return sessionStorage.getSession(request.headers.get("Cookie"));
}

// Check if user is admin
export async function requireAdmin(request: Request, redirectTo: string = "/admin-login") {
  const session = await getAdminSession(request);
  const isAdmin = session.get("isAdmin");
  
  if (!isAdmin) {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/admin-login?${searchParams}`);
  }
  
  return session;
}

// Log out
export async function logoutAdmin(request: Request) {
  const session = await getAdminSession(request);
  
  return redirect("/", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}
