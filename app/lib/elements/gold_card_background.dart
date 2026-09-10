import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:flutter/scheduler.dart';
import 'package:onegrgold/elements/tilt_controller.dart';

/// Утасны хазайлтыг мэдэрч гэрлийн туяа нь хөдөлдөг brushed gold картын дэвсгэр.
class GoldCardBackground extends StatefulWidget {
  const GoldCardBackground(
      {super.key,
      this.engraveValue,
      this.engraveUnit,
      this.chartPoints,
      this.chartMarkers});

  /// Картан дээр сийлж харуулах үлдэгдэл (жишээ нь "14.5") ба нэгж ("гр")
  final String? engraveValue;
  final String? engraveUnit;

  /// Сийлж харуулах ханшийн муруй — 0..1 нормчилсан (x: цаг, y: 0=бага, 1=их)
  final List<Offset>? chartPoints;

  /// Муруй дээр сийлж тэмдэглэх цэгүүд (шошго, x: 0..1) — жишээ нь онууд
  final List<MapEntry<String, double>>? chartMarkers;

  @override
  State<GoldCardBackground> createState() => _GoldCardBackgroundState();
}

class _GoldCardBackgroundState extends State<GoldCardBackground>
    with SingleTickerProviderStateMixin {
  static Future<ui.FragmentProgram>? _programFuture;
  // Widget дахин үүсэхэд (scroll, таб солих) дахин зурахгүйн тулд
  // зургуудыг апп-ын амьдралын туршид static кэшилнэ.
  static ui.Image? _logoCache;
  static final Map<String, ui.Image> _textCache = {};
  static ui.Image? _chartCache;
  static String? _chartCacheKey;

  ui.FragmentShader? _shader;
  ui.Image? _logo;
  ui.Image? _text;
  ui.Image? _chart;
  Size? _chartSize;
  late final Ticker _ticker;
  final TiltController _tilt = TiltController.instance;

  double _time = 0.0;
  double _targetX = 0.0, _targetY = 0.0;
  double _tiltX = 0.0, _tiltY = 0.0;
  // Эргэлтийн хурдаас гарах хөдөлгөөний эрчим (0..1)
  double _motionTarget = 0.0, _motion = 0.0;

  @override
  void initState() {
    super.initState();
    _programFuture ??= ui.FragmentProgram.fromAsset('shaders/gold_card.frag');
    _programFuture!.then((program) {
      if (!mounted) return;
      setState(() => _shader = program.fragmentShader());
    });
    _loadLogo();
    _rasterText();
    _tilt.acquire();
    _ticker = createTicker((elapsed) {
      if (_shader == null || _logo == null || _text == null || _chart == null) {
        return;
      }
      setState(() {
        _time = elapsed.inMicroseconds / 1e6;
        _targetX = _tilt.targetX;
        _targetY = _tilt.targetY;
        _motionTarget = _tilt.motionTarget;
        _tiltX += (_targetX - _tiltX) * 0.08;
        _tiltY += (_targetY - _tiltY) * 0.08;
        _motion +=
            (_motionTarget - _motion) * (_motionTarget > _motion ? 0.25 : 0.05);
      });
    })
      ..start();
  }

  @override
  void didUpdateWidget(covariant GoldCardBackground old) {
    super.didUpdateWidget(old);
    if (old.engraveValue != widget.engraveValue ||
        old.engraveUnit != widget.engraveUnit) {
      _rasterText();
    }
    if ((old.chartPoints != widget.chartPoints ||
            old.chartMarkers != widget.chartMarkers) &&
        _chartSize != null) {
      _rasterChart(_chartSize!);
    }
  }

  /// Ханшийн муруйг картын хэмжээгээр (2x нягтралтай) цагаан alpha-маск болгож зурна.
  /// Захаас дотогш зайтай тул rim дээгүүр явахгүй.
  Future<void> _rasterChart(Size size) async {
    final String key =
        '${size.width.round()}x${size.height.round()}|${identityHashCode(widget.chartPoints)}|${widget.chartPoints?.length ?? 0}|${identityHashCode(widget.chartMarkers)}';
    if (_chartCache != null && _chartCacheKey == key) {
      if (_chart != _chartCache) setState(() => _chart = _chartCache);
      return;
    }
    try {
      const double scale = 2.0;
      final int w = (size.width * scale).ceil().clamp(2, 4096);
      final int h = (size.height * scale).ceil().clamp(2, 4096);
      final recorder = ui.PictureRecorder();
      final canvas = Canvas(recorder);
      final pts = widget.chartPoints;
      if (pts != null && pts.length >= 2) {
        const double padX = 0.0;
        const double padBottom = 30.0;
        const double chartH = 64.0;
        final double x0 = padX * scale;
        final double x1 = (size.width - padX) * scale;
        final double yTop = (size.height - padBottom - chartH) * scale;
        final double yBot = (size.height - padBottom) * scale;
        final List<Offset> o = pts
            .map((p) => Offset(x0 + (x1 - x0) * p.dx.clamp(0.0, 1.0),
                yBot - (yBot - yTop) * p.dy.clamp(0.0, 1.0)))
            .toList();
        final path = Path()..moveTo(o.first.dx, o.first.dy);
        for (int i = 0; i < o.length - 1; i++) {
          final p0 = i == 0 ? o[i] : o[i - 1];
          final p1 = o[i];
          final p2 = o[i + 1];
          final p3 = i + 2 < o.length ? o[i + 2] : p2;
          final c1 = Offset(
              p1.dx + (p2.dx - p0.dx) / 6.0, p1.dy + (p2.dy - p0.dy) / 6.0);
          final c2 = Offset(
              p2.dx - (p3.dx - p1.dx) / 6.0, p2.dy - (p3.dy - p1.dy) / 6.0);
          path.cubicTo(c1.dx, c1.dy, c2.dx, c2.dy, p2.dx, p2.dy);
        }
        // Муруйн доод талбай (ногоон суваг = ширхэгтэй алтны бүс), зураас цагаан (улаан суваг)
        final fill = Path.from(path)
          ..lineTo(o.last.dx, size.height * scale)
          ..lineTo(o.first.dx, size.height * scale)
          ..close();
        canvas.drawPath(
            fill,
            Paint()
              ..color = const Color(0xFF00FF00)
              ..style = PaintingStyle.fill);
        canvas.drawPath(
          path,
          Paint()
            ..color = Colors.white
            ..style = PaintingStyle.stroke
            ..strokeWidth = 2.2 * scale
            ..strokeCap = StrokeCap.round
            ..strokeJoin = StrokeJoin.round,
        );
        // Тэмдэглэгээ: муруйн дээр жижиг он (сийлэгдэнэ), цэггүй
        for (final m
            in widget.chartMarkers ?? const <MapEntry<String, double>>[]) {
          final double mx = m.value.clamp(0.0, 1.0);
          int j = 0;
          while (j < pts.length - 2 && pts[j + 1].dx < mx) {
            j++;
          }
          final Offset a = pts[j];
          final Offset b = pts[j + 1];
          final double f = (b.dx - a.dx).abs() < 1e-9
              ? 0.0
              : ((mx - a.dx) / (b.dx - a.dx)).clamp(0.0, 1.0);
          final double my = a.dy + (b.dy - a.dy) * f;
          final Offset c =
              Offset(x0 + (x1 - x0) * mx, yBot - (yBot - yTop) * my);
          final tp = TextPainter(
            text: TextSpan(
              text: m.key,
              style: TextStyle(
                  fontFamily: 'RubikBold',
                  fontSize: 9.0 * scale,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.8 * scale,
                  color: Colors.white),
            ),
            textDirection: TextDirection.ltr,
          )..layout();
          tp.paint(canvas,
              Offset(c.dx - tp.width / 2, c.dy - 9.0 * scale - tp.height));
        }
      }
      final img = await recorder.endRecording().toImage(w, h);
      _chartCache = img;
      _chartCacheKey = key;
      if (!mounted) return;
      setState(() => _chart = img);
    } catch (_) {}
  }

  /// Дардас ("FINE GOLD 999.9") + үлдэгдлийн текстийг нэг цагаан alpha-маск
  /// зураг болгож зурна (shader сийлнэ)
  String get _textKey =>
      '${widget.engraveValue ?? ''}|${widget.engraveUnit ?? ''}';

  Future<void> _rasterText() async {
    final cached = _textCache[_textKey];
    if (cached != null) {
      if (_text != cached) setState(() => _text = cached);
      return;
    }
    try {
      final String value = widget.engraveValue ?? '';
      final String unit = widget.engraveUnit ?? '';
      const double pad = 16.0;
      const double gap = 14.0;
      final stamp = TextPainter(
        text: const TextSpan(
          text: 'FINE GOLD 999.9',
          style: TextStyle(
              fontFamily: 'RubikBold',
              fontSize: 60.0,
              fontWeight: FontWeight.bold,
              letterSpacing: 9.0,
              color: Colors.white),
        ),
        textDirection: TextDirection.ltr,
      )..layout();
      final balance = TextPainter(
        text: TextSpan(
          children: [
            TextSpan(
              text: value,
              style: const TextStyle(
                  fontFamily: 'RubikBold',
                  fontSize: 160.0,
                  fontWeight: FontWeight.bold,
                  color: Colors.white),
            ),
            TextSpan(
              text: unit,
              style: const TextStyle(
                  fontFamily: 'RubikBold',
                  fontSize: 84.0,
                  fontWeight: FontWeight.bold,
                  color: Colors.white),
            ),
          ],
        ),
        textDirection: TextDirection.ltr,
      )..layout();
      final double w =
          (stamp.width > balance.width ? stamp.width : balance.width) + pad * 2;
      final double h = stamp.height + gap + balance.height + pad * 2;
      final recorder = ui.PictureRecorder();
      final canvas = Canvas(recorder);
      stamp.paint(canvas, const Offset(pad, pad));
      balance.paint(canvas, Offset(pad, pad + stamp.height + gap));
      final img = await recorder.endRecording().toImage(
            w.ceil().clamp(2, 4096),
            h.ceil().clamp(2, 1024),
          );
      _textCache[_textKey] = img;
      if (!mounted) return;
      setState(() => _text = img);
    } catch (_) {}
  }

  Future<void> _loadLogo() async {
    if (_logoCache != null) {
      setState(() => _logo = _logoCache);
      return;
    }
    try {
      final data = await rootBundle.load('assets/images/logo_mask.png');
      final codec = await ui.instantiateImageCodec(data.buffer.asUint8List());
      final frame = await codec.getNextFrame();
      _logoCache = frame.image;
      if (!mounted) return;
      setState(() => _logo = frame.image);
    } catch (_) {}
  }

  @override
  void dispose() {
    _ticker.dispose();
    // Зургууд static кэшид амьд үлдэнэ (дараагийн instance дахин ашиглана)
    _tilt.release();
    _shader?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (context, constraints) {
      final Size size = Size(constraints.maxWidth, constraints.maxHeight);
      if (size.isFinite && size.width > 0 && size != _chartSize) {
        _chartSize = size;
        Future.microtask(() => _rasterChart(size));
      }
      final shader = _shader;
      final logo = _logo;
      final text = _text;
      final chart = _chart;
      if (shader == null || logo == null || text == null || chart == null) {
        return const DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF855708), Color(0xFFD69A26), Color(0xFFFFD66B)],
            ),
          ),
        );
      }
      return CustomPaint(
        painter: _GoldCardPainter(
            shader, logo, text, chart, _time, _tiltX, _tiltY, _motion),
        size: Size.infinite,
      );
    });
  }
}

class _GoldCardPainter extends CustomPainter {
  _GoldCardPainter(this.shader, this.logo, this.text, this.chart, this.time,
      this.tiltX, this.tiltY, this.motion);

  final ui.FragmentShader shader;
  final ui.Image logo;
  final ui.Image text;
  final ui.Image chart;
  final double time;
  final double tiltX;
  final double tiltY;
  final double motion;

  @override
  void paint(Canvas canvas, Size size) {
    shader
      ..setFloat(0, size.width)
      ..setFloat(1, size.height)
      ..setFloat(2, time)
      ..setFloat(3, tiltX)
      ..setFloat(4, tiltY)
      ..setFloat(5, logo.width / logo.height)
      ..setFloat(6, motion)
      ..setFloat(7, text.width / text.height)
      ..setImageSampler(0, logo)
      ..setImageSampler(1, text)
      ..setImageSampler(2, chart);
    canvas.drawRect(Offset.zero & size, Paint()..shader = shader);
  }

  @override
  bool shouldRepaint(_GoldCardPainter old) =>
      old.time != time ||
      old.tiltX != tiltX ||
      old.tiltY != tiltY ||
      old.motion != motion ||
      old.text != text ||
      old.chart != chart ||
      old.shader != shader;
}
