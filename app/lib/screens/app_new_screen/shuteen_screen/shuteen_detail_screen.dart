import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/shuteen_model.dart';
import 'package:onegrgold/repositories/shuteen_repository.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:onegrgold/screens/app_new_screen/shuteen_screen/shuteen_buy_screen.dart';
import 'package:onegrgold/screens/app_new_screen/shuteen_screen/shuteen_my_orders_screen.dart';
import 'package:onegrgold/screens/app_new_screen/shuteen_screen/shuteen_verify_screen.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

/// "Шүтээн хуур" танилцуулга: зургийн цомог, гол тоонууд, 7 зарчим,
/// санхүүгийн нөхцөл, худалдан авалтын жишээ, урамшууллын түвшин, оролцох
/// дараалал. Тоонууд бүгд Firestore-оос (админ удирдана).
class ShuteenDetailScreen extends StatefulWidget {
  const ShuteenDetailScreen({super.key});

  @override
  State<ShuteenDetailScreen> createState() => _ShuteenDetailScreenState();
}

class _ShuteenDetailScreenState extends State<ShuteenDetailScreen> {
  final ShuteenRepository _repo = ShuteenRepository();
  late final Stream<ShuteenProgramInfo> _stream = _repo.watchProgram();
  final String? _uid = FirebaseAuth.instance.currentUser?.uid;
  late final Stream<ShuteenHolding> _holding = _uid == null
      ? Stream.value(ShuteenHolding.empty)
      : _repo.watchMyHolding(_uid!);

  void _buy(ShuteenProgramInfo p) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => ShuteenBuyScreen(program: p)),
    );
  }

  void _openCertificates() {
    final uid = _uid;
    if (uid == null) return;
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => ShuteenMyOrdersScreen(uid: uid)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<ShuteenProgramInfo>(
      stream: _stream,
      builder: (context, snapshot) {
        final p = snapshot.data;
        return Scaffold(
          backgroundColor: CustomColors.appBackground,
          appBar: appBar(
            p?.title ?? tr('shuteen.card_badge'),
            actions: [
              IconButton(
                tooltip: tr('shuteen.verify_title'),
                icon: const Icon(Icons.qr_code_scanner_rounded,
                    color: Colors.white, size: 22),
                onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute(
                      builder: (_) => const ShuteenVerifyScreen()),
                ),
              ),
              const SizedBox(width: 4),
            ],
          ),
          body: p == null
              ? Center(
                  child: CircularProgressIndicator(
                      color: CustomColors.accent, strokeWidth: 2))
              : ListView(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
                  children: [
                    _Gallery(images: p.heroImages),
                    StreamBuilder<ShuteenHolding>(
                      stream: _holding,
                      builder: (context, hs) {
                        final h = hs.data;
                        if (h == null || !h.hasUnits) {
                          return const SizedBox.shrink();
                        }
                        return Padding(
                          padding: const EdgeInsets.only(top: 12),
                          child: _MyOwnership(
                            holding: h,
                            program: p,
                            onCertificates: _openCertificates,
                            onBuyMore: () => _buy(p),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 16),
                    Text(tr('shuteen.company'),
                        style: AppText.label.copyWith(
                            color: CustomColors.accent, letterSpacing: 1.2)),
                    const SizedBox(height: 6),
                    Text(p.title,
                        style: AppText.display.copyWith(fontSize: 30)),
                    if (p.subtitle.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Text(p.subtitle,
                          style: AppText.body.copyWith(
                              color: CustomColors.textSecondary, height: 1.4)),
                    ],
                    if (p.description.isNotEmpty) ...[
                      const SizedBox(height: 14),
                      AppCard(
                        child: Text(p.description,
                            style: AppText.body.copyWith(height: 1.55)),
                      ),
                    ],
                    const SizedBox(height: 16),
                    _StatsGrid(program: p),
                    _Section(tr('shuteen.section_principles')),
                    _Principles(program: p),
                    _Section(tr('shuteen.section_finance')),
                    _Finance(program: p),
                    _Section(tr('shuteen.section_examples')),
                    _Examples(program: p),
                    _Section(tr('shuteen.section_tiers')),
                    _Tiers(),
                    _Section(tr('shuteen.section_steps')),
                    _Steps(program: p),
                  ],
                ),
          bottomNavigationBar: p == null || !p.isActive
              ? null
              : SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                    child: AppPrimaryButton(
                      label: tr('shuteen.cta_buy'),
                      icon: Icons.diamond_outlined,
                      onPressed: () => _buy(p),
                    ),
                  ),
                ),
        );
      },
    );
  }
}

