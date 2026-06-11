import { requireAdmin, errorResponse, HttpError } from "@/lib/api/serverAuth";

export const dynamic = "force-dynamic";

// Only Firebase Storage hosts — guards against the proxy being used for SSRF.
const ALLOWED_HOSTS = new Set([
  "firebasestorage.googleapis.com",
  "storage.googleapis.com",
]);

/**
 * GET /api/image-proxy?url=<firebase storage url>
 *
 * Firebase Storage download URLs don't send CORS headers, so the browser
 * cannot fetch their bytes directly (needed to embed images in the catalog
 * PDF). This same-origin proxy fetches them server-side and streams them back.
 */
export async function GET(req: Request) {
  try {
    await requireAdmin(req);

    const target = new URL(req.url).searchParams.get("url");
    if (!target) throw new HttpError(400, "url параметр дутуу байна.");

    let u: URL;
    try {
      u = new URL(target);
    } catch {
      throw new HttpError(400, "url буруу байна.");
    }
    if (u.protocol !== "https:" || !ALLOWED_HOSTS.has(u.hostname)) {
      throw new HttpError(400, "Зөвшөөрөгдөөгүй зургийн эх сурвалж.");
    }

    const upstream = await fetch(u.toString());
    if (!upstream.ok) {
      throw new HttpError(502, `Зураг татаж чадсангүй (${upstream.status}).`);
    }
    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) {
      throw new HttpError(415, "Зураг биш контент.");
    }

    const buf = await upstream.arrayBuffer();
    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
