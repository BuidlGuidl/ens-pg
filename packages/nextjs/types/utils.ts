import {
  PublicGrant,
  getAllGrants,
  getAllGrantsWithStagesAndPrivateNotes,
  getBuilderGrants,
} from "~~/services/database/repositories/grants";
import {
  PublicLargeGrant,
  getAllLargeGrants,
  getAllLargeGrantsWithStagesAndPrivateNotes,
  getBuilderLargeGrants,
} from "~~/services/database/repositories/large-grants";

export type Tuple<T, MaxLength extends number = 10, Current extends T[] = []> = Current["length"] extends MaxLength
  ? Current
  : Current | Tuple<T, MaxLength, [T, ...Current]>;

// Add a discriminator property to distinguish between PublicGrant and PublicLargeGrant
export type DiscriminatedPublicGrant = (PublicGrant & { type: "grant" }) | (PublicLargeGrant & { type: "largeGrant" });

export type BuilderGrant = Awaited<ReturnType<typeof getBuilderGrants>>[0];

export type BuilderLargeGrant = Awaited<ReturnType<typeof getBuilderLargeGrants>>[0];

// Add a discriminator property to distinguish between Grant and LargeGrant
export type DiscriminatedBuilderGrant =
  | (BuilderGrant & { type: "grant" })
  | (BuilderLargeGrant & { type: "largeGrant" });

export type AdminGrant = Awaited<ReturnType<typeof getAllGrants>>[0];

export type AdminLargeGrant = Awaited<ReturnType<typeof getAllLargeGrants>>[0];

// Add a discriminator property to distinguish between Grant and LargeGrant
export type DiscriminatedAdminGrant = (AdminGrant & { type: "grant" }) | (AdminLargeGrant & { type: "largeGrant" });

export type GrantWithStagesAndPrivateNotes = Awaited<ReturnType<typeof getAllGrantsWithStagesAndPrivateNotes>>[0];

export type LargeGrantWithStagesAndPrivateNotes = Awaited<
  ReturnType<typeof getAllLargeGrantsWithStagesAndPrivateNotes>
>[0];

export type DiscriminatedGrantWithStagesAndPrivateNotes =
  | (GrantWithStagesAndPrivateNotes & { type: "grant" })
  | (LargeGrantWithStagesAndPrivateNotes & { type: "largeGrant" });
