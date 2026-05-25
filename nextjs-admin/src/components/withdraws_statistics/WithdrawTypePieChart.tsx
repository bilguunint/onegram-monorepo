"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { WithdrawAnalytics } from "@/lib/firestore/withdrawAnalytics";

type Slice = {
  name: string;
  value: number;
  color: string;
};

type Props = {
  data: WithdrawAnalytics["by_withdraw_type"];
};

export function WithdrawTypePieChart({ data }: Props) {
  const slices: Slice[] = [];
  if (data?.sold_to_us?.count) {
    slices.push({
      name: "Манайд зарсан",
      value: data.sold_to_us.count,
      color: "#34c38f",
    });
  }
  if (data?.taken_physically?.count) {
    slices.push({
      name: "Биетээр авсан",
      value: data.taken_physically.count,
      color: "#f46a6a",
    });
  }
  if (data?.unspecified?.count) {
    slices.push({
      name: "Тодорхойгүй",
      value: data.unspecified.count,
      color: "#f1b44c",
    });
  }

  if (slices.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-[12px] text-muted-foreground">
        Хүсэлтийн төрлийн мэдээлэл алга
      </div>
    );
  }

  const total = slices.reduce((s, x) => s + x.value, 0);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              innerRadius={40}
              paddingAngle={2}
              stroke="var(--card)"
              strokeWidth={2}
            >
              {slices.map((s) => (
                <Cell key={s.name} fill={s.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border-light)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value, name) => {
                const v = typeof value === "number" ? value : Number(value) || 0;
                const pct = total ? ((v / total) * 100).toFixed(1) : "0";
                return [`${v} (${pct}%)`, String(name)];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[12px]">
        {slices.map((s) => (
          <li key={s.name} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: s.color }}
            />
            <span className="text-muted-foreground">{s.name}</span>
            <span className="font-medium text-foreground tabular-nums">
              {s.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
