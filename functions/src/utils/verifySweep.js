/**
 * verifySweep
 * -----------
 * Хуваарьт auto-verify ажлуудын (autoVerifyOrders, autoVerifyInstallments)
 * дундын цонх ба дахин шалгах давтамжийн дүрэм.
 *
 * ЯАГААД: өмнө нь хоёулаа `createdAt`-аар checkpoint барьдаг байв —
 * нэхэмжлэхийг зөвхөн үүссэнийх нь ДАРААХ ЭХНИЙ ажиллалтад шалгаад, checkpoint
 * урагшилмагц тэр нэхэмжлэх цонхны ард үлдэж дахин хэзээ ч харагддаггүй
 * байсан. Хэрэглэгч QR-аа хадгалаад маргааш нь төлөхөд төлбөр нь чимээгүй алга
 * болно — 2026-09-16-нд яг ийм замаар 100,000₮ алдагдаж, гараар нөхөгдсөн.
 *
 * ОДОО: эргэлдэх цонхоор сүүлийн SWEEP_DAYS хоногийн ХҮЛЭЭГДЭЖ БУЙ
 * нэхэмжлэхүүдийг дахин дахин хардаг. QPay рүү хэт олон дуудлага явахаас
 * сэргийлж давтамжийг нэхэмжлэхийн НАСНААС хамааруулан сийрэгжүүлнэ: шинэ
 * нэхэмжлэх ажиллалт бүрт, хуучирсан нь улам ховор шалгагдана.
 */

// Хэдэн хоногийн хүлээгдэж буй нэхэмжлэхийг эргэж харах вэ.
const SWEEP_DAYS = 7;

// Нэхэмжлэх бүрийг хамгийн сүүлд хэзээ QPay-аас шалгасныг тэмдэглэх талбар.
const LAST_CHECK_FIELD = "last_verify_check_at";

// Sweep дэх QPay payment/check-ийн оролдлогын тоо.
//
// installmentShared.checkQPayPayment-ийн анхдагч нь 5 бөгөөд мөр олдоогүй үед
// 2+4+8+16 = 30 секунд экспоненциалаар хүлээдэг. Бодит цагийн callback-д энэ
// зөв (төлбөр хормын дараа бүртгэгдэж магадгүй), харин ХҮЛЭЭГДЭЖ БУЙ олон зуун
// нэхэмжлэх дамжих sweep-д энэ нь ажиллалтыг timeout руу аваачна
// (209 төлөгдөөгүй × 30с ≈ 1.7 цаг). Sweep нь ямар ч байсан эргэж ирдэг тул
// нэг оролдлого хангалттай.
const SWEEP_QPAY_ATTEMPTS = 1;

// [нас нь энэ цагаас бага бол, дахин шалгах хамгийн бага интервал (минут)]
// Эхний мөрөөс эхлэн тохирох нь сонгогдоно.
const RECHECK_TIERS = [
  [24, 0], //        эхний хоног — ажиллалт бүрт (~30 мин тутам)
  [72, 120], //      1-3 хоног    — 2 цаг тутам
  [Infinity, 720], // 3-SWEEP_DAYS хоног — өдөрт 2 удаа
];

/**
 * Sweep цонхны эхлэл.
 * @param {number} days - хэдэн хоногоор ухрах (default SWEEP_DAYS)
 * @return {Date} цонхны эхлэх огноо
 */
function sweepStart(days = SWEEP_DAYS) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

/**
 * Firestore Timestamp | Date | number → миллисекунд (эсвэл null).
 * @param {*} v - хөрвүүлэх утга
 * @return {number|null} миллисекунд
 */
function toMillis(v) {
  if (!v) return null;
  if (typeof v.toMillis === "function") return v.toMillis();
  if (v instanceof Date) return v.getTime();
  if (typeof v === "number") return v;
  return null;
}

/**
 * Энэ нэхэмжлэхийг яг одоо QPay-аас дахин шалгах цаг болсон уу?
 *
 * Хэзээ ч шалгаагүй (тухайлбал шинэ, эсвэл энэ талбар нэмэгдэхээс өмнөх хуучин
 * баримт) бол үргэлж тийм — ингэснээр нэвтрүүлэлтийн дараа бүгд нэг удаа
 * шалгагдана.
 *
 * @param {*} createdAt - нэхэмжлэх үүссэн хугацаа
 * @param {*} lastCheckedAt - сүүлд QPay-аас шалгасан хугацаа
 * @param {number} nowMs - одоогийн хугацаа (тестэд дарж бичих боломжтой)
 * @return {boolean} шалгах эсэх
 */
function dueForRecheck(createdAt, lastCheckedAt, nowMs = Date.now()) {
  const lastMs = toMillis(lastCheckedAt);
  if (lastMs === null) return true;

  const createdMs = toMillis(createdAt);
  const ageHours = createdMs === null ?
    0 :
    (nowMs - createdMs) / (60 * 60 * 1000);

  const tier = RECHECK_TIERS.find(([maxAgeHours]) => ageHours < maxAgeHours);
  const intervalMin = tier ? tier[1] : 0;

  return (nowMs - lastMs) / (60 * 1000) >= intervalMin;
}

module.exports = {
  SWEEP_DAYS,
  LAST_CHECK_FIELD,
  SWEEP_QPAY_ATTEMPTS,
  RECHECK_TIERS,
  sweepStart,
  toMillis,
  dueForRecheck,
};
