import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';

/// Гарын үсгийн зураасуудыг хадгалж, PNG болгон гаргана.
class SignatureController extends ChangeNotifier {
  final List<List<Offset>> _strokes = [];
  Size _size = Size.zero;

  bool get isEmpty => _strokes.every((s) => s.length < 2);
  List<List<Offset>> get strokes => _strokes;
  Size get size => _size;

  void _start(Offset p) {
    _strokes.add([p]);
    notifyListeners();
  }

  void _extend(Offset p) {
    if (_strokes.isEmpty) {
      _strokes.add([p]);
    } else {
      _strokes.last.add(p);
    }
    notifyListeners();
  }

  void clear() {
    _strokes.clear();
    notifyListeners();
  }

  /// Цагаан дэвсгэр дээр хар зураастай PNG. [scale] — нягтрал (2 = retina).
  Future<Uint8List> toPng({double scale = 2.0}) async {
    final w = (_size.width * scale).round().clamp(1, 4000);
    final h = (_size.height * scale).round().clamp(1, 4000);
    final recorder = ui.PictureRecorder();
    final canvas = Canvas(recorder);
    canvas.drawRect(
      Rect.fromLTWH(0, 0, w.toDouble(), h.toDouble()),
      Paint()..color = Colors.white,
    );
    canvas.scale(scale, scale);
    _SignaturePainter.paintStrokes(canvas, _strokes, Colors.black);
    final image = await recorder.endRecording().toImage(w, h);
    final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
    image.dispose();
    return bytes!.buffer.asUint8List();
  }
}

/// Хуруугаар гарын үсэг зурах самбар.
class SignaturePad extends StatelessWidget {
  final SignatureController controller;
  final Color strokeColor;
  final Color background;

  const SignaturePad({
    super.key,
    required this.controller,
    this.strokeColor = Colors.black,
    this.background = Colors.white,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        controller._size = Size(constraints.maxWidth, constraints.maxHeight);
        return GestureDetector(
          behavior: HitTestBehavior.opaque,
          onPanStart: (d) => controller._start(d.localPosition),
          onPanUpdate: (d) => controller._extend(d.localPosition),
          child: AnimatedBuilder(
            animation: controller,
            builder: (context, _) => CustomPaint(
              painter: _SignaturePainter(
                controller.strokes,
                strokeColor,
                background,
              ),
              size: Size.infinite,
            ),
          ),
        );
      },
    );
  }
}

class _SignaturePainter extends CustomPainter {
  final List<List<Offset>> strokes;
  final Color color;
  final Color background;

  _SignaturePainter(this.strokes, this.color, this.background);

  static void paintStrokes(Canvas canvas, List<List<Offset>> strokes, Color color) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 2.6
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..style = PaintingStyle.stroke;
    for (final s in strokes) {
      if (s.length == 1) {
        canvas.drawCircle(s.first, 1.3, Paint()..color = color);
        continue;
      }
      final path = Path()..moveTo(s.first.dx, s.first.dy);
      for (var i = 1; i < s.length; i++) {
        path.lineTo(s[i].dx, s[i].dy);
      }
      canvas.drawPath(path, paint);
    }
  }

  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawRect(Offset.zero & size, Paint()..color = background);
    paintStrokes(canvas, strokes, color);
  }

  @override
  bool shouldRepaint(_SignaturePainter old) => true;
}
