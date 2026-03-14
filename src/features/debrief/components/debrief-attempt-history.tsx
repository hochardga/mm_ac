import type { PlayerCaseStatus } from "@/features/cases/case-status";

type DebriefAttemptStatus = Exclude<PlayerCaseStatus, "new">;

type DebriefAttempt = {
  attemptNumber: number;
  nextStatus: DebriefAttemptStatus;
  suspect: string;
  motive: string;
  method: string;
  feedback: string;
};

type DebriefAttemptHistoryProps = {
  attempts: DebriefAttempt[];
};

function formatAttemptStatus(status: DebriefAttemptStatus) {
  switch (status) {
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Accepted";
    case "closed_unsolved":
      return "Closed Unsolved";
  }
}

export function DebriefAttemptHistory({
  attempts,
}: DebriefAttemptHistoryProps) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[#f0b48f]">
            Submission log
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-stone-50">
            Attempt History
          </h2>
        </div>
        <p className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-stone-300">
          {attempts.length} attempts filed
        </p>
      </div>

      <ol className="mt-6 space-y-4">
        {attempts.map((attempt) => (
          <li
            key={attempt.attemptNumber}
            className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-stone-50">
                Attempt {attempt.attemptNumber}
              </h3>
              <p className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-stone-300">
                {formatAttemptStatus(attempt.nextStatus)}
              </p>
            </div>

            <dl className="mt-4 grid gap-3 sm:grid-cols-3">
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-stone-400">
                  Suspect
                </dt>
                <dd className="mt-2 text-sm text-stone-100">{attempt.suspect}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-stone-400">
                  Motive
                </dt>
                <dd className="mt-2 text-sm text-stone-100">{attempt.motive}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-stone-400">
                  Method
                </dt>
                <dd className="mt-2 text-sm text-stone-100">{attempt.method}</dd>
              </div>
            </dl>

            <div className="mt-4 rounded-[1.25rem] border border-[#d96c3d]/20 bg-[#d96c3d]/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#f0b48f]">
                Handler feedback
              </p>
              <p className="mt-2 text-sm leading-7 text-stone-100">
                {attempt.feedback}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
