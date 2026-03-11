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

      return (
        Boolean(token) ||
        req.cookies.get("ashfall-onboarding")?.value === "active"
      );
    },
  },
});

export const config = {
  matcher: ["/vault/:path*", "/cases/:path*"],
};
