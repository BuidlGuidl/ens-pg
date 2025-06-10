import * as z from "zod";
import { DEFAULT_TEXTAREA_MAX_LENGTH } from "~~/utils/forms";

export const completeMilestoneModalFormSchema = z.object({
  completionProof: z.string().min(20, { message: "At least 20 characters required" }).max(DEFAULT_TEXTAREA_MAX_LENGTH),
});

export type CompleteMilestoneModalFormValues = z.infer<typeof completeMilestoneModalFormSchema>;
