import * as z from "zod";
import { DEFAULT_TEXTAREA_MAX_LENGTH } from "~~/utils/forms";

export const withdrawModalFormSchema = z.object({
  completionProof: z.string().min(20, { message: "At least 20 characters required" }).max(DEFAULT_TEXTAREA_MAX_LENGTH),
});

export type WithdrawModalFormValues = z.infer<typeof withdrawModalFormSchema>;

export const legacyWithdrawModalFormSchema = z.object({
  withdrawAmount: z.string().min(1, { message: "Amount is required" }),
  completedMilestones: z
    .string()
    .min(20, { message: "At least 20 characters required" })
    .max(DEFAULT_TEXTAREA_MAX_LENGTH),
});

export type LegacyWithdrawModalFormValues = z.infer<typeof legacyWithdrawModalFormSchema>;
