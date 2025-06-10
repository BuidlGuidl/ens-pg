import * as z from "zod";
import { DEFAULT_INPUT_MAX_LENGTH, DEFAULT_TEXTAREA_MAX_LENGTH } from "~~/utils/forms";

export const milestoneSchema = z.object({
  description: z.string().min(20, { message: "At least 20 characters required" }).max(DEFAULT_TEXTAREA_MAX_LENGTH),
  proposedDeliverables: z
    .string()
    .min(20, { message: "At least 20 characters required" })
    .max(DEFAULT_TEXTAREA_MAX_LENGTH),
  amount: z.number().min(1, { message: "Budget must be greater than 0" }),
  proposedCompletionDate: z.preprocess(arg => {
    if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
  }, z.date()),
});

export const applyFormSchema = z.object({
  title: z.string().min(1, { message: "Required" }).max(DEFAULT_INPUT_MAX_LENGTH),
  description: z.string().min(20, { message: "At least 20 characters required" }).max(DEFAULT_TEXTAREA_MAX_LENGTH),
  milestones: z.array(milestoneSchema),
  showcaseVideoUrl: z.string().max(DEFAULT_INPUT_MAX_LENGTH).optional(),
  github: z.string().min(1, { message: "Required" }).max(DEFAULT_INPUT_MAX_LENGTH),
  email: z.string().email().max(DEFAULT_INPUT_MAX_LENGTH),
  twitter: z.string().min(1, { message: "Required" }).max(DEFAULT_INPUT_MAX_LENGTH),
  telegram: z.string().min(1, { message: "Required" }).max(DEFAULT_INPUT_MAX_LENGTH),
});

export type ApplyFormValues = z.infer<typeof applyFormSchema>;
