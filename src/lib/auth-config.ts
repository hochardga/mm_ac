const LOCAL_AUTH_SECRET = "test-secret";

export function resolveAuthSecret(input: NodeJS.ProcessEnv) {
  const secret = input.NEXTAUTH_SECRET;

  if (secret) {
    return secret;
  }

  if (input.VERCEL === "1") {
    throw new Error(
      "NEXTAUTH_SECRET must be set when running on hosted Vercel environments",
    );
  }

  return LOCAL_AUTH_SECRET;
}
