// Helpers for safe decimal arithmetic on metal balances.
// JavaScript-н float арифметик дээр 0.1 + 0.2 = 0.30000000000000004 гэх мэт
// drift үүсэхээс хамгаалахын тулд 6 оронгийн нарийвчлал хүртэл бөөрөнхийлнө.
// 6 оронтой = 0.000001 гр = 1 микрограмм нарийвчлал.

const SCALE = 1e6;

function roundQty(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * SCALE) / SCALE;
}

function addQty(a, b) {
  return roundQty(Number(a || 0) + Number(b || 0));
}

function subQty(a, b) {
  return roundQty(Number(a || 0) - Number(b || 0));
}

module.exports = { roundQty, addQty, subQty };
