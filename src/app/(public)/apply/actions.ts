"use server";

import { cookies } from "next/headers";

import {
  AgentEmailAlreadyActiveError,
  registerAgent,
} from "@/features/auth/register-agent";

export type ApplyActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  email?: string;
  redirectTo?: string;
};

export async function registerAgentAction(
  _prevState: ApplyActionState,
  formData: FormData,
): Promise<ApplyActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const alias = String(formData.get("alias") ?? "");

  if (!email || !password || !alias) {
    return {
      status: "error",
      message: "Every field is required to open your Ashfall file.",
    };
  }

  let result;

  try {
    result = await registerAgent({ email, password, alias });
  } catch (error) {
    if (error instanceof AgentEmailAlreadyActiveError) {
      return {
        status: "error",
        message: "That agency email is already active. Sign in instead.",
      };
    }

    throw error;
  }

  const cookieStore = await cookies();

  cookieStore.set("ashfall-onboarding", "active", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  cookieStore.set("ashfall-agent-id", result.userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return {
    status: "success",
    redirectTo: result.redirectTo,
  };
}
