import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';

/// Бодит алтан металл долгионы аажим анимэйшнтэй background.
class GoldWavesBackground extends StatefulWidget {
  const GoldWavesBackground({super.key});

  @override
  State<GoldWavesBackground> createState() => _GoldWavesBackgroundState();
}

class _GoldWavesBackgroundState extends State<GoldWavesBackground>
    with SingleTickerProviderStateMixin {
  static Future<ui.FragmentProgram>? _programFuture;
  ui.FragmentShader? _shader;
  late final Ticker _ticker;
  double _time = 0.0;

  @override
  void initState() {
    super.initState();
    _programFuture ??= ui.FragmentProgram.fromAsset('shaders/gold_waves.frag');
    _programFuture!.then((program) {
      if (!mounted) return;
      setState(() => _shader = program.fragmentShader());
    });
    _ticker = createTicker((elapsed) {
      if (_shader == null) return;
      setState(() => _time = elapsed.inMicroseconds / 1e6);
    })
      ..start();
  }

  @override
  void dispose() {
    _ticker.dispose();
    _shader?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final shader = _shader;
    if (shader == null) {
      // Shader ачаалагдах хооронд хуучин зургаа харуулна
      return Image.asset(
        'assets/images/backgrounds/background-1.jpg',
        fit: BoxFit.cover,
      );
    }
    return CustomPaint(
      painter: _GoldWavesPainter(shader, _time),
      size: Size.infinite,
    );
  }
}

class _GoldWavesPainter extends CustomPainter {
  _GoldWavesPainter(this.shader, this.time);

  final ui.FragmentShader shader;
  final double time;

  @override
  void paint(Canvas canvas, Size size) {
    shader
      ..setFloat(0, size.width)
      ..setFloat(1, size.height)
      ..setFloat(2, time);
    canvas.drawRect(Offset.zero & size, Paint()..shader = shader);
  }

  @override
  bool shouldRepaint(_GoldWavesPainter oldDelegate) =>
      oldDelegate.time != time || oldDelegate.shader != shader;
}
