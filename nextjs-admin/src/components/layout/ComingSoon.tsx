import { Construction } from "lucide-react";

type Props = {
  title: string;
  description?: string;
};

export function ComingSoon({ title, description }: Props) {
  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-[18px] font-semibold text-foreground">{title}</h1>
        {description && (
          <p className="text-[13px] text-muted-foreground">{description}</p>
        )}
      </header>

      <div className="rounded-xl border border-dashed border-border-light bg-card px-4 py-12 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-600">
          <Construction className="h-5 w-5" />
        </div>
        <p className="mt-3 text-[13px] text-foreground/80">Удахгүй нэмэгдэнэ</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Энэ хуудас Phase 2-д хэрэгжинэ.
        </p>
      </div>
    </div>
  );
}
