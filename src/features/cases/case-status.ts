export const playerCaseStatuses = [
  "new",
  "in_progress",
  "completed",
  "closed_unsolved",
] as const;

export type PlayerCaseStatus = (typeof playerCaseStatuses)[number];

export function isPlayerCaseStatus(value: string): value is PlayerCaseStatus {
  return (playerCaseStatuses as readonly string[]).includes(value);
}

export function getDisplayStatus(status: PlayerCaseStatus) {
  return {
    new: "New",
    in_progress: "In Progress",
    completed: "Solved",
    closed_unsolved: "Case Closed",
  }[status];
}

export function getVaultAvailability(input: { published: boolean }) {
  return input.published ? "Available" : "Hidden";
}