// ---------------------------------------------------------------------------
/// Эзэмшигчийн карт: нэгж, худалдан авсан дүн, өнөөдрийн үнэлгээ, буцаалтын
/// дүн, түвшин; гэрчилгээнүүд рүү болон нэмж авах товч.
class _MyOwnership extends StatelessWidget {
  const _MyOwnership({
    required this.holding,
    required this.program,
    required this.onCertificates,
    required this.onBuyMore,
  });
  final ShuteenHolding holding;
  final ShuteenProgramInfo program;
  final VoidCallback onCertificates;
  final VoidCallback onBuyMore;

  @override
  Widget build(BuildContext context) {
    final h = holding;
    final int buyback = program.buybackPrice * h.units;
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: CustomColors.accent.withOpacity(0.45)),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            CustomColors.accent.withOpacity(0.16),
            CustomColors.surface,
          ],
        ),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              AppIconTile(
                size: 36,
                color: CustomColors.accentSoft,
                child: Icon(Icons.workspace_premium_rounded,
                    color: CustomColors.accent, size: 20),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(tr('shuteen.my_ownership'),
                    style: AppText.sectionTitle),
              ),
              if (h.tier > 0)
                AppStatusChip(
                  icon: Icons.star_rounded,
                  label: tr('shuteen.tier_n', {'n': _roman(h.tier)}),
                ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(_int(h.units),
                  style: AppText.display.copyWith(fontSize: 34)),
              const SizedBox(width: 6),
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Text(tr('shuteen.stat_units_unit'),
                    style: AppText.displayUnit
                        .copyWith(color: CustomColors.textSecondary)),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              _MiniStat(
                  label: tr('shuteen.my_invested'),
                  value: formatMNT(h.amount)),
              _MiniStat(
                  label: tr('shuteen.my_buyback'),
                  value: formatMNT(buyback),
                  accent: true),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: _SmallButton(
                  label: tr('shuteen.certificates_n', {'n': h.orderCount}),
                  icon: Icons.qr_code_2_rounded,
                  onTap: onCertificates,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _SmallButton(
                  label: tr('shuteen.buy_more'),
                  icon: Icons.add_rounded,
                  primary: true,
                  onTap: onBuyMore,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  const _MiniStat(
      {required this.label, required this.value, this.accent = false});
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
              style: AppText.caption.copyWith(fontSize: 11)),
          const SizedBox(height: 2),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(value,
                style: AppText.bodyBold.copyWith(
                    fontSize: 15,
                    color: accent ? CustomColors.accent : Colors.white)),
          ),
        ],
      ),
    );
  }
}

class _SmallButton extends StatelessWidget {
  const _SmallButton({
    required this.label,
    required this.icon,
    required this.onTap,
    this.primary = false,
  });
  final String label;
  final IconData icon;
  final VoidCallback onTap;
  final bool primary;

