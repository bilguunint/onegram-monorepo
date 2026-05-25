import {
  collection,
  doc,
  getDocs,
  Timestamp,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";

export type InvestmentUser = {
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
};

export type Investment = {
  id: string;
  userId?: string;
  user?: InvestmentUser;
  balance?: number;
  status?: string;
  verifiedAdmin?: string;
  verifiedId?: string;
  createdAt?: Timestamp | null;
  endDate?: Timestamp | null;
  closedDate?: Timestamp | string | null;
  closedBy?: string;
  attachedFile?: string;
};

function mapInvestmentDoc(id: string, raw: DocumentData): Investment {
  return {
    id,
    userId: raw.userId,
    user: raw.user as InvestmentUser | undefined,
    balance: raw.balance,
    status: raw.status,
    verifiedAdmin: raw.verifiedAdmin,
    verifiedId: raw.verifiedId,
    createdAt: raw.createdAt ?? null,
    endDate: raw.endDate ?? null,
    closedDate: raw.closedDate ?? null,
    closedBy: raw.closedBy,
    attachedFile: raw.attachedFile,
  };
}

export async function fetchInvestments(): Promise<Investment[]> {
  const snap = await getDocs(collection(getDb(), "investments"));
  return snap.docs.map((d) => mapInvestmentDoc(d.id, d.data()));
}

export async function updateInvestmentEndDate(
  investmentId: string,
  endDate: Date
): Promise<void> {
  await updateDoc(doc(getDb(), "investments", investmentId), {
    endDate: Timestamp.fromDate(endDate),
  });
}
