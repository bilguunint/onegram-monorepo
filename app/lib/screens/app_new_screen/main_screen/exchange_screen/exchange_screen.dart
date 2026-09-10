import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:ionicons/ionicons.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/repositories/rate_history_cache.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

/// Ханшийн мэдээлэл: том ханш + өнөөдрийн өөрчлөлт, хугацааны сонголттой
/// график (хүрэхэд tooltip), статистик, өсөлтийн хувь, өдрийн жагсаалт.
class ExchangeScreen extends StatefulWidget {
  const ExchangeScreen(
      {super.key, required this.userRepository, required this.metalId});
  final dynamic userRepository;
  final int metalId;

  @override
  State<ExchangeScreen> createState() => _ExchangeScreenState();
}

enum _Period { m1, m3, m6, y1, y3, all }

class _ExchangeScreenState extends State<ExchangeScreen> {
  final NumberFormat _fmt = NumberFormat('#,##0');
  List<RatePoint> _history = const [];
  double _rate = 0.0;
  double _todayChange = 0.0;
  DateTime? _updatedAt;
  bool _loading = true;
  _Period _period = _Period.y1;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final latest = await FirebaseFirestore.instance
          .collection('latest_rates')
          .where('id', isEqualTo: widget.metalId)
          .limit(1)
          .get();
      if (latest.docs.isNotEmpty) {
        final d = latest.docs.first.data();
        _rate = (d['rate'] as num?)?.toDouble() ?? 0.0;
        _todayChange = (d['changes'] as num?)?.toDouble() ?? 0.0;
        final u = d['updated_at'];
        if (u is Timestamp) _updatedAt = u.toDate();
      }
    } catch (_) {}
    _history = await RateHistoryCache.load(metalId: widget.metalId);
    if (_rate <= 0 && _history.isNotEmpty) _rate = _history.last.rate;
    if (!mounted) return;
    setState(() => _loading = false);
  }

  // ---------------------------------------------------------------- data
  List<RatePoint> get _slice {
    if (_history.isEmpty) return const [];
    final Duration? d = switch (_period) {
      _Period.m1 => const Duration(days: 30),
      _Period.m3 => const Duration(days: 90),
      _Period.m6 => const Duration(days: 182),
      _Period.y1 => const Duration(days: 365),
      _Period.y3 => const Duration(days: 365 * 3),
      _Period.all => null,
    };
    if (d == null) return _history;
    final from = DateTime.now().subtract(d);
    final out = _history.where((p) => !p.date.isBefore(from)).toList();
    return out.length >= 2 ? out : _history;
  }

  double? _growthSince(Duration d) {
    if (_history.isEmpty || _rate <= 0) return null;
    final target = DateTime.now().subtract(d);
    if (_history.first.date.isAfter(target.add(const Duration(days: 20)))) {
      return null;
    }
    RatePoint? ref;
    for (final p in _history) {
      if (p.date.isAfter(target)) break;
      ref = p;
    }
    if (ref == null || ref.rate <= 0) return null;
    return (_rate - ref.rate) / ref.rate * 100.0;
  }

  String _short(double v) {
    if (v >= 1000000) return "${(v / 1000000).toStringAsFixed(2)}M";
    if (v >= 1000) return "${(v / 1000).toStringAsFixed(0)}K";
    return v.toStringAsFixed(0);
  }

  // ------------------------------------------------------------------ ui
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CustomColors.appBackground,
      appBar: AppBar(
        backgroundColor: CustomColors.appBackground,
        title: Text(tr('order.rate_info_title'), style: AppText.appBarTitle),
        centerTitle: false,
      ),
      body: _loading
          ? const Center(child: CupertinoActivityIndicator())
          : _history.isEmpty
              ? Center(
                  child: Text(tr('order.no_data'),
                      style: const TextStyle(color: Colors.white70)))
              : ListView(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                  children: [
                    _header(),
                    const SizedBox(height: 16),
                    _periodSelector(),
                    const SizedBox(height: 12),
                    _chartCard(),
                    const SizedBox(height: 12),
                    _statsRow(),
                    const SizedBox(height: 12),
                    _growthCard(),
                    const SizedBox(height: 24),
                    Text(tr('order.daily'), style: AppText.sectionTitle),
                    const SizedBox(height: 4),
                    Text(tr('order.last_days', {'n': 30}),
                        style: AppText.caption),
                    const SizedBox(height: 12),
                    ..._dailyRows(),
                  ],
                ),
    );
  }

  Widget _header() {
    final bool up = _todayChange >= 0;
    final Color cc = up ? CustomColors.positive : CustomColors.negative;
    double abs = 0.0;
    if (_history.length >= 2) {
      abs = _rate - _history[_history.length - 2].rate;
    }
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              AppIconTile(
                size: 40,
                child: Icon(Ionicons.diamond_outline,
                    size: 18, color: CustomColors.accent),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                      widget.metalId == 1
                          ? tr('order.gold')
                          : tr('home.dollar'),
                      style: AppText.bodyBold),
                  Text(widget.metalId == 1 ? "XAU" : "USD",
                      style: AppText.caption),
                ],
              ),
              const Spacer(),
              if (_updatedAt != null)
                Text(DateFormat('MM.dd HH:mm').format(_updatedAt!),
                    style: AppText.caption),
            ],
          ),
          const SizedBox(height: 14),
          Text.rich(
            TextSpan(children: [
              TextSpan(text: "${_fmt.format(_rate)}₮"),
              TextSpan(text: tr('home.per_gram'), style: AppText.caption),
            ]),
            style: AppText.display.copyWith(fontSize: 32),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: cc.withOpacity(0.16),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(up ? Ionicons.caret_up : Ionicons.caret_down,
                        size: 11, color: cc),
                    const SizedBox(width: 3),
                    Text(
                      "${up ? '+' : ''}${_todayChange.toStringAsFixed(2)}%",
                      style: TextStyle(
                          fontFamily: AppText.bold,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: cc),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Text(
                "${abs >= 0 ? '+' : '−'}${_fmt.format(abs.abs())}₮  ·  ${tr('home.today_change')}",
                style: AppText.caption,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _periodSelector() {
    final items = <(_Period, String)>[
      (_Period.m1, tr('order.p_1m')),
      (_Period.m3, tr('order.p_3m')),
      (_Period.m6, tr('order.p_6m')),
      (_Period.y1, tr('order.p_1y')),
      (_Period.y3, tr('order.p_3y')),
      (_Period.all, tr('order.p_all')),
    ];
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: CustomColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(width: 1, color: CustomColors.surfaceBorder),
      ),
      child: Row(
        children: items.map((e) {
          final bool sel = e.$1 == _period;
          return Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _period = e.$1),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                padding: const EdgeInsets.symmetric(vertical: 8),
                decoration: BoxDecoration(
                  color: sel ? CustomColors.accent : Colors.transparent,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Center(
                  child: Text(
                    e.$2,
                    style: TextStyle(
                      fontFamily: sel ? AppText.bold : AppText.medium,
                      fontSize: 12,
                      fontWeight: sel ? FontWeight.bold : FontWeight.w500,
                      color: sel ? Colors.black : CustomColors.textSecondary,
                    ),
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _chartCard() {
    final pts = _slice;
    final double minV = pts.map((p) => p.rate).reduce((a, b) => a < b ? a : b);
    final double maxV = pts.map((p) => p.rate).reduce((a, b) => a > b ? a : b);
    final double pad = (maxV - minV) <= 0 ? maxV * 0.02 : (maxV - minV) * 0.08;
    final double minY = minV - pad;
    final double maxY = maxV + pad;
    final double yInterval = _niceStep((maxY - minY) / 4);
    final spots = List<FlSpot>.generate(
        pts.length, (i) => FlSpot(i.toDouble(), pts[i].rate));
    final int n = pts.length;
    final double xInterval = (n - 1) / 4 <= 0 ? 1 : (n - 1) / 4;
    final DateFormat xf = (_period == _Period.m1 || _period == _Period.m3)
        ? DateFormat('MM.dd')
        : DateFormat('yy.MM');

    return AppCard(
      padding: const EdgeInsets.fromLTRB(8, 16, 16, 8),
      child: SizedBox(
        height: 240,
        child: LineChart(
          LineChartData(
            minX: 0,
            maxX: (n - 1).toDouble(),
            minY: minY,
            maxY: maxY,
            clipData: const FlClipData.all(),
            gridData: FlGridData(
              show: true,
              drawVerticalLine: false,
              horizontalInterval: yInterval,
              getDrawingHorizontalLine: (v) =>
                  FlLine(color: CustomColors.surfaceBorder, strokeWidth: 1),
            ),
            borderData: FlBorderData(show: false),
            titlesData: FlTitlesData(
              topTitles:
                  const AxisTitles(sideTitles: SideTitles(showTitles: false)),
              rightTitles:
                  const AxisTitles(sideTitles: SideTitles(showTitles: false)),
              leftTitles: AxisTitles(
                sideTitles: SideTitles(
                  showTitles: true,
                  reservedSize: 46,
                  interval: yInterval,
                  getTitlesWidget: (v, meta) => Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: Text(_short(v),
                        style: AppText.caption.copyWith(fontSize: 10)),
                  ),
                ),
              ),
              bottomTitles: AxisTitles(
                sideTitles: SideTitles(
                  showTitles: true,
                  reservedSize: 26,
                  interval: xInterval,
                  getTitlesWidget: (v, meta) {
                    final int i = v.round().clamp(0, n - 1);
                    // Хамгийн сүүлийн шошгыг зах руу шахагдахаас сэргийлнэ
                    if (v > (n - 1) - xInterval * 0.35 && i != n - 1) {
                      return const SizedBox.shrink();
                    }
                    return Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(xf.format(pts[i].date),
                          style: AppText.caption.copyWith(fontSize: 10)),
                    );
                  },
                ),
              ),
            ),
            lineTouchData: LineTouchData(
              handleBuiltInTouches: true,
              getTouchedSpotIndicator: (bar, indexes) => indexes
                  .map((_) => TouchedSpotIndicatorData(
                        FlLine(color: CustomColors.accent, strokeWidth: 1),
                        FlDotData(
                          getDotPainter: (s, p, b, i) => FlDotCirclePainter(
                              radius: 4,
                              color: CustomColors.accent,
                              strokeWidth: 2,
                              strokeColor: CustomColors.appBackground),
                        ),
                      ))
                  .toList(),
              touchTooltipData: LineTouchTooltipData(
                getTooltipColor: (_) => CustomColors.surfaceAlt,
                tooltipRoundedRadius: 10,
                getTooltipItems: (spots) => spots.map((s) {
                  final p = pts[s.x.round().clamp(0, n - 1)];
                  return LineTooltipItem(
                    "${_fmt.format(p.rate)}₮\n",
                    AppText.bodyBold.copyWith(fontSize: 13),
                    children: [
                      TextSpan(
                          text: DateFormat('yyyy.MM.dd').format(p.date),
                          style: AppText.caption.copyWith(fontSize: 11)),
                    ],
                  );
                }).toList(),
              ),
            ),
            lineBarsData: [
              LineChartBarData(
                spots: spots,
                isCurved: true,
                curveSmoothness: 0.2,
                preventCurveOverShooting: true,
                color: CustomColors.accent,
                barWidth: 2,
                isStrokeCapRound: true,
                dotData: const FlDotData(show: false),
                belowBarData: BarAreaData(
                  show: true,
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      CustomColors.accent.withOpacity(0.28),
                      CustomColors.accent.withOpacity(0.0),
                    ],
                  ),
                ),
              ),
            ],
          ),
          duration: const Duration(milliseconds: 250),
        ),
      ),
    );
  }

  Widget _statsRow() {
    final pts = _slice;
    final double first = pts.first.rate;
    final double last = pts.last.rate;
    final double change = first > 0 ? (last - first) / first * 100.0 : 0.0;
    final double hi = pts.map((p) => p.rate).reduce((a, b) => a > b ? a : b);
    final double lo = pts.map((p) => p.rate).reduce((a, b) => a < b ? a : b);
    final double avg =
        pts.map((p) => p.rate).reduce((a, b) => a + b) / pts.length;
    final Color cc =
        change >= 0 ? CustomColors.positive : CustomColors.negative;
    return Row(
      children: [
        Expanded(
          child: _stat(tr('order.period_change'),
              "${change >= 0 ? '+' : ''}${change.toStringAsFixed(2)}%", cc),
        ),
        const SizedBox(width: 8),
        Expanded(
            child: _stat(tr('order.high'), "${_short(hi)}₮", Colors.white)),
        const SizedBox(width: 8),
        Expanded(child: _stat(tr('order.low'), "${_short(lo)}₮", Colors.white)),
        const SizedBox(width: 8),
        Expanded(
            child: _stat(tr('order.avg'), "${_short(avg)}₮", Colors.white)),
      ],
    );
  }

  Widget _stat(String label, String value, Color color) {
    return AppCard(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
      radius: 14,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppText.caption.copyWith(fontSize: 10)),
          const SizedBox(height: 4),
          Text(value,
              maxLines: 1,
              style: TextStyle(
                  fontFamily: AppText.bold,
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: color)),
        ],
      ),
    );
  }

  Widget _growthCard() {
    final w52 = _history
        .where((p) =>
            p.date.isAfter(DateTime.now().subtract(const Duration(days: 365))))
        .toList();
    final double? hi52 = w52.isEmpty
        ? null
        : w52.map((p) => p.rate).reduce((a, b) => a > b ? a : b);
    final double? lo52 = w52.isEmpty
        ? null
        : w52.map((p) => p.rate).reduce((a, b) => a < b ? a : b);
    final double pos = (hi52 != null && lo52 != null && hi52 > lo52)
        ? ((_rate - lo52) / (hi52 - lo52)).clamp(0.0, 1.0)
        : 0.5;
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(tr('order.growth'), style: AppText.sectionTitle),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                  child: _growth(tr('home.growth_1m'),
                      _growthSince(const Duration(days: 30)))),
              Expanded(
                  child: _growth(tr('home.growth_1y'),
                      _growthSince(const Duration(days: 365)))),
              Expanded(
                  child: _growth(tr('home.growth_3y'),
                      _growthSince(const Duration(days: 365 * 3)),
                      highlight: true)),
            ],
          ),
          const SizedBox(height: 16),
          Text(tr('order.week52'), style: AppText.caption),
          const SizedBox(height: 8),
          // 52 долоо хоногийн доод–дээд мужид одоогийн ханш хаана байгааг харуулна
          LayoutBuilder(builder: (context, c) {
            return Stack(
              children: [
                Container(
                  height: 6,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(3),
                    gradient: LinearGradient(colors: [
                      CustomColors.negative.withOpacity(0.7),
                      CustomColors.accent,
                      CustomColors.positive.withOpacity(0.8),
                    ]),
                  ),
                ),
                Positioned(
                  left: (c.maxWidth - 12) * pos,
                  top: -3,
                  child: Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white,
                      border: Border.all(
                          color: CustomColors.appBackground, width: 2),
                    ),
                  ),
                ),
              ],
            );
          }),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(lo52 == null ? "—" : "${_fmt.format(lo52)}₮",
                  style: AppText.caption.copyWith(fontSize: 11)),
              Text(hi52 == null ? "—" : "${_fmt.format(hi52)}₮",
                  style: AppText.caption.copyWith(fontSize: 11)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _growth(String label, double? v, {bool highlight = false}) {
    final Color c = v == null
        ? CustomColors.textTertiary
        : (v >= 0 ? CustomColors.positive : CustomColors.negative);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppText.caption),
        const SizedBox(height: 2),
        Text(
          v == null ? "—" : "${v >= 0 ? '+' : ''}${v.toStringAsFixed(1)}%",
          style: TextStyle(
            fontFamily: AppText.bold,
            fontSize: highlight ? 20 : 16,
            fontWeight: FontWeight.bold,
            color: highlight && v != null ? CustomColors.accent : c,
          ),
        ),
      ],
    );
  }

  List<Widget> _dailyRows() {
    final int start = _history.length > 30 ? _history.length - 30 : 0;
    final rows = <Widget>[];
    for (int i = _history.length - 1; i >= start; i--) {
      final p = _history[i];
      final double prev = i > 0 ? _history[i - 1].rate : p.rate;
      final double ch = prev > 0 ? (p.rate - prev) / prev * 100.0 : 0.0;
      final bool up = ch >= 0;
      final Color cc = up ? CustomColors.positive : CustomColors.negative;
      rows.add(Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: AppCard(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          radius: 14,
          child: Row(
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("${_fmt.format(p.rate)}₮", style: AppText.bodyBold),
                  const SizedBox(height: 3),
                  Text(DateFormat('yyyy.MM.dd').format(p.date),
                      style: AppText.caption),
                ],
              ),
              const Spacer(),
              Text(
                "${up ? '+' : ''}${ch.toStringAsFixed(2)}%",
                style: TextStyle(
                    fontFamily: AppText.bold,
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: cc),
              ),
              const SizedBox(width: 8),
              Container(
                width: 26,
                height: 26,
                decoration: BoxDecoration(
                  color: cc.withOpacity(0.16),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(up ? Ionicons.caret_up : Ionicons.caret_down,
                    size: 14, color: cc),
              ),
            ],
          ),
        ),
      ));
    }
    return rows;
  }

  double _niceStep(double raw) {
    if (raw <= 0) return 1;
    final double mag = _pow10((raw.abs()).toStringAsFixed(0).length - 1);
    final double norm = raw / mag;
    final double step = norm <= 1
        ? 1
        : norm <= 2
            ? 2
            : norm <= 5
                ? 5
                : 10;
    return step * mag;
  }

  double _pow10(int e) {
    double r = 1;
    for (int i = 0; i < e; i++) {
      r *= 10;
    }
    return r;
  }
}
