import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { errorResponse, HttpError, requireAdmin } from "@/lib/api/serverAuth";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ uid: string }> }
) {
  try {
    const requester = await requireAdmin(req, ["admin"]);
    const { uid } = await ctx.params;
    if (!uid) throw new HttpError(400, "uid дутуу байна.");
    if (uid === requester.uid) {
      throw new HttpError(400, "Өөрийгөө устгах боломжгүй.");
    }

    await adminDb.collection("admins").doc(uid).delete();
    try {
      await adminAuth.deleteUser(uid);
    } catch (e) {
      const code =
        e && typeof e === "object" && "code" in e ? String((e as { code: unknown }).code) : "";
      if (code !== "auth/user-not-found") throw e;
    }

    return Response.json({ status: "success" });
  } catch (err) {
    return errorResponse(err);
  }
}
