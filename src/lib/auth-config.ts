const LOCAL_AUTH_SECRET = "test-secret";
const INSECURE_HOSTED_SECRETS = new Set(["replace-me", "test-secret"]);

export function resolveAuthSecret(input: NodeJS.ProcessEnv) {
  const secret = input.NEXTAUTH_SECRET?.trim();

  if (secret) {
    if (input.VERCEL === "1" && INSECURE_HOSTED_SECRETS.has(secret)) {
      throw new Error(
        "NEXTAUTH_SECRET must be set to a secure non-placeholder value when running on hosted Vercel environments",
      );
    }

    return secret;
  }

  if (input.VERCEL === "1") {
    throw new Error(
      "NEXTAUTH_SECRET must be set to a secure non-placeholder value when running on hosted Vercel environments",
    );
  }

  return LOCAL_AUTH_SECRET;
}
