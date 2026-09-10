import 'dart:ui' show ImageFilter;

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:rainbow_edge_lighting/rainbow_edge_lighting.dart';
import 'package:url_launcher/url_launcher.dart';

import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/center_models.dart';
import 'package:onegrgold/models/shuteen_model.dart';
import 'package:onegrgold/repositories/center_repository.dart';
import 'package:onegrgold/repositories/shuteen_repository.dart';
import 'package:onegrgold/repositories/user_repository.dart';
import 'package:onegrgold/screens/app_new_screen/center_screen/center_detail_screen.dart';
import 'package:onegrgold/screens/app_new_screen/profile_screen/profile_screen.dart';
import 'package:onegrgold/screens/app_new_screen/shuteen_screen/shuteen_verify_screen.dart';
import 'package:onegrgold/screens/auth_screen/register_screen/privacy_screen.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

/// Алтан гялалзсан ирмэг — нүүрний аяны карттай ижил
const List<Color> _kEdgeColors = [
  Color(0xFFF6B800),
  Color(0xFFFFE08A),
  Color(0xFFF6B800),
  Color(0x33F6B800),
  Color(0xFFF6B800),
];

/// Доод nav-ийн "Бусад" таб.
///
/// Эхний хэсэг нь "Дэлхийн морин хуурын төв цогцолбор": нэг картанд аяны
/// hero зураг + Мод тарих / Бүтээгдэхүүн / Төслийн тухай / Дэмжигчид цэс,
/// тус бүр бие даасан дэлгэц нээнэ. Доор нь хэрэглэгч, тусламж, холбоо
/// барих хэсгүүд (нүүрний burger цэсэнд байсан агуулга).
class MoreScreen extends StatefulWidget {
  const MoreScreen({super.key, required this.userRepository});

  final UserRepository userRepository;

  @override
  State<MoreScreen> createState() => _MoreScreenState();
}

