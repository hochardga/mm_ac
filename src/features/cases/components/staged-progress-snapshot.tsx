import type { CaseProgressSnapshot } from "@/features/cases/case-progression";

type StagedProgressSnapshotProps = {
  snapshot: CaseProgressSnapshot;
  variant?: "vault" | "workspace";
};

export function StagedProgressSnapshot({
  snapshot,
  variant = "workspace",
}: StagedProgressSnapshotProps) {
  if (variant === "vault") {
    return (
      <div className="mt-6 rounded-[1.5rem] border border-stone-200 bg-stone-50 px-4 py-4">
        <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
          Stage {snapshot.focusStage.position} of {snapshot.totalStageCount}
        </p>
        <p className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-stone-900">
          {snapshot.focusStage.title}
        </p>
        <p className="mt-2 text-sm leading-6 text-stone-700">
          {snapshot.solvedObjectiveCount} of {snapshot.totalObjectiveCount} objectives
          solved
        </p>
        <p className="mt-1 text-sm leading-6 text-stone-700">
          {snapshot.visibleEvidenceCount} evidence items unlocked
        </p>
        {snapshot.nextObjectivePrompt ? (
          <p className="mt-2 text-sm leading-6 text-stone-700">
            {snapshot.nextObjectivePrompt}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.25em] text-[#f0b48f]">
        Investigation Snapshot
      </p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-stone-300">
            Stage {snapshot.focusStage.position} of {snapshot.totalStageCount}
          </p>
          <h2 className="mt-2 text-2xl font-semibold">{snapshot.focusStage.title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-300">
            {snapshot.focusStage.summary}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-stone-200">
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-2">
            {snapshot.solvedObjectiveCount} of {snapshot.totalObjectiveCount} objectives
            solved
          </span>
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-2">
            {snapshot.visibleEvidenceCount} evidence items unlocked
          </span>
        </div>
      </div>
      {snapshot.nextObjectivePrompt ? (
        <div className="mt-5 rounded-[1.25rem] border border-[#d96c3d]/40 bg-[#d96c3d]/10 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[#f0b48f]">
            Active Objective
          </p>
          <p className="mt-2 text-sm leading-7 text-stone-50">
            {snapshot.nextObjectivePrompt}
          </p>
        </div>
      ) : null}
    </div>
  );
}
