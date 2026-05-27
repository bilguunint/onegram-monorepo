import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { VALID_ROLES, isValidRole } from "@/lib/auth/roles";
import { errorResponse, HttpError, requireAdmin } from "@/lib/api/serverAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin(req, ["admin"]);
    const snap = await adminDb.collection("admins").get();
    const admins = snap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      return {
        uid: d.id,
        name: typeof data.name === "string" ? data.name : "",
        email: typeof data.email === "string" ? data.email : "",
        role: typeof data.role === "string" ? data.role : "",
      };
    });
    return Response.json({ status: "success", data: admins });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin(req, ["admin"]);
    const body = (await req.json().catch(() => null)) as
      | { email?: string; password?: string; name?: string; role?: string }
      | null;
    if (!body) throw new HttpError(400, "Хүсэлтийн биед JSON байх ёстой.");

    const email = body.email?.trim();
    const password = body.password ?? "";
    const name = body.name?.trim() ?? "";
    const role = body.role;

    if (!email) throw new HttpError(400, "И-мэйл хаягийг бөглөнө үү.");
    if (!password || password.length < 6) {
      throw new HttpError(400, "Нууц үг 6-аас дээш тэмдэгттэй байх ёстой.");
    }
    if (!name) throw new HttpError(400, "Нэрийг бөглөнө үү.");
    if (!isValidRole(role)) {
      throw new HttpError(
        400,
        `Role нь дараах утгуудын нэг байх ёстой: ${VALID_ROLES.join(", ")}.`
      );
    }

    let userRecord;
    try {
      userRecord = await adminAuth.createUser({
        email,
        password,
        displayName: name,
        emailVerified: true,
      });
    } catch (e) {
      const code =
        e && typeof e === "object" && "code" in e ? String((e as { code: unknown }).code) : "";
      if (code === "auth/email-already-exists") {
        throw new HttpError(409, "Энэ и-мэйлээр бүртгэлтэй хэрэглэгч байна.");
      }
      if (code === "auth/invalid-email") {
        throw new HttpError(400, "И-мэйл хаяг буруу байна.");
      }
      if (code === "auth/weak-password") {
        throw new HttpError(400, "Нууц үг хэт сул байна.");
      }
      throw e;
    }

    try {
      await adminDb.collection("admins").doc(userRecord.uid).set({
        uid: userRecord.uid,
        email,
        name,
        role,
      });
    } catch (e) {
      await adminAuth.deleteUser(userRecord.uid).catch(() => {});
      throw e;
    }

    return Response.json(
      {
        status: "success",
        data: { uid: userRecord.uid, email, name, role },
      },
      { status: 201 }
    );
  } catch (err) {
    return errorResponse(err);
  }
}
