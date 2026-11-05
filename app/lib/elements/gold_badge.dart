import 'package:flutter/material.dart';
import 'package:onegrgold/style/app_text.dart';

/// Тансаг алтан tag: бараан алтнаас гялалзсан алт руу шилжих градиент,
/// нарийн алтан хүрээ, зөөлөн гэрэлтэлт, дээгүүр нь аажуу урсах гялбаа.
/// Барааны карт дээрх "Алтан эдлэл" тэмдэгт ашиглана.
class GoldBadge extends StatefulWidget {
  final String label;
  final IconData? icon;
  const GoldBadge(
      {super.key, required this.label, this.icon = Icons.diamond_outlined});

  @override
  State<GoldBadge> createState() => _GoldBadgeState();
}

class _GoldBadgeState extends State<GoldBadge>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 2600),
  )..repeat();

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  static const _dark = Color(0xFF8A6508);
  static const _mid = Color(0xFFD9A826);
  static const _light = Color(0xFFFFE89A);
  static const _text = Color(0xFF3B2A05);

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: _mid.withOpacity(0.45),
            blurRadius: 8,
            spreadRadius: 0.5,
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: Stack(
          children: [
            // Суурь: босоо чиглэлд бараан → гялалзсан → бараан алт
            Container(
              padding: const EdgeInsets.fromLTRB(7, 3, 8, 3),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [_dark, _mid, _light, _mid, _dark],
                  stops: [0.0, 0.3, 0.5, 0.7, 1.0],
                ),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: _light.withOpacity(0.7), width: 0.8),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (widget.icon != null) ...[
                    Icon(widget.icon, size: 10, color: _text),
                    const SizedBox(width: 3),
                  ],
                  Text(
                    widget.label,
                    style: const TextStyle(
                      fontFamily: AppText.bold,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.3,
                      color: _text,
                    ),
                  ),
                ],
              ),
            ),
            // Урсах гялбаа
            Positioned.fill(
              child: IgnorePointer(
                child: AnimatedBuilder(
                  animation: _ctrl,
                  builder: (_, __) {
                    final t = _ctrl.value;
                    return FractionalTranslation(
                      translation: Offset(-1.2 + t * 2.4, 0),
                      child: Transform(
                        transform: Matrix4.skewX(-0.5),
                        child: Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                Colors.white.withOpacity(0),
                                Colors.white.withOpacity(0.55),
                                Colors.white.withOpacity(0),
                              ],
                              stops: const [0.35, 0.5, 0.65],
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
