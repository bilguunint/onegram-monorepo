"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/AuthProvider";
import { defaultRouteForRole } from "@/lib/auth/roles";

export default function LoginPage() {
  const { adminData, loading, signIn } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && adminData) {
      router.replace(defaultRouteForRole(adminData.role));
    }
  }, [adminData, loading, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const data = await signIn(email.trim(), password);
      toast.success(`Тавтай морил, ${data.name}`);
      router.replace(defaultRouteForRole(data.role));
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Нэвтрэхэд алдаа гарлаа.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-10"
      style={{
        backgroundImage:
          "linear-gradient(to bottom right, var(--color-primary-50), var(--color-background) 45%, var(--color-sidebar))",
      }}
    >
      <div className="w-full max-w-[420px] rounded-2xl border border-border-light bg-card p-7 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-300 to-primary-500 text-white shadow-sm">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div className="text-center">
            <h1 className="text-[18px] font-semibold text-foreground">
              Onegram Admin
            </h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Үргэлжлүүлэхийн тулд админ эрхээр нэвтэрнэ үү
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-[12px] font-medium text-muted-foreground"
            >
              И-мэйл
            </label>
            <input
              id="email"
              type="email"
              value={email}
              autoComplete="email"
              required
              disabled={submitting}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full rounded-lg border border-border-light bg-input px-3 py-2.5 text-[13px] text-foreground outline-none transition-colors focus:border-primary-400 disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-[12px] font-medium text-muted-foreground"
            >
              Нууц үг
            </label>
            <input
              id="password"
              type="password"
              value={password}
              autoComplete="current-password"
              required
              disabled={submitting}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border-light bg-input px-3 py-2.5 text-[13px] text-foreground outline-none transition-colors focus:border-primary-400 disabled:opacity-50"
            />
          </div>

          {error && (
            <div className="rounded-md bg-[#fcdce5] px-3 py-2 text-[12px] text-[#a8265a]">
              {error}
            </div>
          )}

          <label className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-border-light accent-primary"
            />
            Сануулах
          </label>

          <button
            type="submit"
            disabled={submitting || !email || !password}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary-600 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Нэвтэрч байна...
              </>
            ) : (
              "Нэвтрэх"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} Onegram. Бүх эрх хуулиар хамгаалагдсан.
        </p>
      </div>
    </div>
  );
}
