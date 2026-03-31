import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { SystemIntroPanel } from "@/features/the-system-into/components/system-intro-panel";
import { loadSystemIntro } from "@/features/the-system-into/load-system-intro";
import { authOptions } from "@/lib/auth";

export default async function SystemIntroPage() {
  const [session, cookieStore] = await Promise.all([
    getServerSession(authOptions),
    cookies(),
  ]);

  const hasSessionIdentity = Boolean(
    session?.user && "id" in session.user && session.user.id,
  );
  const hasIntakeIdentity = Boolean(cookieStore.get("ashfall-agent-id")?.value);

  if (!hasSessionIdentity && !hasIntakeIdentity) {
    redirect("/signin");
  }

  const intro = await loadSystemIntro();

  if (!intro) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(217,108,61,0.14),_transparent_34%),linear-gradient(180deg,_#120d0b_0%,_#241916_55%,_#0e0b0a_100%)] px-6 py-16">
      <SystemIntroPanel
        transcript={intro.transcript}
        audioSrc={intro.audioPath ? "/api/the-system-into/audio" : undefined}
      />
    </main>
  );
}

