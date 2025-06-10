import * as z from "zod";
import { DEFAULT_TEXTAREA_MAX_LENGTH } from "~~/utils/forms";

export const finalApproveModalFormSchema = z.object({
  statusNote: z.string().max(DEFAULT_TEXTAREA_MAX_LENGTH).optional(),
});

export type FinalApproveModalFormValues = z.infer<typeof finalApproveModalFormSchema>;
