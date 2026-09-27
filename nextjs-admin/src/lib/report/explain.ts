// English explanations shown under every item on the investor Report page,
// regardless of the selected language. They say what each figure means and
// how it is calculated, so an investor can read the page without a guide.

export const EXPLAIN = {
  // key metrics
  kRevenue: "Total cash received for gold sold through the app since launch (includes the premium over spot).",
  kUsers: "Registered accounts. 'Activated' = share of accounts that hold any gold today.",
  kGoldSold: "Grams of gold sold through the app since launch, counting only paid and admin-verified orders.",
  kBuyback: "Cash paid to customers who sold gold back to us instead of taking physical delivery.",
  kOrders: "Orders that were paid and verified. The percentage is against all orders ever created, including abandoned ones.",

  // this month & price
  secThisMonth: "Current calendar month to date, compared with the full previous month.",
  mOrders: "Paid and verified orders this month.",
  mGoldSold: "Grams sold this month.",
  mNewUsers: "Accounts created this month.",
  secGoldPrice: "Our per-gram selling rate for gold (₮), updated daily; the chart shows the last 30 days.",

  // growth charts
  secMonthlyRevenue: "Gross sales per calendar month. Shows seasonality and the growth trend.",
  secDailyRevenue: "Gross sales per day. Use the period buttons to zoom.",
  secUserGrowth: "New accounts created per day.",
  secMonthly: "Monthly totals: revenue, verified orders out of all orders, grams of gold and silver sold.",

  // reserve & liability
  secReserve:
    "Gold bought in the app stays in the customer's balance until they redeem it. The company must hold that much physical gold: it is a liability. This block shows the size of that liability and how fast it moves.",
  kReserve: "Sum of all customer gold balances + gold under investment contracts + gifts not yet accepted. The physical gold the company must hold today.",
  kReserveValue: "Required reserve × today's per-gram rate.",
  kFundedUsers: "Customers whose gold balance is above zero.",
  kPhysicalOut: "Grams handed to customers as physical gold since launch (redemptions typed 'physical' plus older untyped redemptions).",
  kSoldBack: "Grams customers sold back to us since launch. This gold stays in the vault but the liability falls by the same amount.",
  kRedemptionRate: "All-time grams redeemed ÷ all-time grams sold. The share of gold sold that has since left customer balances.",
  kCoverMonths: "Required reserve ÷ average monthly redemptions over the last 6 months. How long the reserve would last with zero new sales.",

  // holding behaviour
  secHolding:
    "Whether customers treat the app as savings (hold for a long time) or as a shop (buy and collect). Holding periods come from matching each redemption to that customer's earliest purchases (FIFO).",
  kNeverRedeemed: "Buyers who have never redeemed any gold: everything they bought is still in the app.",
  kRepeatBuyers: "Buyers with two or more paid orders.",
  kAvgHold: "Gram-weighted average number of days between purchase and redemption, for gold already redeemed.",
  kAvgAge: "Gram-weighted average number of days since purchase, for gold still held today.",
  kOrdersPerBuyer: "Average lifetime paid orders per buyer.",
  kAvgOrder: "Average grams of gold per paid order.",
  kTop100: "Share of the required reserve held by the 100 largest balances. A high share means a few customers can move the reserve.",

  // yearly table
  secYearly:
    "One row per calendar year. Revenue is gross sales; retention is the share of the previous year's buyers who bought again; reserve change is grams sold minus grams redeemed.",

  // custody
  secCustody: "Distribution of customer gold balances: how many customers hold how much.",
  totalGoldInSystem: "Sum of all customer gold balances right now.",
  custodyValue: "Total gold in system × today's per-gram rate.",
  withGold: "Customers with a positive gold balance.",
  penetration: "Funded users ÷ total users.",

  // installment portfolio
  secPortfolio:
    "Physical products (mostly silverware) bought on daily installment plans. Shows the size of the book and how well customers keep up with payments.",
  gmv: "Total contract value of all installment plans ever created.",
  collected: "Cash actually received against those plans.",
  activePlans: "Plans still being paid.",
  overduePlans: "Active plans that are behind schedule.",
  onTimeRate: "Active plans not behind schedule ÷ all active plans.",

  // investments
  secInvestments: "Customers who moved gold from their balance into a fixed-term investment contract with the company.",
  kInvestCount: "Number of contracts ever opened.",
  kInvestGrams: "Grams of gold currently inside open contracts. Part of the required reserve.",
  kInvestActive: "Contracts currently running.",

  // redemption mix
  secRedemption: "How customers take gold out: physical delivery vs. selling back to us. Recorded since February 2026; earlier redemptions are untyped.",
  soldToUs: "Count and grams of redemptions where the customer sold gold back to us for cash.",
  takenPhysically: "Count and grams of redemptions delivered as physical gold.",
  unspecified: "Redemptions recorded before the type was tracked.",
  avgBuybackRate: "Average price per gram we paid on buy-backs.",
} as const;

export type ExplainKey = keyof typeof EXPLAIN;
