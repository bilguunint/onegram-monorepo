/**
 * ubDate
 * ------
 * Улаанбаатарын цагийн бүсээр (Asia/Ulaanbaatar) хийх календарийн тооцоо.
 *
 * Cloud Functions-ийн процесс UTC цагаар ажилладаг тул `new Date().getDate()`
 * гэх мэт локал getter-үүд UTC-ийн огноог буцаана. Монгол UTC+8 учраас
 * УБ-ын 00:00–08:00 хооронд хийгдсэн бүх үйлдэл UTC-д ӨМНӨХ өдөр болж
 * бүртгэгддэг — үүнээс болж "өнөөдөр төлсөн" төлбөр "өчигдөр" болж, хугацаа
 * нэг өдрөөр эрт тавигддаг байсан.
 *
 * Энэ модулийн функцууд бүгд Intl-ийн цагийн бүсийн мэдээлэл дээр тулгуурлана
 * (хатуу +8 offset биш), тиймээс цагийн бүсийн дүрэм ирээдүйд өөрчлөгдвөл
 * (Монгол 2015–2016 онд зуны цагтай байсан) автоматаар дагаж тохирно.
 */

const TZ = "Asia/Ulaanbaatar";

// en-CA нь YYYY-MM-DD форматыг өгдөг тул задлахад хялбар.
const DATE_FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function toDate(value) {
  if (value == null) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value.toDate === "function") return toDate(value.toDate());
  if (typeof value.seconds === "number") return new Date(value.seconds * 1000);
  if (typeof value === "number") return new Date(value);
  if (typeof value === "string") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

// Өгөгдсөн агшны УБ огноог "YYYY-MM-DD" мөрөөр буцаана.
function ubDateString(value) {
  const d = toDate(value);
  return d ? DATE_FMT.format(d) : null;
}

// Өгөгдсөн агшны УБ огноог {year, month, day} болгож задална (month нь 1-12).
function ubParts(value) {
  const s = ubDateString(value);
  if (!s) return null;
  const [year, month, day] = s.split("-").map(Number);
  return { year, month, day };
}

/**
 * УБ календарийн өдрийн дугаар — 1970-01-01-ээс хойшхи бүхэл өдрийн тоо.
 *
 * Хоёр агшны хоорондох хэдэн ХОНОГИЙН зөрүүг олохын тулд зөвхөн эдгээр
 * дугаарыг хасах хэрэгтэй. Ингэснээр цагийн бүсийн offset-ийг гараар
 * тооцох шаардлагагүй болно.
 *
 * @param {Date|admin.firestore.Timestamp|string|number} value - агшин
 * @return {number|null} өдрийн дугаар, эсвэл тодорхойлох боломжгүй бол null
 */
function ubDayNumber(value) {
  const p = ubParts(value);
  if (!p) return null;
  return Math.floor(Date.UTC(p.year, p.month - 1, p.day) / 86400000);
}

// a болон b хоёрын хоорондох бүхэл хоногийн зөрүү (a - b). Аль нэг нь
// тодорхойгүй бол null.
function ubDayDiff(a, b) {
  const da = ubDayNumber(a);
  const db = ubDayNumber(b);
  if (da == null || db == null) return null;
  return da - db;
}

// Хоёр агшин УБ-аар нэг хоногт багтаж байна уу.
function ubIsSameDay(a, b) {
  const diff = ubDayDiff(a, b);
  return diff === 0;
}

/**
 * `from`-ын УБ огнооноос `days` хоногийн дараах өдрийн УБ-аар 23:59:59.999
 * агшныг буцаана — хугацааны эцэс нь тухайн өдрийн төгсгөл гэсэн утгатай.
 *
 * Firestore-т хадгалахад жинхэнэ агшин (UTC) болж хөрвөх ба апп дээр
 * `Timestamp.toDate()` локал цагаар буцаахад зөв огноо харагдана.
 *
 * @param {Date|admin.firestore.Timestamp|string|number} from - эхлэх агшин
 * @param {number} days - нэмэх хоногийн тоо
 * @return {Date|null} зорилтот УБ өдрийн 23:59:59.999, эсвэл null
 */
function ubEndOfDayAfter(from, days) {
  const p = ubParts(from);
  if (!p) return null;
  // Эхлээд зорилтот УБ огноог олно (сар/жилийн шилжилтийг Date.UTC зохицуулна).
  const target = new Date(Date.UTC(p.year, p.month - 1, p.day + Number(days || 0)));
  const y = target.getUTCFullYear();
  const m = String(target.getUTCMonth() + 1).padStart(2, "0");
  const d = String(target.getUTCDate()).padStart(2, "0");
  // Тухайн УБ огнооны 23:59:59.999-ийг УБ-ын offset-той нь тодорхойлно.
  return new Date(`${y}-${m}-${d}T23:59:59.999${ubOffsetString(target)}`);
}

// Өгөгдсөн өдрийн УБ цагийн бүсийн offset-ийг "+08:00" хэлбэрээр буцаана.
function ubOffsetString(value) {
  const d = toDate(value) || new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    timeZoneName: "longOffset",
  }).formatToParts(d);
  const name = parts.find((p) => p.type === "timeZoneName");
  // "GMT+08:00" → "+08:00";  "GMT" → "+00:00"
  const raw = name ? name.value.replace("GMT", "") : "";
  return raw === "" ? "+00:00" : raw;
}

module.exports = {
  TZ,
  toDate,
  ubDateString,
  ubParts,
  ubDayNumber,
  ubDayDiff,
  ubIsSameDay,
  ubEndOfDayAfter,
  ubOffsetString,
};
