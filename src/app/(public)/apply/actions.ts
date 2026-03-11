"use server";

import { cookies } from "next/headers";

import { registerAgent } from "@/features/auth/register-agent";

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

  const result = await registerAgent({ email, password, alias });
  const cookieStore = await cookies();

  cookieStore.set("ashfall-onboarding", "active", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return {
    status: "success",
    redirectTo: result.redirectTo,
  };
}
