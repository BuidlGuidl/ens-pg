import { InferSelectModel } from "drizzle-orm";
import { milestones } from "~~/services/database/config/schema";

export type Milestone = InferSelectModel<typeof milestones>;
