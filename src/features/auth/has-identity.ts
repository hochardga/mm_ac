type IdentitySession = {
  user?: unknown;
} | null | undefined;

type IdentityCookieStore = {
  get(name: string): { value: string } | undefined;
};

export function hasIdentity(
  session: IdentitySession,
  cookieStore: IdentityCookieStore,
) {
  const hasSessionIdentity =
    typeof session?.user === "object" &&
    session.user !== null &&
    "id" in session.user &&
    Boolean((session.user as { id?: unknown }).id);

  return hasSessionIdentity || Boolean(cookieStore.get("ashfall-agent-id")?.value);
}
