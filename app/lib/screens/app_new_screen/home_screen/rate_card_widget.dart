import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_svg/svg.dart';
import 'package:intl/intl.dart';
import 'package:ionicons/ionicons.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/repositories/rate_history_cache.dart';
import 'package:onegrgold/repositories/user_repository.dart';
import 'package:onegrgold/screens/app_new_screen/main_screen/exchange_screen/exchange_screen.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

/// Өнөөдрийн алтны ханш — өсөлт/уналт, 30 хоногийн муруй, 7 хоног / 1 сар /
/// 1 жил / 3 жилийн өсөлтийн хувь. Ханшийн түүх утасны кэшээс.
class RateCardWidget extends StatefulWidget {
  const RateCardWidget({super.key});

  @override
  State<RateCardWidget> createState() => _RateCardWidgetState();
}

class _RateStats {
  const _RateStats({
    required this.rate,
    required this.changePercent,
    required this.changeAbs,
    required this.spark,
    required this.growth,
    required this.updatedAt,
  });
  final double rate;
  final double changePercent;
  final double changeAbs;
  final List<double> spark;
  final Map<String, double?> growth; // '7d','1m','1y','3y'
  final DateTime? updatedAt;
}

class _RateCardWidgetState extends State<RateCardWidget>
    with AutomaticKeepAliveClientMixin {
  static _RateStats? _cache;
  static DateTime? _cacheAt;
  late final Future<_RateStats?> _future = _load();

  @override
  bool get wantKeepAlive => true;

  Future<_RateStats?> _load() async {
    if (_cache != null &&
        _cacheAt != null &&
        DateTime.now().difference(_cacheAt!) < const Duration(hours: 1)) {
      return _cache;
    }
    double rate = 0.0;
    double change = 0.0;
    DateTime? updated;
    try {
      final latest = await FirebaseFirestore.instance
          .collection('latest_rates')
          .where('id', isEqualTo: 1)
          .limit(1)
          .get();
      if (latest.docs.isNotEmpty) {
        final d = latest.docs.first.data();
        rate = (d['rate'] as num?)?.toDouble() ?? 0.0;
        change = (d['changes'] as num?)?.toDouble() ?? 0.0;
        final u = d['updated_at'];
        if (u is Timestamp) updated = u.toDate();
      }
    } catch (_) {}
    final history = await RateHistoryCache.load(metalId: 1);
    if (rate <= 0 && history.isNotEmpty) rate = history.last.rate;
    if (rate <= 0) return null;

    double changeAbs = 0.0;
    if (history.length >= 2) {
      final prev = history[history.length - 2].rate;
      changeAbs = rate - prev;
      if (change == 0.0 && prev > 0) change = (rate - prev) / prev * 100.0;
    }
    final spark = history.length > 30
        ? history.sublist(history.length - 30).map((p) => p.rate).toList()
        : history.map((p) => p.rate).toList();

    double? growthSince(Duration d) {
      if (history.isEmpty) return null;
      final target = DateTime.now().subtract(d);
      RatePoint? ref;
      for (final p in history) {
        if (p.date.isAfter(target)) break;
        ref = p;
      }
      // Түүх тухайн огноо хүртэл хүрэхгүй бол харуулахгүй
      if (ref == null || ref.rate <= 0) return null;
      if (history.first.date.isAfter(target.add(const Duration(days: 20)))) {
        return null;
      }
      return (rate - ref.rate) / ref.rate * 100.0;
    }

    final stats = _RateStats(
      rate: rate,
      changePercent: change,
      changeAbs: changeAbs,
      spark: spark,
      growth: {
        '7d': growthSince(const Duration(days: 7)),
        '1m': growthSince(const Duration(days: 30)),
        '1y': growthSince(const Duration(days: 365)),
        '3y': growthSince(const Duration(days: 365 * 3)),
      },
      updatedAt: updated,
    );
    _cache = stats;
    _cacheAt = DateTime.now();
    return stats;
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final double cardWidth = MediaQuery.of(context).size.width / 2 - 24;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 16.0, bottom: 16.0),
          child: Text(
            tr('home.todays_rate'),
            style: AppText.sectionTitle.copyWith(fontSize: 14.0),
          ),
        ),
        GestureDetector(
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => ExchangeScreen(
                userRepository: context.read<UserRepository>(),
                metalId: 1,
              ),
            ),
          ),
          child: Container(
            width: cardWidth,
            height: 240,
            padding: const EdgeInsets.all(14.0),
            decoration: BoxDecoration(
              color: CustomColors.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(width: 1.0, color: CustomColors.surfaceBorder),
              boxShadow: [
                BoxShadow(
                  color: CustomColors.accent.withOpacity(0.08),
                  blurRadius: 24,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: FutureBuilder<_RateStats?>(
              future: _future,
              builder: (context, snap) {
                final s = snap.data;
                if (s == null) {
                  return const Center(
                      child: CircularProgressIndicator(strokeWidth: 2));
                }
                return _content(s);
              },
            ),
          ),
        ),
      ],
    );
  }

  Widget _content(_RateStats s) {
    final fmt = NumberFormat('#,##0');
    final bool up = s.changePercent >= 0;
    final Color cc = up ? CustomColors.positive : CustomColors.negative;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            AppIconTile(
              size: 34.0,
              child: SvgPicture.asset("assets/icons/gold-bar-active.svg",
                  height: 16.0, color: CustomColors.accent),
            ),
            const SizedBox(width: 8.0),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(tr('order.gold'),
                    style: AppText.bodyBold.copyWith(fontSize: 13.0)),
                Text("XAU", style: AppText.caption.copyWith(fontSize: 10.0)),
              ],
            ),
            const Spacer(),
            Text(DateFormat('MM.dd').format(DateTime.now()),
                style: AppText.caption.copyWith(fontSize: 10.0)),
          ],
        ),
        const SizedBox(height: 10.0),
        Text.rich(
          TextSpan(children: [
            TextSpan(text: "${fmt.format(s.rate)}₮"),
            TextSpan(
                text: tr('home.per_gram'),
                style: AppText.caption.copyWith(fontSize: 11.0)),
          ]),
          style: AppText.display.copyWith(fontSize: 21.0),
        ),
        const SizedBox(height: 6.0),
        Row(
          children: [
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 7.0, vertical: 3.0),
              decoration: BoxDecoration(
                color: cc.withOpacity(0.16),
                borderRadius: BorderRadius.circular(8.0),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(up ? Ionicons.caret_up : Ionicons.caret_down,
                      size: 10.0, color: cc),
                  const SizedBox(width: 2.0),
                  Text(
                    "${up ? '+' : ''}${s.changePercent.toStringAsFixed(2)}%",
                    style: TextStyle(
                        fontFamily: AppText.bold,
                        fontSize: 11.0,
                        fontWeight: FontWeight.bold,
                        color: cc),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 6.0),
            Flexible(
              child: Text(
                "${s.changeAbs >= 0 ? '+' : '−'}${fmt.format(s.changeAbs.abs())}₮",
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppText.caption.copyWith(fontSize: 11.0),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8.0),
        SizedBox(
          height: 46.0,
          width: double.infinity,
          child: CustomPaint(painter: _SparkPainter(s.spark, cc)),
        ),
        const SizedBox(height: 8.0),
        Row(
          children: [
            Expanded(child: _growthCell(tr('home.growth_1y'), s.growth['1y'])),
            Expanded(
                child: _growthCell(tr('home.growth_3y'), s.growth['3y'],
                    highlight: true)),
          ],
        ),
        const Spacer(),
        Text(tr('home.rate_source'),
            style: AppText.caption
                .copyWith(fontSize: 9.5, color: CustomColors.textTertiary)),
      ],
    );
  }

  Widget _growthCell(String label, double? v, {bool highlight = false}) {
    final Color c = v == null
        ? CustomColors.textTertiary
        : (v >= 0 ? CustomColors.positive : CustomColors.negative);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppText.caption.copyWith(fontSize: 10.0)),
        Text(
          v == null ? "—" : "${v >= 0 ? '+' : ''}${v.toStringAsFixed(1)}%",
          style: TextStyle(
            fontFamily: AppText.bold,
            fontSize: highlight ? 14.0 : 12.5,
            fontWeight: FontWeight.bold,
            color: highlight && v != null ? CustomColors.accent : c,
          ),
        ),
      ],
    );
  }
}

