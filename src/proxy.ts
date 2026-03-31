import { withAuth } from "next-auth/middleware";

import { resolveAuthSecret } from "@/lib/auth-config";
import { isProtectedPath } from "@/lib/route-protection";

export default withAuth({
  secret: resolveAuthSecret(process.env),
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    authorized: ({ req, token }) => {
      if (!isProtectedPath(req.nextUrl.pathname)) {
        return true;
      }

      const agentId = req.cookies.get("ashfall-agent-id")?.value;
      return Boolean(token) || Boolean(agentId);
    },
  },
});

export const config = {
  matcher: [
    "/vault",
    "/vault/:path*",
    "/cases",
    "/cases/:path*",
    "/the-system-intro",
    "/the-system-intro/:path*",
    "/api/the-system-intro/audio",
    "/api/the-system-intro/audio/:path*",
  ],
};
