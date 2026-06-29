import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
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

export async function fetchUserById(uid: string): Promise<AdminUser | null> {
  const snap = await getDoc(doc(getDb(), "users", uid.trim()));
  if (!snap.exists()) return null;
  return mapUserDoc(snap.id, snap.data() as RawUser);
}

/** Find users by exact uid (doc id), phone or email — for the transfer tool. */
export async function lookupUsers(term: string): Promise<AdminUser[]> {
  const t = term.trim();
  if (!t) return [];
  const usersCol = collection(getDb(), "users");
  const results = new Map<string, AdminUser>();
  const add = (id: string, raw: RawUser) =>
    results.set(id, mapUserDoc(id, raw));

  // by uid (document id)
  const byId = await getDoc(doc(getDb(), "users", t));
  if (byId.exists()) add(byId.id, byId.data() as RawUser);

  // by phone + email (exact). Email is also tried lower-cased.
  const emailLower = t.toLowerCase();
  const queries = [
    getDocs(query(usersCol, where("phone", "==", t), limit(10))),
    getDocs(query(usersCol, where("email", "==", t), limit(10))),
  ];
  if (emailLower !== t) {
    queries.push(
      getDocs(query(usersCol, where("email", "==", emailLower), limit(10)))
    );
  }
  const snaps = await Promise.all(queries);
  for (const snap of snaps) {
    for (const d of snap.docs) add(d.id, d.data() as RawUser);
  }

  return [...results.values()];
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
