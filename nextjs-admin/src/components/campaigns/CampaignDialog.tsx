"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CampaignImageInput } from "@/components/campaigns/CampaignImageInput";
import { saveCampaign } from "@/lib/api/campaignActions";
import {
  GRAM_UNIT,
  newCampaignId,
  ticketsForGrams,
  type Campaign,
  type CampaignStatus,
} from "@/lib/firestore/campaigns";

type Props = {
  open: boolean;
  campaign: Campaign | null; // null = create
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export function CampaignDialog({ open, campaign, onOpenChange, onSaved }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{campaign ? "Аян засах" : "Шинэ сугалаат аян"}</DialogTitle>
        </DialogHeader>
        {open && (
          <CampaignForm
            key={campaign?.id ?? "new"}
            campaign={campaign}
            onCancel={() => onOpenChange(false)}
            onSaved={() => {
              onOpenChange(false);
              onSaved();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Timestamp → the "YYYY-MM-DDTHH:mm" a datetime-local input expects. */
function toLocalInput(d: Date | undefined | null): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

function CampaignForm({
  campaign,
  onCancel,
  onSaved,
}: {
  campaign: Campaign | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  // Images upload before the campaign exists, so a new one needs its id up
  // front to own a storage folder.
  const [id] = useState(() => campaign?.id ?? newCampaignId());

  const [name, setName] = useState(campaign?.name ?? "");
  const [description, setDescription] = useState(campaign?.description ?? "");
  const [status, setStatus] = useState<CampaignStatus>(campaign?.status ?? "draft");
  const [startDate, setStartDate] = useState(
    toLocalInput(campaign?.start_date?.toDate())
  );
  const [endDate, setEndDate] = useState(toLocalInput(campaign?.end_date?.toDate()));
  const [signupTickets, setSignupTickets] = useState(
    String(campaign?.signup_tickets ?? 0)
  );
  const [ticketsPerUnit, setTicketsPerUnit] = useState(
    String(campaign?.tickets_per_unit ?? 1)
  );
  const [coverImage, setCoverImage] = useState(campaign?.cover_image ?? null);
  const [campaignImage, setCampaignImage] = useState(campaign?.campaign_image ?? null);
  const [modalEnabled, setModalEnabled] = useState(campaign?.modal_enabled ?? false);
  const [modalImage, setModalImage] = useState(campaign?.modal_image ?? null);
  const [modalTitle, setModalTitle] = useState(campaign?.modal_title ?? "");
  const [modalBody, setModalBody] = useState(campaign?.modal_body ?? "");
  const [saving, setSaving] = useState(false);

  const perUnit = Number(ticketsPerUnit) || 0;
  const preview = useMemo(() => {
    const c = { tickets_per_unit: perUnit } as Campaign;
    return [0.1, 0.5, 1, 5].map((g) => ({ g, t: ticketsForGrams(c, g) }));
  }, [perUnit]);

  async function handleSave() {
    if (!name.trim()) return toast.error("Аяны нэр оруулна уу");
    if (!startDate || !endDate) return toast.error("Хугацаа оруулна уу");
    if (new Date(endDate) <= new Date(startDate)) {
      return toast.error("Дуусах хугацаа эхлэхээс хойш байх ёстой");
    }
    const signup = Number(signupTickets) || 0;
    if (signup === 0 && perUnit === 0) {
      return toast.error("Бүртгэлийн эсвэл 0.1гр тутмын сугалааны аль нэг нь 0-ээс их байх ёстой");
    }
    if (modalEnabled && (!modalTitle.trim() || !modalImage)) {
      return toast.error("Popup асаахын тулд 16:9 зураг болон гарчиг шаардлагатай");
    }

    setSaving(true);
    try {
      await saveCampaign({
        id: campaign ? campaign.id : id,
        name: name.trim(),
        description,
        status,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        signup_tickets: signup,
        tickets_per_unit: perUnit,
        cover_image: coverImage,
        campaign_image: campaignImage,
        modal_enabled: modalEnabled,
        modal_image: modalImage,
        modal_title: modalTitle.trim(),
        modal_body: modalBody.trim(),
      });
      toast.success(campaign ? "Аян шинэчлэгдлээ" : "Аян үүслээ");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Хадгалж чадсангүй");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <Section title="Зураг">
        <div className="flex flex-wrap items-start gap-4">
          <CampaignImageInput
            label="Cover зураг"
            ratio="21 / 9"
            hint="өргөн баннер"
            maxWidth="260px"
            campaignId={id}
            value={coverImage}
            onChange={setCoverImage}
          />
          <CampaignImageInput
            label="Аяны зураг"
            ratio="3 / 4"
            hint="босоо"
            maxWidth="120px"
            campaignId={id}
            value={campaignImage}
            onChange={setCampaignImage}
          />
        </div>
      </Section>

      <Section title="Үндсэн мэдээлэл">
        <div className="space-y-1.5">
          <Label>Аяны нэр</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Жишээ: Зуны алтан сугалаа"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Тайлбар</Label>
          <Textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Шагналын жагсаалт, оролцох журам…"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Эхлэх хугацаа</Label>
            <Input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Дуусах хугацаа</Label>
            <Input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Төлөв</Label>
          <Select value={status} onChange={(e) => setStatus(e.target.value as CampaignStatus)}>
            <option value="draft">Ноорог — сугалаа олгохгүй</option>
            <option value="active">Идэвхтэй — сугалаа олгоно</option>
            <option value="completed">Дууссан</option>
          </Select>
        </div>
      </Section>

      <Section title="Сугалаа олгох дүрэм">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Шинээр бүртгүүлэхэд</Label>
            <Input
              type="number"
              min={0}
              value={signupTickets}
              onChange={(e) => setSignupTickets(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">
              Аяны хугацаанд шинээр бүртгүүлсэн хэрэглэгчид нэг удаа олгоно.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>{GRAM_UNIT}гр тутамд</Label>
            <Input
              type="number"
              min={0}
              value={ticketsPerUnit}
              onChange={(e) => setTicketsPerUnit(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">
              Алт худалдан авалт баталгаажсаны дараа олгоно.
            </p>
          </div>
        </div>

        {perUnit > 0 && (
          <div className="rounded-lg border border-border-light bg-sidebar/30 px-3 py-2">
            <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Тооцооллын жишээ
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12px] tabular-nums">
              {preview.map(({ g, t }) => (
                <span key={g} className="text-muted-foreground">
                  {g}гр → <span className="font-medium text-foreground">{t}</span> сугалаа
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="text-[10px] leading-relaxed text-muted-foreground">
          Тохирлыг хуваарьгүйгээр, аяны хугацаанд хэдэн ч удаа гараар
          эхлүүлнэ. Эхлүүлэх бүрд тэр агшин хүртэл хуримтлагдсан сугалаа
          тохиролд орж идэвхгүй болно; дараа нь олгогдсон сугалаа дараагийн
          тохиролд үлдэнэ. Хүрээгүй үлдсэн грамм алдагдахгүй.
        </p>
      </Section>

      <Section title="Нүүр дэлгэцийн popup">
        <label className="flex items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            checked={modalEnabled}
            onChange={(e) => setModalEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-border-light"
          />
          Апп нээх бүрт popup харуулах
        </label>

        {modalEnabled && (
          <div className="space-y-3 border-l-2 border-border-light pl-3">
            <CampaignImageInput
              label="Popup зураг"
              ratio="16 / 9"
              maxWidth="220px"
              campaignId={id}
              value={modalImage}
              onChange={setModalImage}
            />
            <div className="space-y-1.5">
              <Label>Гарчиг</Label>
              <Input
                value={modalTitle}
                onChange={(e) => setModalTitle(e.target.value)}
                placeholder="Сугалаат аян эхэллээ!"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Тайлбар</Label>
              <Textarea
                rows={3}
                value={modalBody}
                onChange={(e) => setModalBody(e.target.value)}
                placeholder="Алт худалдан авч сугалаагаа аваарай."
              />
            </div>
          </div>
        )}
      </Section>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Болих
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Хадгалах
        </Button>
      </DialogFooter>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}
