import { errorResponse, requireAdmin } from "@/lib/api/serverAuth";
import {
  computeAndCacheProfitReport,
  getCachedProfitReport,
} from "@/lib/server/profitReport";

export const dynamic = "force-dynamic";
// Бүх амжилттай захиалгыг уншиж нэгтгэнэ. Кэш 1 цаг; ?refresh=1 бол дахин тооцно.
export const maxDuration = 60;

export async function GET(req: Request) {
  try {
    await requireAdmin(req, ["admin", "manager", "accountant"]);
    const url = new URL(req.url);
    const refresh = url.searchParams.get("refresh") === "1";

    if (!refresh) {
      const cached = await getCachedProfitReport();
      if (cached) {
        return Response.json({ status: "success", data: cached, cached: true });
      }
    }
    const data = await computeAndCacheProfitReport();
    return Response.json({ status: "success", data, cached: false });
  } catch (err) {
    return errorResponse(err);
  }
}
