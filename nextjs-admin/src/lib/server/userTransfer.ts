import "server-only";
import { FieldValue, Timestamp, type Firestore } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { RequesterAdmin } from "@/lib/api/serverAuth";

// ---------------------------------------------------------------------------
// User-data transfer (account merge) — moves ALL of a source user's data into
// a target user, then tombstones the source. Used when a customer changed
// phone number and has a new account. Server-only (firebase-admin).
//
// Safety design:
//  - PREVIEW counts everything without writing.
//  - EXECUTE is resumable & guarded against double-counting: balance/ledger/
//    investment merge runs LAST inside a transaction that sets
//    `merged_into` on the source; re-running after a partial failure re-does
//    the idempotent reassigns and skips the already-done financial merge.
//  - A full audit record is written to `user_migrations/{id}`.
// ---------------------------------------------------------------------------

const db: Firestore = adminDb;

export type Balance = { gold: number; silver: number; saving: number };

export type UserSummary = {
  uid: string;
  exists: boolean;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  balance?: Balance;
  invest_total?: number;
  merged_into?: string | null;
  merge_in_progress?: string | null;
};

export type TransferCounts = {
  orders: number;
  withdraws: number;
  product_purchases: number;
  pending_invoices: number;
  security_logs: number;
  gifts_as_sender: number;
  gifts_as_receiver: number;
  notifications: number;
  lottery_tickets: number;
  campaign_tickets: number;
  campaign_participants: number;
  center_tree_orders: number;
  center_donations: number;
  installment_cancel_requests: number;
  ledger_entries: number;
  investment: boolean;
};

export type TransferPreview = {
  source: UserSummary;
  target: UserSummary;
  counts: TransferCounts;
  alreadyMerged: boolean;
};

