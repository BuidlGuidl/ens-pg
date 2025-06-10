import * as z from "zod";
import { DEFAULT_TEXTAREA_MAX_LENGTH } from "~~/utils/forms";

export const rejectModalFormSchema = z.object({
  statusNote: z.string().max(DEFAULT_TEXTAREA_MAX_LENGTH).optional(),
});

export type RejectModalFormValues = z.infer<typeof rejectModalFormSchema>;
