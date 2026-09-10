import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

/// Ширхэгтэй шижир алтан дугуй товч — утасны хазайлтаар гялалзаж,
/// голд нь өгсөн SVG icon-ийг сийлж харуулна.
class GoldGlitterButton extends StatefulWidget {
  const GoldGlitterButton({
    super.key,
    required this.size,
    required this.iconAsset,
    this.onTap,
    this.tintIconWhite = true,
  });

  final double size;
  final String iconAsset;
  final VoidCallback? onTap;

  /// Нэг өнгийн (хар) SVG-г бүхэлд нь сийлэхийн тулд цагаанаар будна;
  /// олон өнгийн icon-д харанхуй хэсгийг сийлбэрээс хасахын тулд унтраана
  final bool tintIconWhite;

  @override
  State<GoldGlitterButton> createState() => _GoldGlitterButtonState();
}

class _GoldGlitterButtonState extends State<GoldGlitterButton> {
  static Future<ui.FragmentProgram>? _programFuture;
  static final Map<String, ui.Image> _iconCache = {};

  ui.FragmentShader? _shader;
  ui.Image? _icon;

  @override
  void initState() {
    super.initState();
    _programFuture ??= ui.FragmentProgram.fromAsset('shaders/gold_button.frag');
    _programFuture!.then((program) {
      if (!mounted) return;
      setState(() => _shader = program.fragmentShader());
    });
    _loadIcon();
  }

  /// SVG-г өнгөт зураг болгож зурна; shader нь alpha + гэрэлтэлтээс маск гаргана
  Future<void> _loadIcon() async {
    final String cacheKey = '${widget.iconAsset}|${widget.tintIconWhite}';
    final cached = _iconCache[cacheKey];
    if (cached != null) {
      setState(() => _icon = cached);
      return;
    }
    try {
      final info = await vg.loadPicture(SvgAssetLoader(widget.iconAsset), null);
      const double res = 256.0;
      final recorder = ui.PictureRecorder();
      final canvas = Canvas(recorder);
      final double sc = res /
          (info.size.width > info.size.height
              ? info.size.width
              : info.size.height);
      canvas.translate(
          (res - info.size.width * sc) / 2, (res - info.size.height * sc) / 2);
      canvas.scale(sc, sc);
      canvas.drawPicture(info.picture);
      final img =
          await recorder.endRecording().toImage(res.toInt(), res.toInt());
      info.picture.dispose();
      _iconCache[widget.iconAsset] = img;
      if (!mounted) return;
      setState(() => _icon = img);
    } catch (_) {}
  }

  @override
  void dispose() {
    _shader?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final shader = _shader;
    final icon = _icon;
    Widget face;
    if (shader == null || icon == null) {
      face = const DecoratedBox(
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFFD69A26), Color(0xFFFFD66B)],
          ),
        ),
      );
    } else {
      face = CustomPaint(
        // Статик: хазайлт/хөдөлгөөний тусгалгүй
        painter: _GoldButtonPainter(shader, icon, 0.0, 0.0, 0.0, 0.0),
      );
    }
    return SizedBox(
      width: widget.size,
      height: widget.size,
      child: Material(
        color: Colors.transparent,
        shape: const CircleBorder(),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: widget.onTap,
          customBorder: const CircleBorder(),
          child: face,
        ),
      ),
    );
  }
}

class _GoldButtonPainter extends CustomPainter {
  _GoldButtonPainter(
      this.shader, this.icon, this.time, this.tiltX, this.tiltY, this.motion);

  final ui.FragmentShader shader;
  final ui.Image icon;
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
      ..setFloat(5, motion)
      ..setImageSampler(0, icon);
    canvas.drawRect(Offset.zero & size, Paint()..shader = shader);
  }

  @override
  bool shouldRepaint(_GoldButtonPainter old) =>
      old.time != time ||
      old.tiltX != tiltX ||
      old.tiltY != tiltY ||
      old.motion != motion ||
      old.icon != icon ||
      old.shader != shader;
}