  @override
  Widget build(BuildContext context) {
    final Color fg = primary ? Colors.black : Colors.white;
    return Material(
      color: primary ? CustomColors.accent : CustomColors.surfaceAlt,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: SizedBox(
          height: 42,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 17, color: fg),
              const SizedBox(width: 6),
              Flexible(
                child: Text(label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.button.copyWith(fontSize: 13, color: fg)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
class _Section extends StatelessWidget {
  const _Section(this.title);
  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 24, bottom: 12),
      child: Text(title, style: AppText.sectionTitle),
    );
  }
}

/// Дээд хэсгийн зургийн цомог — гүйлгэж харна, доор нь цэгэн заагч
class _Gallery extends StatefulWidget {
  const _Gallery({required this.images});
  final List<String> images;

  @override
  State<_Gallery> createState() => _GalleryState();
}

class _GalleryState extends State<_Gallery> {
  final PageController _controller = PageController();
  int _index = 0;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final images = widget.images;
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: AspectRatio(
        aspectRatio: 4 / 3,
        child: Container(
          color: CustomColors.surfaceAlt,
          child: images.isEmpty
              ? Center(
                  child: Icon(Icons.diamond_outlined,
                      size: 56, color: CustomColors.accent.withOpacity(0.45)),
                )
              : Stack(
                  fit: StackFit.expand,
                  children: [
                    PageView.builder(
                      controller: _controller,
                      itemCount: images.length,
                      onPageChanged: (i) => setState(() => _index = i),
                      itemBuilder: (_, i) => Image.network(
                        images[i],
                        fit: BoxFit.cover,
                        loadingBuilder: (_, child, progress) =>
                            progress == null
                                ? child
                                : Center(
                                    child: CircularProgressIndicator(
                                        color: CustomColors.accent,
                                        strokeWidth: 2),
                                  ),
                        errorBuilder: (_, __, ___) => const Center(
                          child: Icon(Icons.broken_image_outlined,
                              color: Colors.white24, size: 40),
                        ),
                      ),
                    ),
                    if (images.length > 1)
                      Positioned(
                        left: 0,
                        right: 0,
                        bottom: 12,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: List.generate(images.length, (i) {
                            final active = i == _index;
                            return AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              margin: const EdgeInsets.symmetric(horizontal: 3),
                              width: active ? 18 : 6,
                              height: 6,
                              decoration: BoxDecoration(
                                color: active
                                    ? CustomColors.accent
                                    : Colors.white.withOpacity(0.45),
                                borderRadius: BorderRadius.circular(3),
                              ),
                            );
                          }),
                        ),
                      ),
                  ],
                ),
        ),
      ),
    );
  }
}

/// 6 гол тоо — 2 баганаар
class _StatsGrid extends StatelessWidget {
  const _StatsGrid({required this.program});
  final ShuteenProgramInfo program;

  @override
  Widget build(BuildContext context) {
    final p = program;
    final items = <_StatItem>[
      _StatItem(
        label: tr('shuteen.stat_valuation'),
        value: _billion(p.totalValuation),
        sub: formatMNT(p.totalValuation),
      ),
      _StatItem(
        label: tr('shuteen.stat_units'),
        value: _int(p.totalUnits),
        sub: tr('shuteen.stat_units_unit'),
      ),
      _StatItem(
        label: tr('shuteen.card_unit_price'),
        value: formatMNT(p.unitPrice),
        sub: tr('shuteen.stat_unit_price_sub'),
      ),
      _StatItem(
        label: tr('shuteen.stat_hold'),
        value: tr('shuteen.stat_hold_value', {'months': p.holdMonths}),
        sub: tr('shuteen.stat_hold_sub'),
      ),
      _StatItem(
        label: tr('shuteen.card_growth'),
        value: '${_num(p.annualGrowthPercent)}%',
        sub: tr('shuteen.stat_growth_sub'),
        accent: true,
      ),
      _StatItem(
        label: tr('shuteen.stat_buyback'),
        value: formatMNT(p.buybackPrice),
        sub: tr('shuteen.stat_buyback_sub', {'months': p.holdMonths}),
        accent: true,
      ),
    ];
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: items.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 10,
        crossAxisSpacing: 10,
        childAspectRatio: 1.55,
      ),
      itemBuilder: (_, i) => items[i],
    );
  }
}

class _StatItem extends StatelessWidget {
  const _StatItem({
    required this.label,
    required this.value,
    required this.sub,
    this.accent = false,
  });
  final String label;
  final String value;
  final String sub;
  final bool accent;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(14),
      radius: 16,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppText.caption.copyWith(fontSize: 11)),
          const SizedBox(height: 4),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(
              value,
              style: AppText.bodyBold.copyWith(
                fontSize: 20,
                color: accent ? CustomColors.accent : Colors.white,
              ),
            ),
          ),
          const SizedBox(height: 2),
          Text(sub,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppText.caption.copyWith(
                  fontSize: 10.5, color: CustomColors.textTertiary)),
        ],
      ),
    );
  }
}

