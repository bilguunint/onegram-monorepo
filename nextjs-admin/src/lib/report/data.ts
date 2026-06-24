// Single aggregator for the investor Report page. Extends the dashboard
// snapshot with the installment portfolio, investments and lifetime withdraw
// (buy-back) analytics, computing the derived investor metrics client-side.

import {
  fetchDashboardSnapshot,
  type DashboardSnapshot,
} from "@/lib/firestore/analytics";
import {
  fetchWithdrawAnalytics,
  type WithdrawAnalytics,
} from "@/lib/firestore/withdrawAnalytics";
import {
  fetchAllProductPurchases,
  type ProductPurchase,
} from "@/lib/firestore/productPurchases";
import { fetchInvestments, type Investment } from "@/lib/firestore/investments";
import { purchaseIsOverdue } from "@/lib/products";
import { getInvestmentStatusKey } from "@/lib/investments";
import { currentMonthKey, previousMonthKey } from "@/lib/format";

export type PortfolioMetrics = {
  total: number;
  active: number;
  completed: number;
  delivered: number;
  cancelled: number;
  /** Sum of total_price across all plans (installment GMV). */
  gmv: number;
  /** Sum of paid_amount across all plans (cash collected). */
  collected: number;
  /** Sum of refund_fee across cancelled plans (fee revenue). */
  feeRevenue: number;
  /** Active plans flagged overdue (10-day payment gap). */
  overdue: number;
  /** Share of active plans that are NOT overdue, 0..100 (null if no active). */
  onTimeRate: number | null;
  /** collected / gmv * 100, 0..100 (null if gmv 0). */
  collectionRate: number | null;
};

export type InvestmentMetrics = {
  count: number;
  /** Sum of balance (grams of gold under investment). */
  totalGrams: number;
  active: number;
  closed: number;
  expired: number;
};

export type ReportData = {
  snapshot: DashboardSnapshot;
  withdrawOverall: WithdrawAnalytics | null;
  portfolio: PortfolioMetrics;
  investments: InvestmentMetrics;
};

function computePortfolio(purchases: ProductPurchase[]): PortfolioMetrics {
  let active = 0,
    completed = 0,
    delivered = 0,
    cancelled = 0,
    gmv = 0,
    collected = 0,
    feeRevenue = 0,
    overdue = 0;

  for (const p of purchases) {
    gmv += Number(p.total_price || 0);
    collected += Number(p.paid_amount || 0);
    feeRevenue += Number(p.refund_fee || 0);
    switch (p.status) {
      case "active":
        active += 1;
        if (purchaseIsOverdue(p)) overdue += 1;
        break;
      case "completed":
        completed += 1;
        break;
      case "delivered":
        delivered += 1;
        break;
      case "cancelled":
        cancelled += 1;
        break;
    }
  }

  return {
    total: purchases.length,
    active,
    completed,
    delivered,
    cancelled,
    gmv,
    collected,
    feeRevenue,
    overdue,
    onTimeRate: active > 0 ? ((active - overdue) / active) * 100 : null,
    collectionRate: gmv > 0 ? (collected / gmv) * 100 : null,
  };
}

function computeInvestments(items: Investment[]): InvestmentMetrics {
  let totalGrams = 0,
    active = 0,
    closed = 0,
    expired = 0;
  for (const inv of items) {
    totalGrams += Number(inv.balance || 0);
    switch (getInvestmentStatusKey(inv)) {
      case "active":
        active += 1;
        break;
      case "closed":
        closed += 1;
        break;
      case "expired":
        expired += 1;
        break;
    }
  }
  return { count: items.length, totalGrams, active, closed, expired };
}

export async function fetchReportData(): Promise<ReportData> {
  const [snapshot, withdrawOverall, purchases, investments] = await Promise.all([
    fetchDashboardSnapshot(currentMonthKey(), previousMonthKey()),
    fetchWithdrawAnalytics("overall").catch(() => null),
    fetchAllProductPurchases().catch(() => [] as ProductPurchase[]),
    fetchInvestments().catch(() => [] as Investment[]),
  ]);

  return {
    snapshot,
    withdrawOverall,
    portfolio: computePortfolio(purchases),
    investments: computeInvestments(investments),
  };
}
