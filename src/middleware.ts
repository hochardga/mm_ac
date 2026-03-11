import { withAuth } from "next-auth/middleware";

import { isProtectedPath } from "@/lib/auth";

export default withAuth({
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    authorized: ({ req, token }) => {
      if (!isProtectedPath(req.nextUrl.pathname)) {
        return true;
      }

      return Boolean(token);
    },
  },
});

export const config = {
  matcher: ["/vault/:path*", "/cases/:path*"],
};
