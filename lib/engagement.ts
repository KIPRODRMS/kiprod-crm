export const ENGAGEMENT_STAGES = [
  {
    value: "target_identified",
    label: "Target identified",
  },
  {
    value: "contact_verified",
    label: "Contact verified",
  },
  {
    value: "intro_contact_made",
    label: "Intro contact made",
  },
  {
    value: "stage_1_documents_sent",
    label: "Stage 1 documents sent",
  },
  {
    value: "interest_expressed",
    label: "Interest expressed",
  },
  {
    value: "ilca_requested_approved",
    label: "ILCA requested/approved",
  },
  {
    value: "ilca_sent",
    label: "ILCA sent",
  },
] as const;

export type EngagementStage =
  (typeof ENGAGEMENT_STAGES)[number]["value"];

export const CONTROLLED_STAGE_ONE_DOCUMENTS = [
  {
    field: "document_institutional_introduction",
    label: "Short KIPROD Institutional Introduction",
  },
  {
    field: "document_ecosystem_one_pager",
    label: "KIPROD Ecosystem One-Pager",
  },
  {
    field: "document_ilca_invitation_note",
    label: "ILCA Invitation Note",
  },
] as const;

const stageAliases: Record<string, EngagementStage> = {
  target_identified: "target_identified",
  not_contacted: "target_identified",
  contact_verified: "contact_verified",
  introductory_contact_made: "intro_contact_made",
  intro_contact_made: "intro_contact_made",
  call_attempted: "intro_contact_made",
  contacted: "intro_contact_made",
  follow_up: "intro_contact_made",
  stage_1_documents_sent: "stage_1_documents_sent",
  interest_expressed: "interest_expressed",
  interested: "interest_expressed",
  ilca_requested_approved: "ilca_requested_approved",
  ilca_requested: "ilca_requested_approved",
  ilca_approved: "ilca_requested_approved",
  ilca_sent: "ilca_sent",
};

export function normaliseEngagementStage(
  value: string | null | undefined
): EngagementStage | null {
  if (!value) return null;

  const key = value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return stageAliases[key] || null;
}

export function isEngagementStage(
  value: string
): value is EngagementStage {
  return ENGAGEMENT_STAGES.some((stage) => stage.value === value);
}

export function isStageTransitionAllowed(
  currentValue: string | null | undefined,
  nextStage: EngagementStage
) {
  const currentStage = normaliseEngagementStage(currentValue);

  if (!currentStage) return true;

  const currentIndex = ENGAGEMENT_STAGES.findIndex(
    (stage) => stage.value === currentStage
  );
  const nextIndex = ENGAGEMENT_STAGES.findIndex(
    (stage) => stage.value === nextStage
  );

  return nextIndex === currentIndex || nextIndex === currentIndex + 1;
}

export type DailyActivityCounts = {
  newTargets: number;
  contactsAttempted: number;
  calls: number;
  whatsapp: number;
  emails: number;
  meetings: number;
  followUps: number;
  stageOnePacks: number;
  ilcasSent: number;
};

export const EMPTY_DAILY_ACTIVITY: DailyActivityCounts = {
  newTargets: 0,
  contactsAttempted: 0,
  calls: 0,
  whatsapp: 0,
  emails: 0,
  meetings: 0,
  followUps: 0,
  stageOnePacks: 0,
  ilcasSent: 0,
};

const dailyActivityLabels: Array<[
  keyof DailyActivityCounts,
  string,
]> = [
  ["newTargets", "New targets added"],
  ["contactsAttempted", "Contacts attempted"],
  ["calls", "Calls made"],
  ["whatsapp", "WhatsApp messages"],
  ["emails", "Emails sent"],
  ["meetings", "Visits / meetings"],
  ["followUps", "Follow-ups completed"],
  ["stageOnePacks", "Stage 1 document packs sent"],
  ["ilcasSent", "ILCAs sent"],
];

export function buildDailyActivitySummary(
  counts: DailyActivityCounts,
  summary: string
) {
  return [
    "KIPROD DAILY ACTIVITY — STRUCTURED",
    ...dailyActivityLabels.map(
      ([key, label]) => `${label}: ${counts[key]}`
    ),
    "",
    "End-of-day summary:",
    summary,
  ].join("\n");
}

export function parseDailyActivitySummary(
  value: string | null | undefined
): DailyActivityCounts | null {
  if (!value?.includes("KIPROD DAILY ACTIVITY — STRUCTURED")) {
    return null;
  }

  const counts = { ...EMPTY_DAILY_ACTIVITY };

  for (const [key, label] of dailyActivityLabels) {
    const match = value.match(
      new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:\\s*(\\d+)\\s*$`, "mi")
    );

    counts[key] = Number(match?.[1] || 0);
  }

  return counts;
}
