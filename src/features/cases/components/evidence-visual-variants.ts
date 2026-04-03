import type { CaseEvidence } from "@/features/cases/evidence/schema";

export type EvidenceFamily = CaseEvidence["family"];

const FAMILY_LABELS: Record<EvidenceFamily, string> = {
  document: "Document",
  record: "Record",
  thread: "Thread",
  photo: "Photo",
  audio: "Audio",
  diagram: "Diagram",
  webpage: "Webpage",
};

const FAMILY_BADGE_CLASSES: Record<EvidenceFamily, string> = {
  document: "border-amber-200/30 bg-amber-100/10 text-amber-100",
  record: "border-emerald-200/30 bg-emerald-100/10 text-emerald-100",
  thread: "border-sky-200/30 bg-sky-100/10 text-sky-100",
  photo: "border-stone-200/30 bg-stone-100/10 text-stone-100",
  audio: "border-rose-200/30 bg-rose-100/10 text-rose-100",
  diagram: "border-cyan-200/30 bg-cyan-100/10 text-cyan-100",
  webpage: "border-violet-200/30 bg-violet-100/10 text-violet-100",
};

export function getEvidenceFamilyLabel(family: EvidenceFamily) {
  return FAMILY_LABELS[family];
}

export function getEvidenceFamilyBadgeClass(family: EvidenceFamily) {
  return FAMILY_BADGE_CLASSES[family];
}

export function formatEvidenceSubtypeLabel(subtype: string) {
  return subtype
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}
