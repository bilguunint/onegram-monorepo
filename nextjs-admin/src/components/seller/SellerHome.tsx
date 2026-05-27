"use client";

import { useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthProvider";
import { SellerVerifyDialog } from "./SellerVerifyDialog";

export function SellerHome() {
  const { adminData } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-[calc(100vh-220px)] flex-col items-center justify-center gap-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
          <ShieldCheck className="h-7 w-7" />
        </span>
        <h1 className="text-[20px] font-semibold text-foreground">
          Сайн байна уу{adminData?.name ? `, ${adminData.name}` : ""}!
        </h1>
        <p className="max-w-[420px] text-[13px] text-muted-foreground">
          Биетээр авах хүсэлтийг баталгаажуулахын тулд харилцагчаас 5 оронтой
          код аваад доорх товчийг дарна уу.
        </p>
      </div>

      <Button
        size="lg"
        onClick={() => setOpen(true)}
        className="h-14 w-full max-w-[320px] gap-2 text-[15px]"
      >
        <KeyRound className="h-5 w-5" />
        Код оруулах
      </Button>

      <SellerVerifyDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
