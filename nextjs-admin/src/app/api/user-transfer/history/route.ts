import { requireAdmin, errorResponse } from "@/lib/api/serverAuth";
import { listMigrations } from "@/lib/server/userTransfer";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * GET /api/user-transfer/history
 * Admin-only. Returns the recent account-transfer audit records.
 */
export async function GET(req: Request) {
  try {
    await requireAdmin(req, ["admin"]);
    const data = await listMigrations(100);
    return Response.json({ status: "success", data });
  } catch (err) {
    return errorResponse(err);
  }
}
