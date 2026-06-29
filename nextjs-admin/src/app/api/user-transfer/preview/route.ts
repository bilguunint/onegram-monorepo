import { requireAdmin, errorResponse, HttpError } from "@/lib/api/serverAuth";
import { buildPreview } from "@/lib/server/userTransfer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/user-transfer/preview
 * Body: { sourceUid, targetUid }
 * Admin-only. Counts everything that would move; performs NO writes.
 */
export async function POST(req: Request) {
  try {
    await requireAdmin(req, ["admin"]);

    const body = (await req.json().catch(() => null)) as {
      sourceUid?: string;
      targetUid?: string;
    } | null;
    const sourceUid = body?.sourceUid?.trim();
    const targetUid = body?.targetUid?.trim();

    if (!sourceUid || !targetUid) {
      throw new HttpError(400, "sourceUid ба targetUid шаардлагатай.");
    }
    if (sourceUid === targetUid) {
      throw new HttpError(400, "Эх ба зорилтот хэрэглэгч ижил байж болохгүй.");
    }

    const preview = await buildPreview(sourceUid, targetUid);
    if (!preview.source.exists) throw new HttpError(404, "Эх хэрэглэгч олдсонгүй.");
    if (!preview.target.exists) {
      throw new HttpError(404, "Зорилтот хэрэглэгч олдсонгүй.");
    }

    return Response.json({ status: "success", data: preview });
  } catch (err) {
    return errorResponse(err);
  }
}
