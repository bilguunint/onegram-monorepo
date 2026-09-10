import 'package:flutter/material.dart';
import 'package:rainbow_edge_lighting/rainbow_edge_lighting.dart';

import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/shuteen_model.dart';
import 'package:onegrgold/repositories/shuteen_repository.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:onegrgold/screens/app_new_screen/shuteen_screen/shuteen_detail_screen.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

/// Алтан гялалзсан ирмэг
const List<Color> _kEdgeColors = [
  Color(0xFFF6B800),
  Color(0xFFFFE08A),
  Color(0xFFF6B800),
  Color(0x33F6B800),
  Color(0xFFF6B800),
];

/// Нүүрний "Шүтээн хуур" том карт — ханш, хуваан төлөлтийн мөрний доор.
/// Хөтөлбөр идэвхгүй бол огт зай эзлэхгүй. Cover зураг бүхэлдээ дэвсгэр,
/// доод хэсэгт нэр, 3 гол тоо, дэлгэрэнгүй товч.
class ShuteenHomeCard extends StatefulWidget {
  const ShuteenHomeCard({super.key});

  @override
  State<ShuteenHomeCard> createState() => _ShuteenHomeCardState();
}

class _ShuteenHomeCardState extends State<ShuteenHomeCard> {
  // Stream-ийг нэг удаа үүсгэнэ — нүүр дахин build хийхэд дахин subscribe хийхгүй
  late final Stream<ShuteenProgramInfo> _stream =
      ShuteenRepository().watchProgram();

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<ShuteenProgramInfo>(
      stream: _stream,
      builder: (context, snapshot) {
        final p = snapshot.data;
        if (p == null || !p.isActive) return const SizedBox.shrink();
        return Padding(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(bottom: 12.0),
                child: Text(p.title,
                    style: AppText.sectionTitle.copyWith(fontSize: 14.0)),
              ),
              _Card(program: p),
            ],
          ),
        );
      },
    );
  }
}

class _Card extends StatelessWidget {
  const _Card({required this.program});
  final ShuteenProgramInfo program;

  @override
  Widget build(BuildContext context) {
    final p = program;
    final String? cover = p.coverImage ??
        (p.heroImages.isNotEmpty ? p.heroImages.first : null);

    return GestureDetector(
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => const ShuteenDetailScreen()),
      ),
      child: RainbowEdgeLighting(
        radius: 20,
        thickness: 0.5,
        speed: 0.5,
        colors: _kEdgeColors,
        child: Container(
          height: 250,
          decoration: BoxDecoration(
            color: CustomColors.surface,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(width: 1.0, color: CustomColors.surfaceBorder),
            boxShadow: [
              BoxShadow(
                color: CustomColors.accent.withOpacity(0.12),
                blurRadius: 26,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: Stack(
            fit: StackFit.expand,
            children: [
              if (cover != null && cover.isNotEmpty)
                Image.network(
                  cover,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => const _Fallback(),
                )
              else
                const _Fallback(),
              // Доод хэсгийг харанхуйлах градиент
              Positioned.fill(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.black.withOpacity(0.05),
                        Colors.black.withOpacity(0.30),
                        Colors.black.withOpacity(0.90),
                      ],
                      stops: const [0.0, 0.45, 1.0],
                    ),
                  ),
                ),
              ),
              // Дээд зүүн: badge
              Positioned(
                left: 14,
                top: 14,
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.45),
                    borderRadius: BorderRadius.circular(9),
                    border: Border.all(
                        color: CustomColors.accent.withOpacity(0.6)),
                  ),
                  child: Text(
                    tr('shuteen.card_badge'),
                    style: TextStyle(
                      fontFamily: AppText.bold,
                      fontSize: 10.5,
                      fontWeight: FontWeight.bold,
                      color: CustomColors.accent,
                    ),
                  ),
                ),
              ),
              Positioned(
                left: 16,
                right: 16,
                bottom: 14,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      p.subtitle.isNotEmpty ? p.subtitle : p.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.bodyBold.copyWith(
                        fontSize: 13,
                        height: 1.3,
                        shadows: const [
                          Shadow(blurRadius: 8, color: Colors.black87),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _Stat(
                          label: tr('shuteen.card_unit_price'),
                          value: formatMNT(p.unitPrice),
                        ),
                        _Stat(
                          label: tr('shuteen.card_growth'),
                          value: '${_fmtNum(p.annualGrowthPercent)}%',
                          accent: true,
                        ),
                        _Stat(
                          label: tr('shuteen.card_buyback',
                              {'months': p.holdMonths}),
                          value: formatMNT(p.buybackPrice),
                          accent: true,
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 7),
                          decoration: BoxDecoration(
                            color: CustomColors.accent,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(tr('shuteen.card_cta'),
                                  style: AppText.button.copyWith(fontSize: 12)),
                              const SizedBox(width: 2),
                              const Icon(Icons.chevron_right_rounded,
                                  size: 16, color: Colors.black),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

String _fmtNum(num n) => n == n.roundToDouble() ? '${n.toInt()}' : '$n';

class _Stat extends StatelessWidget {
  const _Stat({required this.label, required this.value, this.accent = false});
  final String label;
  final String value;
  final bool accent;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppText.caption.copyWith(
                  fontSize: 10.5, color: Colors.white.withOpacity(0.7))),
          const SizedBox(height: 2),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: AppText.bodyBold.copyWith(
              fontSize: 14.5,
              color: accent ? CustomColors.accent : Colors.white,
              shadows: const [Shadow(blurRadius: 6, color: Colors.black87)],
            ),
          ),
        ],
      ),
    );
  }
}

class _Fallback extends StatelessWidget {
  const _Fallback();

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [CustomColors.surfaceAlt, CustomColors.surface],
        ),
      ),
      child: Center(
        child: Icon(Icons.diamond_outlined,
            size: 56, color: CustomColors.accent.withOpacity(0.45)),
      ),
    );
  }
}
