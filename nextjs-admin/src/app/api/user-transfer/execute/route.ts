import { requireAdmin, errorResponse, HttpError } from "@/lib/api/serverAuth";
import { executeTransfer, loadUserSummary } from "@/lib/server/userTransfer";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * POST /api/user-transfer/execute
 * Body: { sourceUid, targetUid, confirmPhone }
 * Admin-only. Moves ALL of the source user's data into the target user and
 * tombstones the source. `confirmPhone` must match the source user's phone
 * (a human-verified confirmation that the right account is being emptied).
 */
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req, ["admin"]);

    const body = (await req.json().catch(() => null)) as {
      sourceUid?: string;
      targetUid?: string;
      confirmPhone?: string;
    } | null;
    const sourceUid = body?.sourceUid?.trim();
    const targetUid = body?.targetUid?.trim();
    const confirmPhone = (body?.confirmPhone ?? "").trim();

    if (!sourceUid || !targetUid) {
      throw new HttpError(400, "sourceUid ба targetUid шаардлагатай.");
    }
    if (sourceUid === targetUid) {
      throw new HttpError(400, "Эх ба зорилтот хэрэглэгч ижил байж болохгүй.");
    }

    const src = await loadUserSummary(sourceUid);
    if (!src.exists) throw new HttpError(404, "Эх хэрэглэгч олдсонгүй.");

    const expected = (src.phone || src.uid).trim();
    if (!expected) {
      throw new HttpError(
        400,
        "Эх хэрэглэгчид утас/UID байхгүй тул баталгаажуулах боломжгүй."
      );
    }
    if (confirmPhone !== expected) {
      throw new HttpError(
        400,
        "Баталгаажуулалт буруу — эх хэрэглэгчийн утасны дугаарыг яг бичнэ үү."
      );
    }

    const result = await executeTransfer(sourceUid, targetUid, admin);
    return Response.json({ status: "success", data: result });
  } catch (err) {
    return errorResponse(err);
  }
}
