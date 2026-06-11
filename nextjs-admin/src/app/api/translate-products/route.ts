import { requireAdmin, errorResponse, HttpError } from "@/lib/api/serverAuth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

type InItem = { id: string; name?: string; description?: string };
type OutItem = { id: string; name: string; description: string };

const SYSTEM_PROMPT =
  "You are a professional product-catalog translator. Translate the given " +
  "Mongolian (or other) product names and descriptions into natural, " +
  "fluent Simplified Chinese (简体中文) suitable for a premium product " +
  "presentation. Keep numbers, units and measurements intact. Do not add or " +
  "remove information. Return ONLY a JSON object of the exact shape " +
  '{"translations":[{"id":string,"name":string,"description":string}]} ' +
  "with one entry per input item, preserving each id.";

/**
 * POST /api/translate-products
 * Body: { items: [{ id, name, description }] }
 * Returns: { status:"success", data: [{ id, name, description }] }  (Chinese)
 *
 * Uses OpenAI (model from OPENAI_TRANSLATE_MODEL, default "gpt-5.5").
 * Requires OPENAI_API_KEY in the server environment.
 */
export async function POST(req: Request) {
  try {
    await requireAdmin(req);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new HttpError(
        500,
        "OPENAI_API_KEY тохируулаагүй байна. Орчуулга хийх боломжгүй."
      );
    }
    const model = process.env.OPENAI_TRANSLATE_MODEL || "gpt-5.5";

    const body = (await req.json().catch(() => null)) as {
      items?: InItem[];
    } | null;
    const items = body?.items;
    if (!Array.isArray(items) || items.length === 0) {
      throw new HttpError(400, "Орчуулах бараа алга байна.");
    }

    const payload = items.map((it) => ({
      id: String(it.id),
      name: String(it.name ?? ""),
      description: String(it.description ?? ""),
    }));

    // gpt-5.x are reasoning models — without this they spend seconds "thinking"
    // and can blow the function timeout (504). Translation needs no reasoning.
    const isGpt5 = /^gpt-5/i.test(model);

    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        ...(isGpt5 ? { reasoning_effort: "none" } : {}),
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: JSON.stringify({ items: payload }) },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new HttpError(
        502,
        `OpenAI алдаа (${res.status}). ${detail.slice(0, 300)}`
      );
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content ?? "";

    let parsed: { translations?: OutItem[] };
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new HttpError(502, "OpenAI-н хариуг уншиж чадсангүй.");
    }

    const translations = Array.isArray(parsed.translations)
      ? parsed.translations
      : [];
    const byId = new Map(translations.map((t) => [String(t.id), t]));

    // Fall back to the original text for any item the model dropped.
    const result: OutItem[] = payload.map((p) => {
      const t = byId.get(p.id);
      return {
        id: p.id,
        name: (t?.name && String(t.name)) || p.name,
        description: (t?.description && String(t.description)) || p.description,
      };
    });

    return Response.json({ status: "success", data: result });
  } catch (err) {
    return errorResponse(err);
  }
}
