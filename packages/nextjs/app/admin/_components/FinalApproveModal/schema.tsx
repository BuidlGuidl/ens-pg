import * as z from "zod";
import { DEFAULT_INPUT_MAX_LENGTH, DEFAULT_TEXTAREA_MAX_LENGTH } from "~~/utils/forms";

export const milestoneSchema = z.object({
  grantedAmount: z.string().max(DEFAULT_INPUT_MAX_LENGTH),
});

export const finalApproveModalFormSchema = z.object({
  milestones: z.array(milestoneSchema),
  statusNote: z.string().max(DEFAULT_TEXTAREA_MAX_LENGTH).optional(),
});

export type FinalApproveModalFormValues = z.infer<typeof finalApproveModalFormSchema>;
