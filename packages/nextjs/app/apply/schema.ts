import { DEFAULT_INPUT_MAX_LENGTH, DEFAULT_TEXTAREA_MAX_LENGTH } from "./consts";
import * as z from "zod";

export const applyFormSchema = z.object({
  title: z.string().min(1, { message: "Required" }).max(DEFAULT_INPUT_MAX_LENGTH),
  description: z.string().min(20, { message: "At least 20 symbols required" }).max(DEFAULT_TEXTAREA_MAX_LENGTH),
  milestones: z.string().min(20, { message: "At least 20 symbols required" }).max(DEFAULT_TEXTAREA_MAX_LENGTH),
  showcaseVideoUrl: z.string().max(DEFAULT_INPUT_MAX_LENGTH).optional(),
  requestedFunds: z.string().max(DEFAULT_INPUT_MAX_LENGTH),
  github: z.string().min(1, { message: "Required" }).max(DEFAULT_INPUT_MAX_LENGTH),
  email: z.string().email().max(DEFAULT_INPUT_MAX_LENGTH),
  twitter: z.string().max(DEFAULT_INPUT_MAX_LENGTH).optional(),
  telegram: z.string().max(DEFAULT_INPUT_MAX_LENGTH).optional(),
});

const getRequiredFields = (schema: z.AnyZodObject) => {
  const schemaShape = schema.shape;
  return Object.keys(schemaShape).filter(key => !schemaShape[key].isOptional());
};

export const applyFormRequiredFields = getRequiredFields(applyFormSchema);

export type FormValues = z.infer<typeof applyFormSchema>;