import * as z from "zod";
import { milestoneSchema } from "~~/app/apply/schema";

export const newStageModalFormSchema = z.object({
  milestones: z.array(milestoneSchema),
});

export type NewStageModalFormValues = z.infer<typeof newStageModalFormSchema>;
