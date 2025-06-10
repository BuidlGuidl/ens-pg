import { NextRequest } from "next/server";
import { createPrivateNoteRequest } from "~~/utils/privateNote";

export async function POST(req: NextRequest, { params }: { params: { stageId: string } }) {
  return createPrivateNoteRequest(req, { params, isLargeGrant: true });
}
