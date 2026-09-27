import { errorResponse, requireAdmin } from "@/lib/api/serverAuth";
import {
  computeAndCacheGoldReserveReport,
  getCachedGoldReserveReport,
} from "@/lib/server/goldReserveReport";

export const dynamic = "force-dynamic";
// Бүх амжилттай захиалга + авалтыг уншиж FIFO тооцдог тул хэдэн секунд
// зарцуулна. Кэш 6 цаг хүчинтэй; ?refresh=1 бол дахин тооцно.
export const maxDuration = 60;

export async function GET(req: Request) {
  try {
    await requireAdmin(req, ["admin", "manager", "accountant"]);
    const url = new URL(req.url);
    const refresh = url.searchParams.get("refresh") === "1";

    if (!refresh) {
      const cached = await getCachedGoldReserveReport();
      if (cached) {
        return Response.json({ status: "success", data: cached, cached: true });
      }
    }
    const data = await computeAndCacheGoldReserveReport();
    return Response.json({ status: "success", data, cached: false });
  } catch (err) {
    return errorResponse(err);
  }
}
