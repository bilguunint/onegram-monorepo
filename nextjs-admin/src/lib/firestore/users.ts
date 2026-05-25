import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  type Timestamp,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";

export type UserCategory = "has_gold" | "others";

export type AdminUser = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  registration_number: string;
  balance: {
    gold: number;
    silver: number;
    saving: number;
  };
  invest_total: number;
  created_at: Timestamp | null;
  updated_at: Timestamp | null;
};

type RawUser = Partial<Omit<AdminUser, "balance">> & {
  balance?: Partial<AdminUser["balance"]>;
};

function mapUserDoc(id: string, raw: RawUser): AdminUser {
  return {
    id,
    first_name: raw.first_name ?? "",
    last_name: raw.last_name ?? "",
    email: raw.email ?? "",
    phone: raw.phone ?? "",
    registration_number: raw.registration_number ?? "",
    balance: {
      gold: raw.balance?.gold ?? 0,
      silver: raw.balance?.silver ?? 0,
      saving: raw.balance?.saving ?? 0,
    },
    invest_total: raw.invest_total ?? 0,
    created_at: raw.created_at ?? null,
    updated_at: raw.updated_at ?? null,
  };
}

export async function fetchUsersByCategory(
  category: UserCategory
): Promise<AdminUser[]> {
  const usersCol = collection(getDb(), "users");
  const q =
    category === "has_gold"
      ? query(usersCol, where("balance.gold", ">", 0))
      : query(usersCol, where("balance.gold", "==", 0));
  const snap = await getDocs(q);
  const users = snap.docs.map((d) => mapUserDoc(d.id, d.data() as RawUser));
  users.sort((a, b) => {
    const ta = a.created_at?.toMillis?.() ?? 0;
    const tb = b.created_at?.toMillis?.() ?? 0;
    return tb - ta;
  });
  return users;
}

export type LedgerTransaction = {
  type: string;
  amount: number;
  running_balance: number;
  created_at: Timestamp | string | null;
};

export type LedgerDoc = {
  balance_gold: number;
  calculated_balance: number;
  is_balanced: boolean;
  transactions: LedgerTransaction[];
};

export async function fetchUserLedger(userId: string): Promise<LedgerDoc | null> {
  const snap = await getDoc(doc(getDb(), "ledger_transactions", userId));
  if (!snap.exists()) return null;
  const data = snap.data() as Partial<LedgerDoc>;
  return {
    balance_gold: data.balance_gold ?? 0,
    calculated_balance: data.calculated_balance ?? 0,
    is_balanced: data.is_balanced ?? false,
    transactions: Array.isArray(data.transactions) ? data.transactions : [],
  };
}
