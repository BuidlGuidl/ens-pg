import { PublicGrant } from "~~/services/database/repositories/grants";
import { PublicLargeGrant } from "~~/services/database/repositories/large-grants";

export type Tuple<T, MaxLength extends number = 10, Current extends T[] = []> = Current["length"] extends MaxLength
  ? Current
  : Current | Tuple<T, MaxLength, [T, ...Current]>;

// Add a discriminator property to distinguish between PublicGrant and PublicLargeGrant
export type DiscriminatedPublicGrant = (PublicGrant & { type: "grant" }) | (PublicLargeGrant & { type: "largeGrant" });
