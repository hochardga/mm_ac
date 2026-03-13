import { cookies } from "next/headers";

const intakeCookieNames = ["ashfall-agent-id", "ashfall-onboarding"] as const;

export async function POST() {
  const cookieStore = await cookies();

  for (const cookieName of intakeCookieNames) {
    cookieStore.set(cookieName, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
    });
  }

  return new Response(null, { status: 204 });
}