function num(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function round6(n: number): number {
  return Math.round((n + Number.EPSILON) * 1_000_000) / 1_000_000;
}

function readBalance(data: Record<string, unknown> | undefined): Balance {
  const b = ((data?.balance as Record<string, unknown>) ?? {}) as Record<string, unknown>;
  return { gold: num(b.gold), silver: num(b.silver), saving: num(b.saving) };
}

type Snap = {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
};

function readSnap(data: Record<string, unknown> | undefined): Snap {
  return {
    first_name: String(data?.first_name ?? ""),
    last_name: String(data?.last_name ?? ""),
    phone: String(data?.phone ?? ""),
    email: String(data?.email ?? ""),
  };
}

function ledgerSum(txs: Record<string, unknown>[]): number {
  return txs.reduce((s, t) => round6(s + num(t.amount)), 0);
}

function tsMillis(v: unknown): number | null {
  if (!v) return null;
  const o = v as { toMillis?: () => number; seconds?: number };
  if (typeof o.toMillis === "function") return o.toMillis();
  if (typeof o.seconds === "number") return o.seconds * 1000;
  return null;
}

export type MigrationRecord = {
  id: string;
  source_uid: string;
  target_uid: string;
  source_name: string;
  target_name: string;
  source_phone: string;
  target_phone: string;
  performed_by_name: string;
  performed_by_uid: string;
  status: string;
  counts: Record<string, number>;
  total_moved: number;
  error: string | null;
  note: string | null;
  created_at: number | null;
  completed_at: number | null;
};

export async function listMigrations(max = 100): Promise<MigrationRecord[]> {
  const snap = await db
    .collection("user_migrations")
    .orderBy("created_at", "desc")
    .limit(max)
    .get();
  return snap.docs.map((d) => {
    const x = d.data();
    const s = (x.source ?? {}) as Record<string, unknown>;
    const t = (x.target ?? {}) as Record<string, unknown>;
    const counts = (x.counts ?? {}) as Record<string, number>;
    const totalMoved = Object.values(counts).reduce(
      (a, b) => a + (typeof b === "number" ? b : 0),
      0
    );
    return {
      id: d.id,
      source_uid: String(x.source_uid ?? ""),
      target_uid: String(x.target_uid ?? ""),
      source_name: `${s.last_name ?? ""} ${s.first_name ?? ""}`.trim(),
      target_name: `${t.last_name ?? ""} ${t.first_name ?? ""}`.trim(),
      source_phone: String(s.phone ?? ""),
      target_phone: String(t.phone ?? ""),
      performed_by_name: String(x.performed_by_name ?? ""),
      performed_by_uid: String(x.performed_by_uid ?? ""),
      status: String(x.status ?? ""),
      counts,
      total_moved: totalMoved,
      error: x.error ? String(x.error) : null,
      note: x.note ? String(x.note) : null,
      created_at: tsMillis(x.created_at),
      completed_at: tsMillis(x.completed_at),
    };
  });
}

export async function loadUserSummary(uid: string): Promise<UserSummary> {
  const snap = await db.collection("users").doc(uid).get();
  if (!snap.exists) return { uid, exists: false };
  const d = snap.data() ?? {};
  return {
    uid,
    exists: true,
    first_name: String(d.first_name ?? ""),
    last_name: String(d.last_name ?? ""),
    phone: String(d.phone ?? ""),
    email: String(d.email ?? ""),
    balance: readBalance(d),
    invest_total: num(d.invest_total),
    merged_into: (d.merged_into as string) ?? null,
    merge_in_progress: (d.merge_in_progress as string) ?? null,
  };
}

async function countWhere(
  collPath: string,
  field: string,
  value: string
): Promise<number> {
  try {
    const agg = await db.collection(collPath).where(field, "==", value).count().get();
    return agg.data().count;
  } catch {
    return 0;
  }
}

async function countSubcollection(uid: string, sub: string): Promise<number> {
  try {
    const agg = await db.collection("users").doc(uid).collection(sub).count().get();
    return agg.data().count;
  } catch {
    return 0;
  }
}

export async function buildPreview(
  sourceUid: string,
  targetUid: string
): Promise<TransferPreview> {
  const [source, target] = await Promise.all([
    loadUserSummary(sourceUid),
    loadUserSummary(targetUid),
  ]);

  const [
    orders,
    withdraws,
    product_purchases,
    pending_invoices,
    security_logs,
    gifts_as_sender,
    gifts_recv_obj,
    gifts_recv_id,
    notifications,
    lottery_tickets,
    center_tree_orders,
    center_donations,
    installment_cancel_requests,
    ledgerSnap,
    invSnap,
  ] = await Promise.all([
    countWhere("orders", "user_id", sourceUid),
    countWhere("withdraws", "user_id", sourceUid),
    countWhere("product_purchases", "user_id", sourceUid),
    countWhere("pending_invoices", "userId", sourceUid),
    countWhere("security_logs", "user_id", sourceUid),
    countWhere("gift_orders", "sender.uid", sourceUid),
    countWhere("gift_orders", "receiver.uid", sourceUid),
    countWhere("gift_orders", "receiver_id", sourceUid),
    countSubcollection(sourceUid, "notifications"),
    countSubcollection(sourceUid, "lottery_tickets"),
    countWhere("center_tree_orders", "buyer_uid", sourceUid),
    countWhere("center_donations", "buyer_uid", sourceUid),
    countWhere("installment_cancel_requests", "user_id", sourceUid),
    db.collection("ledger_transactions").doc(sourceUid).get(),
    db.collection("investments").doc(sourceUid).get(),
  ]);

  // campaign tickets via collection-group (best effort — may need an index)
  let campaign_tickets = 0;
  try {
    const agg = await db
      .collectionGroup("tickets")
      .where("user_id", "==", sourceUid)
      .count()
      .get();
    campaign_tickets = agg.data().count;
  } catch {
    campaign_tickets = 0;
  }

  const ledgerEntries = ledgerSnap.exists
    ? ((ledgerSnap.data()?.transactions as unknown[]) ?? []).length
    : 0;

  return {
    source,
    target,
    counts: {
      orders,
      withdraws,
      product_purchases,
      pending_invoices,
      security_logs,
      gifts_as_sender,
      gifts_as_receiver: gifts_recv_obj + gifts_recv_id,
      notifications,
      lottery_tickets,
      campaign_tickets,
      campaign_participants: 0, // counted during execute (enumerated)
      center_tree_orders,
      center_donations,
      installment_cancel_requests,
      ledger_entries: ledgerEntries,
      investment: invSnap.exists,
    },
    alreadyMerged: !!source.merged_into,
  };
}

// ---------------------------------------------------------------------------
// Execute
// ---------------------------------------------------------------------------
export type TransferResult = {
  auditId: string;
  counts: Record<string, number>;
  balances: {
    source: Balance;
    targetBefore: Balance;
    targetAfter: Balance;
  };
  skipped: string[];
};

export async function executeTransfer(
  sourceUid: string,
  targetUid: string,
  admin: RequesterAdmin
): Promise<TransferResult> {
  if (sourceUid === targetUid) {
    throw new Error("Эх ба зорилтот хэрэглэгч ижил байж болохгүй.");
  }

  const [sourceDoc, targetDoc] = await Promise.all([
    db.collection("users").doc(sourceUid).get(),
    db.collection("users").doc(targetUid).get(),
  ]);
  if (!sourceDoc.exists) throw new Error("Эх хэрэглэгч олдсонгүй.");
  if (!targetDoc.exists) throw new Error("Зорилтот хэрэглэгч олдсонгүй.");

  const sourceMergedInto = (sourceDoc.data()?.merged_into as string) ?? null;
  if (sourceMergedInto && sourceMergedInto !== targetUid) {
    throw new Error(
      `Эх хэрэглэгч аль хэдийн өөр акаунт (${sourceMergedInto}) руу шилжсэн байна.`
    );
  }
  // A failed prior run locks the source to ITS target — a retry must use the
  // same target, otherwise data could strand on a different account.
  const sourceInProgress =
    (sourceDoc.data()?.merge_in_progress as string) ?? null;
  if (sourceInProgress && sourceInProgress !== targetUid) {
    throw new Error(
      `Энэ хэрэглэгчийн дуусаагүй шилжүүлэлт өөр акаунт (${sourceInProgress}) руу байна. Эхлээд тэр акаунт руу гүйцээнэ үү.`
    );
  }
  if ((targetDoc.data()?.merged_into as string) ?? null) {
    throw new Error("Зорилтот хэрэглэгч өөр рүү шилжсэн (хүчингүй) байна.");
  }

  const targetSnap = readSnap(targetDoc.data());
  const targetGiftSnap = { uid: targetUid, ...targetSnap };

  const counts: Record<string, number> = {};
  const skipped: string[] = [];

  // Audit record (running)
  const auditRef = db.collection("user_migrations").doc();
  await auditRef.set({
    source_uid: sourceUid,
    target_uid: targetUid,
    source: readSnap(sourceDoc.data()),
    target: targetSnap,
    performed_by_uid: admin.uid,
    performed_by_name: admin.name,
    performed_by_role: admin.role,
    scope: "all",
    status: "running",
    created_at: FieldValue.serverTimestamp(),
  });

  try {
  // Lock the source to this target before touching any data, so a failure
  // here can only be retried to the SAME target (no stranding elsewhere).
  await db.collection("users").doc(sourceUid).update({
    merge_in_progress: targetUid,
    merge_in_progress_at: FieldValue.serverTimestamp(),
  });

  // ---- Phase 1: reassign field-keyed docs (idempotent) ----
  const bw = db.bulkWriter();
  const bulkErrors: string[] = [];
  bw.onWriteError((err) => {
    if (err.failedAttempts < 5) return true; // retry transient errors
    bulkErrors.push(`${err.documentRef.path}: ${err.message}`);
    return false;
  });

  async function reassign(
    collPath: string,
    field: string,
    snapshotField: string | null,
    snapshotValue: unknown
  ): Promise<number> {
    const qs = await db.collection(collPath).where(field, "==", sourceUid).get();
    for (const doc of qs.docs) {
      const update: Record<string, unknown> = { [field]: targetUid };
      if (snapshotField) update[snapshotField] = snapshotValue;
      bw.update(doc.ref, update);
    }
    return qs.size;
  }

  counts.orders = await reassign("orders", "user_id", "client", targetSnap);
  counts.withdraws = await reassign("withdraws", "user_id", "client", targetSnap);
  counts.product_purchases = await reassign(
    "product_purchases",
    "user_id",
    "user_snapshot",
    targetSnap
  );
  counts.pending_invoices = await reassign("pending_invoices", "userId", null, null);
  // Tree plantings and Морин хуур donations: the uid moves, but buyer_name /
  // engrave_name stay — they are the name the donation was made (and engraved)
  // under, not a live pointer to the account.
  counts.center_tree_orders = await reassign("center_tree_orders", "buyer_uid", null, null);
  counts.center_donations = await reassign("center_donations", "buyer_uid", null, null);
  // Pending cancel requests must follow the purchases they reference.
  counts.installment_cancel_requests = await reassign(
    "installment_cancel_requests",
    "user_id",
    null,
    null
  );
  try {
    counts.security_logs = await reassign("security_logs", "user_id", null, null);
  } catch (e) {
    console.error("user-transfer: security_logs reassign failed", e);
    skipped.push(`security_logs (${e instanceof Error ? e.message : "алдаа"})`);
  }

  // gifts: sender + receiver(object) + receiver_id
  const giftSender = await db
    .collection("gift_orders")
    .where("sender.uid", "==", sourceUid)
    .get();
  for (const doc of giftSender.docs) {
    // targetGiftSnap already contains `uid`, so replacing the whole object
    // updates sender.uid too. (Setting both `sender` and `sender.uid` in one
    // update is rejected by Firestore as a conflicting field path.)
    bw.update(doc.ref, { sender: targetGiftSnap });
  }
  const giftRecvObj = await db
    .collection("gift_orders")
    .where("receiver.uid", "==", sourceUid)
    .get();
  for (const doc of giftRecvObj.docs) {
    bw.update(doc.ref, { receiver: targetGiftSnap });
  }
  const giftRecvId = await db
    .collection("gift_orders")
    .where("receiver_id", "==", sourceUid)
    .get();
  for (const doc of giftRecvId.docs) {
    bw.update(doc.ref, { receiver_id: targetUid });
  }
  counts.gifts_as_sender = giftSender.size;
  counts.gifts_as_receiver = giftRecvObj.size + giftRecvId.size;

  // ---- Phase 2: move user subcollections (notifications, lottery_tickets) ----
  async function moveSubcollection(sub: string): Promise<number> {
    const srcCol = db.collection("users").doc(sourceUid).collection(sub);
    const tgtCol = db.collection("users").doc(targetUid).collection(sub);
    const qs = await srcCol.get();
    for (const doc of qs.docs) {
      bw.set(tgtCol.doc(doc.id), doc.data());
      bw.delete(doc.ref);
    }
    return qs.size;
  }
  counts.notifications = await moveSubcollection("notifications");
  counts.lottery_tickets = await moveSubcollection("lottery_tickets");

  // ---- Phase 3 (best-effort): campaign tickets + participants ----
  try {
    const tickets = await db
      .collectionGroup("tickets")
      .where("user_id", "==", sourceUid)
      .get();
    for (const doc of tickets.docs) bw.update(doc.ref, { user_id: targetUid });
    counts.campaign_tickets = tickets.size;
  } catch (e) {
    console.error("user-transfer: campaign tickets reassign failed", e);
    skipped.push(`campaign_tickets (${e instanceof Error ? e.message : "алдаа"})`);
  }

  let participantsMoved = 0;
  try {
    const campaigns = await db.collection("marketing_campaigns").get();
    for (const camp of campaigns.docs) {
      const pSrc = camp.ref.collection("participants").doc(sourceUid);
      const pSrcSnap = await pSrc.get();
      if (!pSrcSnap.exists) continue;
      const pTgt = camp.ref.collection("participants").doc(targetUid);
      const pTgtSnap = await pTgt.get();
      const s = pSrcSnap.data() ?? {};
      if (pTgtSnap.exists) {
        const t = pTgtSnap.data() ?? {};
        bw.set(
          pTgt,
          {
            total_grams: round6(num(t.total_grams) + num(s.total_grams)),
            tickets_issued: num(t.tickets_issued) + num(s.tickets_issued),
            updated_at: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        bw.set(pTgt, s);
      }
      bw.delete(pSrc);
      participantsMoved += 1;
    }
    counts.campaign_participants = participantsMoved;
  } catch (e) {
    console.error("user-transfer: campaign participants move failed", e);
    skipped.push(`campaign_participants (${e instanceof Error ? e.message : "алдаа"})`);
  }

  // center_campaign donors: the per-user aggregate that powers "таны тарьсан
  // мод" in the app. Numeric tallies add up; the target's engraving identity
  // wins when both exist, since that account lives on.
  try {
    const dSrc = db
      .collection("center_campaign")
      .doc("main")
      .collection("donors")
      .doc(sourceUid);
    const dSrcSnap = await dSrc.get();
    if (dSrcSnap.exists) {
      const dTgt = db
        .collection("center_campaign")
        .doc("main")
        .collection("donors")
        .doc(targetUid);
      const dTgtSnap = await dTgt.get();
      const sD = dSrcSnap.data() ?? {};
      if (dTgtSnap.exists) {
        const tD = dTgtSnap.data() ?? {};
        bw.set(
          dTgt,
          {
            amount: round6(num(tD.amount) + num(sD.amount)),
            count: num(tD.count) + num(sD.count),
            tree_count: num(tD.tree_count) + num(sD.tree_count),
            updated_at: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        bw.set(dTgt, sD);
      }
      bw.delete(dSrc);
      counts.center_donor_merged = 1;
    }
  } catch (e) {
    console.error("user-transfer: center donor merge failed", e);
    skipped.push(`center_donor (${e instanceof Error ? e.message : "алдаа"})`);
  }

  await bw.close();
  if (bulkErrors.length > 0) {
    // Abort BEFORE the financial merge so balances are never touched while
    // reassigns are incomplete. Re-running is safe (reassigns are idempotent).
    throw new Error(
      `Зарим бичилт амжилтгүй боллоо (${bulkErrors.length}). Дахин оролдоно уу. ` +
        bulkErrors.slice(0, 3).join("; ")
    );
  }

  // ---- Phase 4: financial merge (balance + ledger + investment), guarded ----
  const sourceBal = readBalance(sourceDoc.data());
  const targetBalBefore = readBalance(targetDoc.data());
  let targetBalAfter = targetBalBefore;

  if (sourceMergedInto === targetUid) {
    // Financial merge already done in a prior run — skip (idempotent).
    skipped.push("financial_merge_already_done");
    const tgtNow = await db.collection("users").doc(targetUid).get();
    targetBalAfter = readBalance(tgtNow.data());
  } else {
    targetBalAfter = await db.runTransaction(async (tx) => {
      const usersRef = {
        src: db.collection("users").doc(sourceUid),
        tgt: db.collection("users").doc(targetUid),
      };
      const ledgerRef = {
        src: db.collection("ledger_transactions").doc(sourceUid),
        tgt: db.collection("ledger_transactions").doc(targetUid),
      };
      const invRef = {
        src: db.collection("investments").doc(sourceUid),
        tgt: db.collection("investments").doc(targetUid),
      };

      const [srcU, tgtU, srcL, tgtL, srcI, tgtI] = await Promise.all([
        tx.get(usersRef.src),
        tx.get(usersRef.tgt),
        tx.get(ledgerRef.src),
        tx.get(ledgerRef.tgt),
        tx.get(invRef.src),
        tx.get(invRef.tgt),
      ]);

      // Re-check the guard inside the transaction.
      if ((srcU.data()?.merged_into as string) ?? null) {
        return readBalance(tgtU.data());
      }

      const sBal = readBalance(srcU.data());
      const tBal = readBalance(tgtU.data());
      const merged: Balance = {
        gold: round6(sBal.gold + tBal.gold),
        silver: round6(sBal.silver + tBal.silver),
        saving: round6(sBal.saving + tBal.saving),
      };
      const mergedInvestTotal = round6(
        num(srcU.data()?.invest_total) + num(tgtU.data()?.invest_total)
      );

      // Balances
      tx.update(usersRef.tgt, {
        balance: merged,
        invest_total: mergedInvestTotal,
        merged_from: FieldValue.arrayUnion(sourceUid),
        updated_at: FieldValue.serverTimestamp(),
      });
      tx.update(usersRef.src, {
        balance: { gold: 0, silver: 0, saving: 0 },
        invest_total: 0,
        merged_into: targetUid,
        merge_in_progress: FieldValue.delete(),
        merged_at: FieldValue.serverTimestamp(),
        merged_by: admin.uid,
        merged_by_name: admin.name,
        updated_at: FieldValue.serverTimestamp(),
      });

      // Ledger (gold-only): record the move explicitly with marker entries
      // (transfer_out on the source, transfer_in on the target) instead of
      // copying the source's raw history into the target. `g` is the gold that
      // actually moves to the target balance.
      const g = round6(sBal.gold);
      const now = Timestamp.now(); // serverTimestamp() can't live inside an array

      if (srcL.exists) {
        const srcTx =
          (srcL.data()?.transactions as Record<string, unknown>[]) ?? [];
        // Zero the source ledger against its OWN running balance so the
        // archived ledger always nets to 0 (any pre-existing balance/ledger
        // drift is written off with the emptied account).
        const outAmount = round6(-ledgerSum(srcTx));
        const srcTxNew = [
          ...srcTx,
          {
            type: "transfer_out",
            amount: outAmount,
            ref_id: targetUid,
            running_balance: 0,
            created_at: now,
            note: `Акаунт ${targetUid} руу шилжсэн`,
          },
        ];
        tx.set(ledgerRef.src, {
          user_id: sourceUid,
          balance_gold: 0,
          calculated_balance: 0,
          is_balanced: true,
          transactions: srcTxNew,
          archived: true,
          merged_into: targetUid,
          archived_at: now,
          updated_at: FieldValue.serverTimestamp(),
        });
      }

      if (g !== 0 || tgtL.exists) {
        const tgtTx =
          (tgtL.data()?.transactions as Record<string, unknown>[]) ?? [];
        const before = ledgerSum(tgtTx);
        const after = round6(before + g);
        const tgtTxNew =
          g !== 0
            ? [
                ...tgtTx,
                {
                  type: "transfer_in",
                  amount: g,
                  ref_id: sourceUid,
                  running_balance: after,
                  created_at: now,
                  note: `Нэгдсэн акаунт ${sourceUid}-аас хүлээн авсан`,
                },
              ]
            : tgtTx;
        const calc = g !== 0 ? after : before;
        tx.set(ledgerRef.tgt, {
          user_id: targetUid,
          balance_gold: merged.gold,
          calculated_balance: calc,
          is_balanced: Math.abs(merged.gold - calc) < 0.000001,
          transactions: tgtTxNew,
          updated_at: FieldValue.serverTimestamp(),
        });
      }

      // Investment merge
      if (srcI.exists) {
        const sInv = srcI.data() ?? {};
        if (tgtI.exists) {
          tx.update(invRef.tgt, {
            balance: round6(num(tgtI.data()?.balance) + num(sInv.balance)),
            updated_at: FieldValue.serverTimestamp(),
          });
        } else {
          tx.set(invRef.tgt, {
            ...sInv,
            userId: targetUid,
            user: targetSnap,
            merged_from: sourceUid,
            updated_at: FieldValue.serverTimestamp(),
          });
        }
        tx.update(invRef.src, {
          balance: 0,
          merged_into: targetUid,
          merged_at: FieldValue.serverTimestamp(),
        });
      }

      return merged;
    });
  }

  // ---- Finalise audit ----
  await auditRef.update({
    status: "completed",
    counts,
    skipped,
    balances: {
      source: sourceBal,
      target_before: targetBalBefore,
      target_after: targetBalAfter,
    },
    completed_at: FieldValue.serverTimestamp(),
  });

  return {
    auditId: auditRef.id,
    counts,
    balances: {
      source: sourceBal,
      targetBefore: targetBalBefore,
      targetAfter: targetBalAfter,
    },
    skipped,
  };
  } catch (err) {
    await auditRef
      .update({
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
        failed_at: FieldValue.serverTimestamp(),
      })
      .catch(() => {});
    throw err;
  }
}
