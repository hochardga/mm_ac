import path from "node:path";

export type RuntimeStorage =
  | {
      kind: "memory";
      isEphemeral: true;
    }
  | {
      kind: "filesystem";
      dataDir: string;
      isEphemeral: boolean;
    };

export function isEphemeralDemoDeployment(input: NodeJS.ProcessEnv) {
  return input.VERCEL === "1";
}

export function resolveRuntimeStorage(
  input: NodeJS.ProcessEnv,
  cwd = process.cwd(),
): RuntimeStorage {
  if (input.NODE_ENV === "test") {
    return {
      kind: "memory",
      isEphemeral: true,
    };
  }

  return {
    kind: "filesystem",
    dataDir: path.join(cwd, ".data", "pglite"),
    isEphemeral: false,
  };
}
