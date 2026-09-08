import 'dart:math' as math;
import 'dart:ui' show Offset;

/// Дэлхийн алтны үнэ — сүүлийн 3 жилийн сарын дундаж тулгуур цэгүүд
/// (USD/унц, дүрслэлийн зориулалттай ойролцоо утга). Эхлэл: 2022 оны 9-р сар.
const int kGoldHistoryStartYear = 2022;
const int kGoldHistoryStartMonth = 9;
const List<double> kGoldMonthly = [
  1916, 1915, 1985, 2033, // 2022: 9–12 сар
  2034, 2024, 2160, 2330, 2350, 2326, 2398, 2470, 2570, 2690, 2650,
  2645, // 2023
  2710, 2900, 2990, 3220, 3280, 3350, 3340, 3400, 3650, 4050, 4250,
  4400, // 2024
  4600, 4750, 4900, 5100, 5350, 5600, 5900, 6300, 7100, // 2025: 1–9 сар
];

/// Сар тутмын тулгуур цэгүүдээс өдөр бүрийн детальтай муруй үүсгэнэ:
/// трэндийг log-шугаман интерполяци, дээр нь дундаж руу татагддаг
/// тодорхойлогдсон санамсаргүй хэлбэлзэл (өдөрт ~0.9%). Үр дүн үргэлж ижил.
List<Offset> goldHistoryPoints({int daysPerMonth = 30}) {
  final int months = kGoldMonthly.length;
  final int n = (months - 1) * daysPerMonth + 1;
  final List<double> prices = List<double>.filled(n, 0.0);

  int seed = 0x1F3A9;
  double rnd() {
    // LCG → 0..1
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  }

  double gauss() {
    final double u1 = math.max(rnd(), 1e-6);
    final double u2 = rnd();
    return math.sqrt(-2.0 * math.log(u1)) * math.cos(2.0 * math.pi * u2);
  }

  double dev = 0.0; // өдрийн хэлбэлзэл
  double swing = 0.0; // долоо хоног–сарын урт долгион (өсөлт/уналтын үе)
  for (int i = 0; i < n; i++) {
    final double t = i / daysPerMonth;
    final int m = math.min(t.floor(), months - 2);
    final double f = t - m;
    final double trend = math.exp(math.log(kGoldMonthly[m]) * (1 - f) +
        math.log(kGoldMonthly[m + 1]) * f);
    // Хэлбэлзэл: санамсаргүй алхам + трэнд рүү буцах татах хүч (хоёр давхар)
    swing += gauss() * 0.007 - swing * 0.02;
    dev += gauss() * 0.004 - dev * 0.10;
    prices[i] = trend * math.exp(dev + swing);
  }
  // 7 өдрийн гулсах дундаж — зигзагийг зөөлрүүлж гөлгөр, бөөрөнхий муруй
  final List<double> smooth = List<double>.filled(n, 0.0);
  for (int i = 0; i < n; i++) {
    double sum = 0.0;
    int cnt = 0;
    for (int k = -3; k <= 3; k++) {
      final int j = i + k;
      if (j < 0 || j >= n) continue;
      sum += prices[j];
      cnt++;
    }
    smooth[i] = sum / cnt;
  }
  for (int i = 0; i < n; i++) {
    prices[i] = smooth[i];
  }

  final double minV = prices.reduce(math.min);
  final double maxV = prices.reduce(math.max);
  final double range = (maxV - minV) <= 0 ? 1.0 : (maxV - minV);
  return List<Offset>.generate(
    n,
    (i) => Offset(i / (n - 1), (prices[i] - minV) / range),
    growable: false,
  );
}

/// Он бүрийн 1-р сарын байрлал (x: 0..1) — chart дээр сийлж тэмдэглэхэд
List<MapEntry<String, double>> goldYearMarkers() {
  final int months = kGoldMonthly.length;
  final List<MapEntry<String, double>> out = [];
  for (int y = kGoldHistoryStartYear; y <= kGoldHistoryStartYear + 10; y++) {
    final int idx =
        (y - kGoldHistoryStartYear) * 12 + (1 - kGoldHistoryStartMonth);
    if (idx <= 0 || idx >= months - 1) continue;
    out.add(MapEntry('$y', idx / (months - 1)));
  }
  return out;
}