class _MoreScreenState extends State<MoreScreen>
    with AutomaticKeepAliveClientMixin {
  final CenterRepository _repo = CenterRepository();
  late final Stream<ShuteenProgramInfo> _shuteen =
      ShuteenRepository().watchProgram();

  @override
  bool get wantKeepAlive => true;

  void _push(Widget screen) {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen));
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return Scaffold(
      backgroundColor: CustomColors.appBackground,
      body: SafeArea(
        bottom: false,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
          children: [
            Padding(
              padding: const EdgeInsets.only(top: 8, bottom: 8),
              child: Text(tr('nav.more'), style: AppText.appBarTitle),
            ),

            // ---- Дэлхийн морин хуурын төв цогцолбор ----
            _SectionLabel(tr('center.complex_title')),
            StreamBuilder<CenterCampaignInfo>(
              stream: _repo.watchCampaign(),
              builder: (context, snapshot) {
                return _CampaignSection(
                  campaign: snapshot.data,
                  onTrees: () => _push(CenterTreesScreen(repo: _repo)),
                  onProducts: () => _push(CenterProductsScreen(repo: _repo)),
                  onAbout: () => _push(CenterAboutScreen(repo: _repo)),
                  onSupporters: () =>
                      _push(CenterSupportersScreen(repo: _repo)),
                );
              },
            ),

            // ---- Хэрэглэгч ----
            _SectionLabel(tr('more.account')),
            AppCard(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              child: Column(
                children: [
                  _MenuRow(
                    asset: 'assets/icons/user.svg',
                    title: tr('nav.profile'),
                    subtitle: tr('more.profile_sub'),
                    onTap: () => _push(
                        ProfileScreen(userRepository: widget.userRepository)),
                  ),
                  // Гэрчилгээ шалгах — зөвхөн Шүтээн хуур идэвхтэй үед
                  StreamBuilder<ShuteenProgramInfo>(
                    stream: _shuteen,
                    builder: (context, snap) {
                      if (snap.data?.isActive != true) {
                        return const SizedBox.shrink();
                      }
                      return Column(
                        children: [
                          const AppDivider(vertical: 2),
                          _MenuRow(
                            icon: Icons.qr_code_scanner_rounded,
                            title: tr('shuteen.verify_title'),
                            subtitle: tr('shuteen.verify_menu_sub'),
                            onTap: () => _push(const ShuteenVerifyScreen()),
                          ),
                        ],
                      );
                    },
                  ),
                ],
              ),
            ),

            // ---- Тусламж (нүүрний burger цэсний агуулга) ----
            _SectionLabel(tr('reg.help_title')),
            AppCard(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              child: Column(
                children: [
                  _MenuRow(
                    icon: Icons.menu_book_rounded,
                    title: tr('reg.help_project_intro'),
                    onTap: () => launchUrl(Uri.parse(
                        'https://oggspace.sgp1.digitaloceanspaces.com/one-intro.pdf')),
                  ),
                  const AppDivider(vertical: 2),
                  _MenuRow(
                    icon: Icons.fact_check_outlined,
                    title: tr('more.terms'),
                    onTap: () => _push(const PrivacyScreen()),
                  ),
                  const AppDivider(vertical: 2),
                  _MenuRow(
                    icon: Icons.shield_outlined,
                    title: tr('reg.help_privacy_policy'),
                    onTap: () => _push(const PrivacyScreen()),
                  ),
                ],
              ),
            ),

            // ---- Холбоо барих ----
            _SectionLabel(tr('reg.help_contact')),
            AppCard(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              child: Column(
                children: [
                  _MenuRow(
                    icon: Icons.call_rounded,
                    title: tr('reg.help_call'),
                    subtitle: '7588-8888',
                    onTap: () => launchUrl(Uri(scheme: 'tel', path: '75888888')),
                  ),
                  const AppDivider(vertical: 2),
                  _MenuRow(
                    icon: Icons.mail_outline_rounded,
                    title: tr('reg.help_email'),
                    subtitle: 'info@999.mn',
                    onTap: () =>
                        launchUrl(Uri(scheme: 'mailto', path: 'info@999.mn')),
                  ),
                  const AppDivider(vertical: 2),
                  _MenuRow(
                    asset: 'assets/icons/facebook.svg',
                    tintAsset: false,
                    title: 'Facebook',
                    subtitle: tr('reg.help_social'),
                    onTap: () => launchUrl(
                        Uri.parse('https://www.facebook.com/onegramgold1')),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 20, bottom: 10, left: 4),
      child: Text(text, style: AppText.caption),
    );
  }
}

/// Цогцолборын карт: cover зураг бүхэлдээ картын дэвсгэр, дээр нь харанхуй
/// давхарга, түүн дээр 4 цэс картыг дүүргэн байрлана. Алтан гялалзсан ирмэгтэй.
class _CampaignSection extends StatelessWidget {
  const _CampaignSection({
    required this.campaign,
    required this.onTrees,
    required this.onProducts,
    required this.onAbout,
    required this.onSupporters,
  });

  final CenterCampaignInfo? campaign;
  final VoidCallback onTrees;
  final VoidCallback onProducts;
  final VoidCallback onAbout;
  final VoidCallback onSupporters;

  @override
  Widget build(BuildContext context) {
    final String? cover = campaign?.coverImage ?? campaign?.headerImage;
    final Color surface = CustomColors.surface;

    return RainbowEdgeLighting(
      radius: 20,
      thickness: 0.5,
      speed: 0.5,
      colors: _kEdgeColors,
      child: Container(
        decoration: BoxDecoration(
          color: surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(width: 1.0, color: CustomColors.surfaceBorder),
          boxShadow: [
            BoxShadow(
              color: CustomColors.accent.withOpacity(0.10),
              blurRadius: 24,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          children: [
            // Дэвсгэр зураг — бүдгэрүүлж (blur) цэсний ард уусгана
            Positioned.fill(
              child: ImageFiltered(
                imageFilter: ImageFilter.blur(sigmaX: 7, sigmaY: 7),
                child: cover != null && cover.isNotEmpty
                    ? Image.network(
                        cover,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => const _CoverFallback(),
                      )
                    : const _CoverFallback(),
              ),
            ),
            // Алтан өнгийн давхарга — дээд зүүн буланд алтан гэрэл,
            // доошоо surface өнгө рүү; текст уншигдахуйц харанхуй хэвээр
            Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Color.lerp(surface, CustomColors.accent, 0.38)!
                          .withOpacity(0.72),
                      Color.lerp(surface, CustomColors.accent, 0.14)!
                          .withOpacity(0.84),
                      surface.withOpacity(0.92),
                    ],
                    stops: const [0.0, 0.55, 1.0],
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _MenuRow(
                    icon: Icons.park_rounded,
                    title: tr('center.plant_tree'),
                    subtitle: tr('more.plant_tree_sub'),
                    onTap: onTrees,
                  ),
                  const AppDivider(vertical: 2),
                  _MenuRow(
                    icon: Icons.storefront_rounded,
                    title: tr('center.products'),
                    subtitle: tr('more.products_sub'),
                    onTap: onProducts,
                  ),
                  const AppDivider(vertical: 2),
                  _MenuRow(
                    icon: Icons.auto_stories_rounded,
                    title: tr('center.about_project'),
                    subtitle: tr('more.about_sub'),
                    onTap: onAbout,
                  ),
                  const AppDivider(vertical: 2),
                  _MenuRow(
                    icon: Icons.emoji_events_rounded,
                    title: tr('more.supporters'),
                    subtitle: tr('more.supporters_sub'),
                    onTap: onSupporters,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CoverFallback extends StatelessWidget {
  const _CoverFallback();

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
        child: Icon(Icons.account_balance_rounded,
            size: 48, color: CustomColors.accent.withOpacity(0.45)),
      ),
    );
  }
}

/// Цэсний мөр — зүүн icon tile (Material icon эсвэл SVG), гарчиг, тайлбар, chevron
class _MenuRow extends StatelessWidget {
  const _MenuRow({
    this.icon,
    this.asset,
    this.tintAsset = true,
    required this.title,
    this.subtitle,
    required this.onTap,
  }) : assert(icon != null || asset != null);

  final IconData? icon;
  final String? asset;
  final bool tintAsset;
  final String title;
  final String? subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AppListRow(
      title: title,
      subtitle: subtitle,
      onTap: onTap,
      leading: AppIconTile(
        size: 40,
        child: icon != null
            ? Icon(icon, size: 20, color: CustomColors.accent)
            : SizedBox(
                width: 20,
                height: 20,
                child: SvgPicture.asset(
                  asset!,
                  colorFilter: tintAsset
                      ? ColorFilter.mode(CustomColors.accent, BlendMode.srcIn)
                      : null,
                ),
              ),
      ),
    );
  }
}