class _SparkPainter extends CustomPainter {
  _SparkPainter(this.values, this.color);
  final List<double> values;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    if (values.length < 2) return;
    final double minV = values.reduce((a, b) => a < b ? a : b);
    final double maxV = values.reduce((a, b) => a > b ? a : b);
    final double range = (maxV - minV) <= 0 ? 1.0 : (maxV - minV);
    final pts = List<Offset>.generate(
      values.length,
      (i) => Offset(size.width * i / (values.length - 1),
          size.height - 3 - (values[i] - minV) / range * (size.height - 6)),
    );
    final path = Path()..moveTo(pts.first.dx, pts.first.dy);
    for (int i = 0; i < pts.length - 1; i++) {
      final p0 = i == 0 ? pts[i] : pts[i - 1];
      final p1 = pts[i];
      final p2 = pts[i + 1];
      final p3 = i + 2 < pts.length ? pts[i + 2] : p2;
      final c1 =
          Offset(p1.dx + (p2.dx - p0.dx) / 6, p1.dy + (p2.dy - p0.dy) / 6);
      final c2 =
          Offset(p2.dx - (p3.dx - p1.dx) / 6, p2.dy - (p3.dy - p1.dy) / 6);
      path.cubicTo(c1.dx, c1.dy, c2.dx, c2.dy, p2.dx, p2.dy);
    }
    final fill = Path.from(path)
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();
    canvas.drawPath(
      fill,
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [color.withOpacity(0.28), color.withOpacity(0.0)],
        ).createShader(Offset.zero & size),
    );
    canvas.drawPath(
      path,
      Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.8
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round,
    );
    canvas.drawCircle(pts.last, 3.0, Paint()..color = color);
  }

  @override
  bool shouldRepaint(_SparkPainter old) =>
      old.values != values || old.color != color;
}
