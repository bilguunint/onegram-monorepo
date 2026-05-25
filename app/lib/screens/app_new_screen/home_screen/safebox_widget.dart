import 'dart:math' as math;
import 'package:flutter/material.dart';

class CombinationDial extends StatefulWidget {
  const CombinationDial({
    super.key,
    this.size = 240,
    this.tickCount = 100,
    this.majorTickEvery = 10,
    this.spinTurnsOnTap = 1.0,
    this.duration = const Duration(milliseconds: 800),
    this.dialColor = const Color(0xFF1C2333),
    this.ringColor = const Color(0xFF2C3750),
    this.tickColor = Colors.white70,
    this.numberColor = Colors.white,
    this.pointerColor = const Color(0xFFFFD166),
    this.shadowColor = Colors.black54,
    this.onSpinEnd,
  });

  final double size;
  final int tickCount;
  final int majorTickEvery;
  final double spinTurnsOnTap;
  final Duration duration;
  final Color dialColor;
  final Color ringColor;
  final Color tickColor;
  final Color numberColor;
  final Color pointerColor;
  final Color shadowColor;
  final VoidCallback? onSpinEnd;

  @override
  State<CombinationDial> createState() => _CombinationDialState();
}

class _CombinationDialState extends State<CombinationDial>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late Animation<double> _rotation;
  double _angle = 0; // radians

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: widget.duration);
    _rotation = CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic)
        .drive(Tween<double>(begin: 0, end: 0))
      ..addStatusListener((status) {
        if (status == AnimationStatus.completed) {
          widget.onSpinEnd?.call();
        }
      });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _spin() {
    if (_controller.isAnimating) return;
    
    final targetDelta = widget.spinTurnsOnTap * 2 * math.pi;
    final startAngle = _angle;
    
    _rotation = CurvedAnimation(
      parent: _controller..reset(),
      curve: Curves.easeOutCubic,
    ).drive(Tween<double>(begin: 0, end: targetDelta))
      ..addListener(() {
        setState(() {
          _angle = startAngle + _rotation.value;
        });
      });

    _controller.forward().whenComplete(() {
      _angle = _normalizeAngle(_angle);
      setState(() {});
    });
  }

  double _normalizeAngle(double a) {
    final twoPi = 2 * math.pi;
    a %= twoPi;
    if (a < 0) a += twoPi;
    return a;
  }

  @override
  Widget build(BuildContext context) {
    final size = widget.size;

    return GestureDetector(
      onTap: _spin,
      child: SizedBox(
        width: size,
        height: size,
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Сүүдэртэй дугуй суурь
            Container(
              width: size,
              height: size,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: widget.shadowColor,
                    blurRadius: 24,
                    spreadRadius: 1,
                    offset: const Offset(0, 12),
                  ),
                ],
              ),
            ),

            // Эргэдэг хэсэг
            AnimatedBuilder(
              animation: _controller,
              builder: (context, _) {
                // rotation: одоогийн _angle
                return Transform.rotate(
                  angle: _angle,
                  child: CustomPaint(
                    size: Size.square(size),
                    painter: _DialPainter(
                      tickCount: widget.tickCount,
                      majorTickEvery: widget.majorTickEvery,
                      dialColor: widget.dialColor,
                      ringColor: widget.ringColor,
                      tickColor: widget.tickColor,
                      numberColor: widget.numberColor,
                    ),
                  ),
                );
              },
            ),

            // Дээд талын pointer (эргэдэггүй)
            _Pointer(color: widget.pointerColor),

            
          ],
        ),
      ),
    );
  }
}

class _Pointer extends StatelessWidget {
  const _Pointer({required this.color});
  final Color color;

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: CustomPaint(
        size: const Size(8, 8),
        painter: _PointerPainter(color),
      ),
    );
  }
}

class _PointerPainter extends CustomPainter {
  _PointerPainter(this.color);
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = color;
    final path = Path();
    // Доош чиглэсэн жижиг сум (тэгш өнцөгт гурвалжин)
    path.moveTo(size.width / 2, 0);
    path.lineTo(0, size.height);
    path.lineTo(size.width, size.height);
    path.close();
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant _PointerPainter oldDelegate) =>
      oldDelegate.color != color;
}

class _DialPainter extends CustomPainter {
  _DialPainter({
    required this.tickCount,
    required this.majorTickEvery,
    required this.dialColor,
    required this.ringColor,
    required this.tickColor,
    required this.numberColor,
  });

  final int tickCount;
  final int majorTickEvery;
  final Color dialColor;
  final Color ringColor;
  final Color tickColor;
  final Color numberColor;

  @override
  void paint(Canvas canvas, Size size) {
    final center = size.center(Offset.zero);
    final radius = size.width / 2;

    // Дотор дугуй
    final dialPaint = Paint()..color = dialColor;
    canvas.drawCircle(center, radius * 0.86, dialPaint);

    // Гадна ring
    final ringPaint = Paint()
      ..color = ringColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = radius * 0.14;
    canvas.drawCircle(center, radius * 0.86, ringPaint);

    // Тикүүд
    final tickPaint = Paint()
      ..color = tickColor
      ..strokeCap = StrokeCap.round;

    final smallTickLen = radius * 0.08;
    final bigTickLen = radius * 0.14;

    final textPainter = TextPainter(
      textAlign: TextAlign.center,
      textDirection: TextDirection.ltr,
    );

    for (int i = 0; i < tickCount; i++) {
      final isMajor = i % majorTickEvery == 0;
      tickPaint.strokeWidth = isMajor ? 3 : 1.5;

      final angle = -math.pi / 2 + (2 * math.pi) * (i / tickCount);
      final outer = Offset(
        center.dx + math.cos(angle) * (radius * 0.86 + ringPaint.strokeWidth / 2),
        center.dy + math.sin(angle) * (radius * 0.86 + ringPaint.strokeWidth / 2),
      );
      final inner = Offset(
        center.dx + math.cos(angle) * (radius * 0.86 - (isMajor ? bigTickLen : smallTickLen)),
        center.dy + math.sin(angle) * (radius * 0.86 - (isMajor ? bigTickLen : smallTickLen)),
      );
      canvas.drawLine(outer, inner, tickPaint);

      // Тоонууд (арван тутамд)
      if (isMajor) {
        final label = '${(i) % tickCount}';
        final textStyle = TextStyle(
          color: numberColor,
          fontSize: radius * 0.13,
          fontFeatures: const [FontFeature.tabularFigures()],
        );
        textPainter.text = TextSpan(text: label, style: textStyle);
        textPainter.layout();

        final textRadius = radius * 0.86 - bigTickLen - radius * 0.10;
        final tx = center.dx + math.cos(angle) * textRadius;
        final ty = center.dy + math.sin(angle) * textRadius;

        // Текстийг төвшилж, уншигдахуйц байрлуулах
        final textOffset = Offset(
          tx - textPainter.width / 2,
          ty - textPainter.height / 2,
        );
        textPainter.paint(canvas, textOffset);
      }
    }

  }

  @override
  bool shouldRepaint(covariant _DialPainter oldDelegate) {
    return oldDelegate.tickCount != tickCount ||
        oldDelegate.majorTickEvery != majorTickEvery ||
        oldDelegate.dialColor != dialColor ||
        oldDelegate.ringColor != ringColor ||
        oldDelegate.tickColor != tickColor ||
        oldDelegate.numberColor != numberColor;
  }
}
