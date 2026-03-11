const LOCAL_AUTH_SECRET = "test-secret";

export function resolveAuthSecret(input: NodeJS.ProcessEnv) {
  return input.NEXTAUTH_SECRET ?? LOCAL_AUTH_SECRET;
}