/// 7 зарчим — дугаар алтан, гарчиг, тайлбар
class _Principles extends StatelessWidget {
  const _Principles({required this.program});
  final ShuteenProgramInfo program;

  @override
  Widget build(BuildContext context) {
    final p = program;
    final params = {
      'valuation': _int(p.totalValuation),
      'units': _int(p.totalUnits),
      'price': _int(p.unitPrice),
      'months': p.holdMonths,
      'growth': _num(p.annualGrowthPercent),
      'buyback': _int(p.buybackPrice),
    };
    return AppCard(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Column(
        children: [
          for (int i = 1; i <= 7; i++) ...[
            if (i > 1) const AppDivider(vertical: 2),
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    i.toString().padLeft(2, '0'),
                    style: AppText.display.copyWith(
                        fontSize: 22, color: CustomColors.accent, height: 1.0),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(tr('shuteen.p${i}_title'),
                            style: AppText.bodyBold.copyWith(fontSize: 14)),
                        const SizedBox(height: 4),
                        Text(tr('shuteen.p${i}_body', params),
                            style: AppText.caption.copyWith(
                                fontSize: 12.5, height: 1.5)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// Үнийн өсөлт: авах үед → 12 сар → 24 сар
class _Finance extends StatelessWidget {
  const _Finance({required this.program});
  final ShuteenProgramInfo program;

  @override
  Widget build(BuildContext context) {
    final p = program;
    final int half = p.holdMonths ~/ 2;
    final steps = <MapEntry<String, int>>[
      MapEntry(tr('shuteen.at_purchase'), p.unitPrice),
      if (half > 0 && half < p.holdMonths)
        MapEntry(tr('shuteen.after_months', {'months': half}),
            p.priceAfter(half)),
      MapEntry(tr('shuteen.after_months', {'months': p.holdMonths}),
          p.buybackPrice),
    ];
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            tr('shuteen.finance_note', {'growth': _num(p.annualGrowthPercent)}),
            style: AppText.caption.copyWith(height: 1.45),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              for (int i = 0; i < steps.length; i++) ...[
                if (i > 0)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: Icon(Icons.arrow_forward_rounded,
                        size: 16, color: CustomColors.textTertiary),
                  ),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        vertical: 12, horizontal: 8),
                    decoration: BoxDecoration(
                      color: i == steps.length - 1
                          ? CustomColors.accent
                          : CustomColors.surfaceAlt,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      children: [
                        Text(
                          steps[i].key,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          textAlign: TextAlign.center,
                          style: AppText.caption.copyWith(
                            fontSize: 10,
                            color: i == steps.length - 1
                                ? Colors.black.withOpacity(0.7)
                                : CustomColors.textSecondary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Text(
                            formatMNT(steps[i].value),
                            style: AppText.bodyBold.copyWith(
                              fontSize: 15,
                              color: i == steps.length - 1
                                  ? Colors.black
                                  : Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

/// Худалдан авалтын жишээ хүснэгт: 1 / 100 / 500 / 1000 нэгж
class _Examples extends StatelessWidget {
  const _Examples({required this.program});
  final ShuteenProgramInfo program;

  @override
  Widget build(BuildContext context) {
    final p = program;
    const counts = [1, 100, 500, 1000];
    Widget cell(String text, {int flex = 1, bool head = false, bool accent = false, TextAlign align = TextAlign.right}) {
      return Expanded(
        flex: flex,
        child: Text(
          text,
          textAlign: align,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: head
              ? AppText.caption.copyWith(fontSize: 10.5)
              : AppText.bodyBold.copyWith(
                  fontSize: 12.5,
                  color: accent ? CustomColors.accent : Colors.white),
        ),
      );
    }

    return AppCard(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      child: Column(
        children: [
          Row(children: [
            cell(tr('shuteen.col_units'), head: true, align: TextAlign.left),
            cell(tr('shuteen.col_pay'), flex: 2, head: true),
            cell(tr('shuteen.col_after', {'months': p.holdMonths}),
                flex: 2, head: true),
            cell(tr('shuteen.col_tier'), head: true),
          ]),
          const AppDivider(vertical: 6),
          for (int i = 0; i < counts.length; i++) ...[
            if (i > 0) const AppDivider(vertical: 0),
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Row(children: [
                cell(_int(counts[i]), align: TextAlign.left),
                cell(formatMNT(p.unitPrice * counts[i]), flex: 2),
                cell(formatMNT(p.buybackPrice * counts[i]),
                    flex: 2, accent: true),
                cell(
                  ShuteenProgramInfo.tierFor(counts[i]) == 0
                      ? '—'
                      : _roman(ShuteenProgramInfo.tierFor(counts[i])),
                ),
              ]),
            ),
          ],
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerLeft,
            child: Text(tr('shuteen.tax_note'),
                style: AppText.caption.copyWith(
                    fontSize: 10.5, color: CustomColors.textTertiary)),
          ),
        ],
      ),
    );
  }
}

/// Урамшууллын 3 түвшин
class _Tiers extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final tiers = [
      (tr('shuteen.tier_range', {'from': 100, 'to': 499}),
          tr('shuteen.tier1_benefit')),
      (tr('shuteen.tier_range', {'from': 500, 'to': 999}),
          tr('shuteen.tier2_benefit')),
      (tr('shuteen.tier_range_plus', {'from': _int(1000)}),
          tr('shuteen.tier3_benefit')),
    ];
    return Column(
      children: [
        for (int i = 0; i < tiers.length; i++)
          Padding(
            padding: EdgeInsets.only(bottom: i < tiers.length - 1 ? 10 : 0),
            child: AppCard(
              padding: const EdgeInsets.all(14),
              radius: 16,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  AppIconTile(
                    size: 44,
                    color: CustomColors.accentSoft,
                    child: Text(_roman(i + 1),
                        style: AppText.bodyBold
                            .copyWith(color: CustomColors.accent)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(tr('shuteen.tier_n', {'n': _roman(i + 1)}),
                                style: AppText.bodyBold),
                            const SizedBox(width: 8),
                            AppStatusChip(label: tiers[i].$1),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(tiers[i].$2,
                            style: AppText.caption
                                .copyWith(fontSize: 12.5, height: 1.45)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

/// Оролцох 5 алхам — босоо timeline
class _Steps extends StatelessWidget {
  const _Steps({required this.program});
  final ShuteenProgramInfo program;

  @override
  Widget build(BuildContext context) {
    final p = program;
    final params = {'months': p.holdMonths, 'buyback': _int(p.buybackPrice)};
    return AppCard(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 6),
      child: Column(
        children: [
          for (int i = 1; i <= 5; i++)
            IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Column(
                    children: [
                      Container(
                        width: 28,
                        height: 28,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: i == 5
                              ? CustomColors.accent
                              : CustomColors.accentSoft,
                          shape: BoxShape.circle,
                        ),
                        child: Text(
                          '$i',
                          style: AppText.bodyBold.copyWith(
                              fontSize: 12,
                              color: i == 5
                                  ? Colors.black
                                  : CustomColors.accent),
                        ),
                      ),
                      if (i < 5)
                        Expanded(
                          child: Container(
                              width: 2,
                              margin: const EdgeInsets.symmetric(vertical: 4),
                              color: CustomColors.surfaceBorder),
                        ),
                    ],
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Padding(
                      padding: EdgeInsets.only(bottom: i < 5 ? 16 : 8, top: 4),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(tr('shuteen.s${i}_title'),
                              style: AppText.bodyBold),
                          const SizedBox(height: 3),
                          Text(tr('shuteen.s${i}_body', params),
                              style: AppText.caption.copyWith(height: 1.4)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
String _int(num n) => formatMNT(n).replaceAll('₮', '');

String _num(num n) => n == n.roundToDouble() ? '${n.toInt()}' : '$n';

String _billion(num n) {
  final double b = n / 1000000000;
  final String s = b == b.roundToDouble()
      ? '${b.toInt()}'
      : b.toStringAsFixed(1);
  return tr('shuteen.billion', {'n': s});
}

String _roman(int n) => const ['', 'I', 'II', 'III'][n.clamp(0, 3)];
