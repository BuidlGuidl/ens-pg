export const EIP_712_DOMAIN = {
  name: "ENS PG Grants",
  version: "1",
} as const;

export const EIP_712_TYPES__APPLY_FOR_STAGE = {
  Message: [
    { name: "stage_number", type: "string" },
    { name: "milestone", type: "string" },
  ],
} as const;

export const EIP_712_TYPES__WITHDRAW_FROM_STAGE = {
  Message: [
    { name: "stageId", type: "string" },
    { name: "completedMilestones", type: "string" },
    { name: "withdrawAmount", type: "string" },
  ],
} as const;

export const EIP_712_TYPES__REVIEW_STAGE = {
  Message: [
    { name: "stageId", type: "string" },
    { name: "action", type: "string" },
    { name: "txHash", type: "string" },
    { name: "statusNote", type: "string" },
    { name: "grantAmount", type: "string" },
    { name: "grantNumber", type: "string" },
  ],
} as const;

export const EIP_712_TYPES__STAGE_PRIVATE_NOTE = {
  Message: [{ name: "note", type: "string" }],
} as const;

export const EIP_712_TYPES__STAGE_APPROVAL_VOTE = {
  Message: [
    { name: "grantAmount", type: "string" },
    { name: "stageId", type: "string" },
  ],
} as const;

export const EIP_712_TYPES__LARGE_STAGE_APPROVAL_VOTE = {
  Message: [{ name: "stageId", type: "string" }],
} as const;

export const EIP_712_TYPES__LARGE_STAGE_REJECT_VOTE = {
  Message: [
    { name: "stageId", type: "string" },
    { name: "statusNote", type: "string" },
  ],
} as const;

export const EIP_712_TYPES__REVIEW_LARGE_STAGE = {
  Message: [
    { name: "stageId", type: "string" },
    { name: "action", type: "string" },
    { name: "txHash", type: "string" },
    { name: "statusNote", type: "string" },
  ],
} as const;

export const EIP_712_TYPES__LARGE_MILESTONE_PRIVATE_NOTE = {
  Message: [
    { name: "milestoneId", type: "string" },
    { name: "note", type: "string" },
  ],
} as const;

export const EIP_712_TYPES__REVIEW_LARGE_MILESTONE = {
  Message: [
    { name: "milestoneId", type: "string" },
    { name: "action", type: "string" },
    { name: "txHash", type: "string" },
    { name: "statusNote", type: "string" },
  ],
} as const;

export const EIP_712_TYPES__APPLY_FOR_LARGE_STAGE = {
  Message: [
    { name: "stage_number", type: "string" },
    { name: "milestones", type: "string" },
  ],
} as const;
