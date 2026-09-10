import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/center_models.dart';
import 'package:onegrgold/repositories/center_repository.dart';
import 'package:onegrgold/screens/app_new_screen/center_screen/center_cart.dart';
import 'package:onegrgold/screens/app_new_screen/center_screen/center_cart_screen.dart';
import 'package:onegrgold/screens/app_new_screen/center_screen/center_my_orders_screen.dart';
import 'package:onegrgold/screens/app_new_screen/center_screen/center_my_tree_orders_screen.dart';
import 'package:onegrgold/screens/app_new_screen/center_screen/center_promo_popup.dart';
import 'package:onegrgold/screens/app_new_screen/center_screen/tree_order_screen.dart'
    show TreeOrderScreen;
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

class CenterDetailScreen extends StatefulWidget {
  const CenterDetailScreen({super.key});

  @override
  State<CenterDetailScreen> createState() => _CenterDetailScreenState();
}

class _CenterDetailScreenState extends State<CenterDetailScreen> {
  final CenterRepository repo = CenterRepository();
  CenterUserHeaderStat? _stat;
  bool _popupShown = false;

  @override
  void initState() {
    super.initState();
    _loadStat();
  }

  Future<void> _loadStat() async {
    try {
      final s = await repo.fetchMyHeaderStat();
      if (mounted) setState(() => _stat = s);
    } catch (_) {}
  }

  /// Show the campaign promo modal once, the first time the campaign loads.
  void _maybeShowPopup(CenterCampaignInfo campaign) {
    if (_popupShown || !campaign.popup.hasContent) return;
    _popupShown = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) showCenterPromoPopup(context, campaign.popup);
    });
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        backgroundColor: CustomColors.appBackground,
        appBar: appBar(
          tr('center.complex_title'),
          actions: [
            IconButton(
              tooltip: tr('center.my_planted_trees'),
              icon: const Icon(Icons.forest_rounded,
                  color: Colors.white, size: 22),
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => CenterMyTreeOrdersScreen(repo: repo),
                  ),
                );
              },
            ),
            IconButton(
              tooltip: tr('center.my_orders'),
              icon: SvgPicture.asset(
                'assets/icons/document-list-check.svg',
                width: 22,
                height: 22,
                colorFilter:
                    const ColorFilter.mode(Colors.white, BlendMode.srcIn),
              ),
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => CenterMyOrdersScreen(repo: repo),
                  ),
                );
              },
            ),
            _CartAction(repo: repo),
            const SizedBox(width: 4),
          ],
        ),
        body: StreamBuilder<CenterCampaignInfo>(
          stream: repo.watchCampaign(),
          builder: (context, snapshot) {
            final campaign = snapshot.data;
            if (campaign == null) {
              return const _Loading();
            }
            _maybeShowPopup(campaign);
            return NestedScrollView(
              headerSliverBuilder: (context, _) => [
                SliverToBoxAdapter(
                  child: _Header(campaign: campaign, stat: _stat),
                ),
                SliverPersistentHeader(
                  pinned: true,
                  delegate: _PillsDelegate(
                    _TabPills(
                      labels: [
                        tr('center.plant_tree'),
                        tr('center.products'),
                        tr('center.about_project'),
                        tr('center.top_n', {'count': campaign.topCount}),
                      ],
                    ),
                  ),
                ),
              ],
              body: TabBarView(
                // Tabs switch only by tapping the pills — swiping the
                // storefront grids should never change tab.
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  _TreesTab(repo: repo),
                  _ProductsTab(repo: repo),
                  _AboutTab(campaign: campaign),
                  _DonorsTab(repo: repo, topCount: campaign.topCount),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
class _Loading extends StatelessWidget {
  const _Loading();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: CircularProgressIndicator(
          color: CustomColors.accent, strokeWidth: 2),
    );
  }
}

// ---------------------------------------------------------------------------
/// Pinned selection-pill row driving the [DefaultTabController]. Replaces the
/// underlined TabBar with the design system's segmented pills.
class _TabPills extends StatelessWidget {
  static const double height = 52;

  final List<String> labels;
  const _TabPills({required this.labels});

  @override
  Widget build(BuildContext context) {
    final controller = DefaultTabController.of(context);
    final Listenable anim = controller.animation ?? controller;
    return Container(
      color: CustomColors.appBackground,
      height: height,
      padding: const EdgeInsets.fromLTRB(16, 6, 16, 10),
      child: AnimatedBuilder(
        animation: anim,
        builder: (context, _) {
          final int selected =
              (controller.animation?.value ?? controller.index.toDouble())
                  .round();
          return ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: labels.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (context, i) {
              final bool sel = i == selected;
              return GestureDetector(
                onTap: () => controller.animateTo(i),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: sel ? CustomColors.accent : CustomColors.surfaceAlt,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    labels[i],
                    style: TextStyle(
                      fontFamily: sel ? AppText.bold : AppText.medium,
                      fontSize: 12.5,
                      fontWeight: sel ? FontWeight.bold : FontWeight.w500,
                      color: sel ? Colors.black : Colors.white,
                    ),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class _PillsDelegate extends SliverPersistentHeaderDelegate {
  final _TabPills pills;
  _PillsDelegate(this.pills);

  @override
  double get minExtent => _TabPills.height;
  @override
  double get maxExtent => _TabPills.height;

  @override
  Widget build(
      BuildContext context, double shrinkOffset, bool overlapsContent) {
    return pills;
  }

  @override
  bool shouldRebuild(covariant _PillsDelegate oldDelegate) =>
      pills.labels != oldDelegate.pills.labels;
}

// ---------------------------------------------------------------------------
class _Header extends StatelessWidget {
  final CenterCampaignInfo campaign;
  final CenterUserHeaderStat? stat;
  const _Header({required this.campaign, this.stat});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 21:9 hero banner with the user's donation stat overlaid.
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: AspectRatio(
              aspectRatio: 21 / 9,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  _banner(),
                  Positioned.fill(
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.black.withOpacity(0.15),
                            Colors.black.withOpacity(0.25),
                            Colors.black.withOpacity(0.82),
                          ],
                          stops: const [0.0, 0.45, 1.0],
                        ),
                      ),
                    ),
                  ),
                  if (stat != null) _statOverlay(stat!),
                ],
              ),
            ),
          ),
        ),
        // Below-banner strip swaps with the active tab: the "Мод тарих" tab
        // gets a planting banner, every other tab shows the fundraising
        // note. Scrolls away with the header.
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: _TabAwareBody(
            treeInfo: _treeInfo(),
            progress: _campaignProgress(),
          ),
        ),
      ],
    );
  }

  /// Fundraising note — shown on every tab except "Мод тарих".
  /// Campaign totals, progress bar and supporter counts are intentionally not
  /// shown — only the supporting message remains.
  Widget _campaignProgress() {
    return AppBanner(
      icon: Icons.favorite_rounded,
      text: tr('center.purchase_supports_note'),
    );
  }

  /// Planting note — shown on the "Мод тарих" tab. Tree/participant
  /// counts are intentionally not shown; only the legacy message remains.
  Widget _treeInfo() {
    return AppBanner(
      icon: Icons.eco_rounded,
      color: CustomColors.positive,
      text: tr('center.plant_legacy_note'),
    );
  }

  Widget _statOverlay(CenterUserHeaderStat s) {
    const shadows = [Shadow(blurRadius: 6, color: Colors.black87)];
    return Positioned(
      left: 14,
      right: 14,
      bottom: 12,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  s.name.isNotEmpty ? s.name : tr('center.user_fallback_name'),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.sectionTitle.copyWith(shadows: shadows),
                ),
                const SizedBox(height: 2),
                Text(
                  s.hasDonated
                      ? tr('center.your_support_amount',
                          {'amount': formatMNT(s.donatedAmount)})
                      : tr('center.no_support_yet'),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.bodyBold.copyWith(
                    fontSize: 12.5,
                    color: s.hasDonated
                        ? CustomColors.accent
                        : CustomColors.textSecondary,
                    shadows: shadows,
                  ),
                ),
                const SizedBox(height: 3),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.park_rounded,
                      size: 13,
                      color: CustomColors.positive,
                      shadows: shadows,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      tr('center.your_trees_count', {'count': s.treeCount}),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.bodyBold.copyWith(
                        fontSize: 12,
                        color: CustomColors.positive,
                        shadows: shadows,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          if (s.rank != null) ...[
            const SizedBox(width: 10),
            _rankBadge(s.rank!),
          ],
        ],
      ),
    );
  }

  Widget _rankBadge(int rank) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.45),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: CustomColors.accent.withOpacity(0.6)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.emoji_events_rounded, size: 15, color: CustomColors.accent),
          const SizedBox(width: 5),
          Text(
            '#$rank',
            style: AppText.sectionTitle.copyWith(color: CustomColors.accent),
          ),
        ],
      ),
    );
  }

  Widget _banner() {
    final img = campaign.headerImage ?? campaign.coverImage;
    if (img != null && img.isNotEmpty) {
      return Image.network(
        img,
        fit: BoxFit.cover,
        loadingBuilder: (context, child, progress) =>
            progress == null ? child : _fallback(),
        errorBuilder: (_, __, ___) => _fallback(),
      );
    }
    return _fallback();
  }

  Widget _fallback() {
    return Container(
      color: CustomColors.surfaceAlt,
      child: const Center(
        child: Icon(Icons.account_balance_rounded,
            size: 48, color: Colors.white24),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
/// Swaps the header's below-banner content based on the active tab: the tree
/// tab (index 0) shows [treeInfo], every other tab shows [progress]. Follows
/// the swipe so the panel flips at the halfway point of the gesture.
class _TabAwareBody extends StatelessWidget {
  final Widget treeInfo;
  final Widget progress;
  const _TabAwareBody({required this.treeInfo, required this.progress});

  @override
  Widget build(BuildContext context) {
    final controller = DefaultTabController.of(context);
    final Listenable anim = controller.animation ?? controller;
    return AnimatedBuilder(
      animation: anim,
      builder: (context, _) {
        final value =
            controller.animation?.value ?? controller.index.toDouble();
        return value < 0.5 ? treeInfo : progress;
      },
    );
  }
}

// ---------------------------------------------------------------------------
class _CartAction extends StatelessWidget {
  final CenterRepository repo;
  const _CartAction({required this.repo});

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: CenterCart.instance,
      builder: (context, _) {
        final count = CenterCart.instance.count;
        return IconButton(
          tooltip: tr('center.cart'),
          onPressed: () {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => CenterCartScreen(repo: repo),
              ),
            );
          },
          icon: Stack(
            clipBehavior: Clip.none,
            children: [
              SvgPicture.asset(
                'assets/icons/shopping-cart.svg',
                width: 23,
                height: 23,
                colorFilter:
                    const ColorFilter.mode(Colors.white, BlendMode.srcIn),
              ),
              if (count > 0)
                Positioned(
                  right: -7,
                  top: -6,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    constraints: const BoxConstraints(minWidth: 15),
                    height: 15,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: CustomColors.accent,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: CustomColors.appBackground,
                        width: 1.5,
                      ),
                    ),
                    child: Text(
                      '$count',
                      style: const TextStyle(
                        fontFamily: AppText.bold,
                        color: Colors.black,
                        fontSize: 9,
                        height: 1,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}

// ---------------------------------------------------------------------------
const SliverGridDelegate _storeGrid = SliverGridDelegateWithFixedCrossAxisCount(
  crossAxisCount: 2,
  mainAxisSpacing: 12,
  crossAxisSpacing: 12,
  childAspectRatio: 0.62,
);

const EdgeInsets _storePadding = EdgeInsets.fromLTRB(16, 8, 16, 32);

class _ProductsTab extends StatelessWidget {
  final CenterRepository repo;
  const _ProductsTab({required this.repo});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<CenterProductItem>>(
      stream: repo.watchActiveProducts(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const _Loading();
        }
        final products = snapshot.data!;
        if (products.isEmpty) {
          return AppEmptyState(
            icon: Icons.inventory_2_outlined,
            title: tr('center.no_products'),
          );
        }
        return GridView.builder(
          padding: _storePadding,
          gridDelegate: _storeGrid,
          itemCount: products.length,
          itemBuilder: (context, i) =>
              _ProductGridCard(product: products[i], repo: repo),
        );
      },
    );
  }
}

/// Storefront card shell — surface, radius 16, 1px border, rounded image on
/// top that yields space when the user's font-size setting grows the text.
class _StoreCard extends StatelessWidget {
  final String? cover;
  final Widget placeholderIcon;
  final Widget body;
  final VoidCallback? onTap;
  const _StoreCard({
    required this.cover,
    required this.placeholderIcon,
    required this.body,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: CustomColors.surface,
      borderRadius: BorderRadius.circular(16),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(width: 1, color: CustomColors.surfaceBorder),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    color: CustomColors.surfaceAlt,
                    child: cover != null
                        ? Image.network(
                            cover!,
                            fit: BoxFit.cover,
                            loadingBuilder: (context, child, progress) =>
                                progress == null
                                    ? child
                                    : const Center(
                                        child: SizedBox(
                                          width: 18,
                                          height: 18,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            color: Colors.white24,
                                          ),
                                        ),
                                      ),
                            errorBuilder: (_, __, ___) =>
                                Center(child: placeholderIcon),
                          )
                        : Center(child: placeholderIcon),
                  ),
                ),
              ),
              const SizedBox(height: 10),
              Padding(
                padding: const EdgeInsets.fromLTRB(4, 0, 4, 2),
                child: body,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Small accent CTA at the foot of a storefront card.
class _CardButton extends StatelessWidget {
  static const double height = 34;

  final Widget icon;
  final String label;
  final VoidCallback onTap;
  const _CardButton(
      {required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: height,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: CustomColors.accent,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            icon,
            const SizedBox(width: 5),
            Flexible(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppText.button.copyWith(fontSize: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Muted "out of stock" pill that takes the CTA's place.
class _OutOfStockPill extends StatelessWidget {
  const _OutOfStockPill();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: _CardButton.height,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: CustomColors.surfaceAlt,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        tr('center.out_of_stock'),
        style: AppText.caption.copyWith(color: CustomColors.textTertiary),
      ),
    );
  }
}

class _ProductGridCard extends StatelessWidget {
  final CenterProductItem product;
  final CenterRepository repo;
  const _ProductGridCard({required this.product, required this.repo});

  @override
  Widget build(BuildContext context) {
    return _StoreCard(
      cover: product.coverImage,
      placeholderIcon: const Icon(Icons.inventory_2_outlined,
          color: Colors.white24, size: 34),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            product.name,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: AppText.bodyBold.copyWith(fontSize: 12.5, height: 1.25),
          ),
          const SizedBox(height: 6),
          Text(
            formatMNT(product.price),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: AppText.bodyBold,
          ),
          const SizedBox(height: 8),
          _AddToCartControl(product: product, repo: repo),
        ],
      ),
    );
  }
}

class _AddToCartControl extends StatelessWidget {
  final CenterProductItem product;
  final CenterRepository repo;
  const _AddToCartControl({required this.product, required this.repo});

  @override
  Widget build(BuildContext context) {
    if (!product.inStock) {
      return const _OutOfStockPill();
    }
    return _CardButton(
      icon: SvgPicture.asset(
        'assets/icons/shopping-cart-plus.svg',
        width: 16,
        height: 16,
        colorFilter: const ColorFilter.mode(Colors.black, BlendMode.srcIn),
      ),
      label: tr('center.buy'),
      onTap: () {
        if (CenterCart.instance.qtyOf(product.id) == 0) {
          CenterCart.instance.add(product);
        }
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => CenterCartScreen(repo: repo),
          ),
        );
      },
    );
  }
}

// ---------------------------------------------------------------------------
class _AboutTab extends StatelessWidget {
  final CenterCampaignInfo campaign;
  const _AboutTab({required this.campaign});

  @override
  Widget build(BuildContext context) {
    final gallery = campaign.gallery;
    if (campaign.description.trim().isEmpty && gallery.isEmpty) {
      return AppEmptyState(
        icon: Icons.info_outline_rounded,
        title: tr('center.info_coming_soon'),
      );
    }
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
      children: [
        if (campaign.description.trim().isNotEmpty) ...[
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(tr('center.about_project'), style: AppText.sectionTitle),
                const SizedBox(height: 8),
                Text(
                  campaign.description,
                  style: AppText.body.copyWith(
                    fontSize: 13,
                    height: 1.5,
                    color: CustomColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],
        if (gallery.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.fromLTRB(4, 12, 4, 12),
            child: Text(tr('center.gallery'), style: AppText.sectionTitle),
          ),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              mainAxisSpacing: 8,
              crossAxisSpacing: 8,
              childAspectRatio: 1,
            ),
            itemCount: gallery.length,
            itemBuilder: (context, i) => GestureDetector(
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    fullscreenDialog: true,
                    builder: (_) =>
                        _GalleryViewer(images: gallery, initialIndex: i),
                  ),
                );
              },
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  color: CustomColors.surfaceAlt,
                  child: Image.network(
                    gallery[i],
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const Center(
                      child: Icon(Icons.broken_image_outlined,
                          color: Colors.white24, size: 22),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }
}

// ---------------------------------------------------------------------------
class _DonorsTab extends StatelessWidget {
  final CenterRepository repo;
  final int topCount;
  const _DonorsTab({required this.repo, required this.topCount});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<CenterTopDonor>>(
      stream: repo.watchTopDonors(limit: topCount),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const _Loading();
        }
        final donors = snapshot.data!;
        return Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
              child: AppBanner(
                icon: Icons.emoji_events_rounded,
                text: tr('center.engrave_note', {'count': topCount}),
              ),
            ),
            Expanded(
              child: donors.isEmpty
                  ? AppEmptyState(
                      icon: Icons.emoji_events_outlined,
                      title: tr('center.no_supporters_yet'),
                    )
                  : ListView(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                      children: [
                        AppCard(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 6),
                          child: Column(
                            children: [
                              for (int i = 0; i < donors.length; i++) ...[
                                if (i > 0) const AppDivider(vertical: 0),
                                _DonorRow(rank: i + 1, donor: donors[i]),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
            ),
          ],
        );
      },
    );
  }
}

/// One line on the supporters wall — rank tile + name. Donated amounts are
/// intentionally not shown — names only.
class _DonorRow extends StatelessWidget {
  final int rank;
  final CenterTopDonor donor;
  const _DonorRow({required this.rank, required this.donor});

  @override
  Widget build(BuildContext context) {
    final bool isTop = rank == 1;
    return AppListRow(
      title: donor.displayName,
      leading: AppIconTile(
        size: 32,
        color: isTop ? CustomColors.accent : CustomColors.surfaceAlt,
        child: Text(
          '$rank',
          style: AppText.bodyBold.copyWith(
            fontSize: 12,
            color: isTop ? Colors.black : CustomColors.textSecondary,
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
/// Fullscreen, swipeable, pinch-to-zoom gallery viewer.
class _GalleryViewer extends StatelessWidget {
  final List<String> images;
  final int initialIndex;
  const _GalleryViewer({required this.images, required this.initialIndex});

  @override
  Widget build(BuildContext context) {
    final controller = PageController(initialPage: initialIndex);
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          PageView.builder(
            controller: controller,
            itemCount: images.length,
            itemBuilder: (context, i) => InteractiveViewer(
              minScale: 1,
              maxScale: 4,
              child: Center(
                child: Image.network(
                  images[i],
                  fit: BoxFit.contain,
                  loadingBuilder: (context, child, progress) => progress == null
                      ? child
                      : Center(
                          child: CircularProgressIndicator(
                              color: CustomColors.accent, strokeWidth: 2),
                        ),
                  errorBuilder: (_, __, ___) => const Center(
                    child: Icon(Icons.broken_image_outlined,
                        color: Colors.white24, size: 40),
                  ),
                ),
              ),
            ),
          ),
          SafeArea(
            child: Align(
              alignment: Alignment.topLeft,
              child: Padding(
                padding: const EdgeInsets.all(8),
                child: CircleAvatar(
                  backgroundColor: Colors.black.withOpacity(0.5),
                  child: IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
/// "Мод тарих" — tree-planting storefront. Every active tree is shown in one
/// grid (categories are an admin-side concept only). A card opens
/// [TreeOrderScreen].
class _TreesTab extends StatelessWidget {
  final CenterRepository repo;
  const _TreesTab({required this.repo});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<CenterTreeItem>>(
      stream: repo.watchActiveTrees(),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return AppEmptyState(
            icon: Icons.error_outline_rounded,
            iconColor: CustomColors.negative,
            title: tr('center.trees_load_failed'),
          );
        }
        if (!snapshot.hasData) {
          return const _Loading();
        }
        final trees = snapshot.data!;
        if (trees.isEmpty) {
          return AppEmptyState(
            icon: Icons.forest_rounded,
            title: tr('center.trees_coming_soon'),
          );
        }
        return GridView.builder(
          padding: _storePadding,
          gridDelegate: _storeGrid,
          itemCount: trees.length,
          itemBuilder: (context, i) => _TreeGridCard(tree: trees[i]),
        );
      },
    );
  }
}

/// Tree card in the storefront grid — same geometry as the products grid.
/// Tapping anywhere opens the order screen, so the botanical details stay
/// reachable even when the tree is out of stock.
class _TreeGridCard extends StatelessWidget {
  final CenterTreeItem tree;
  const _TreeGridCard({required this.tree});

  void _open(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => TreeOrderScreen(tree: tree)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return _StoreCard(
      cover: tree.coverImage,
      onTap: () => _open(context),
      placeholderIcon:
          Icon(Icons.forest_rounded, color: CustomColors.positive, size: 34),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            tree.name,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: AppText.bodyBold.copyWith(fontSize: 12.5, height: 1.25),
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              Expanded(
                child: Text(
                  formatMNT(tree.price),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.bodyBold,
                ),
              ),
              if (tree.stock != null) ...[
                const SizedBox(width: 4),
                _StockChip(stock: tree.stock!),
              ],
            ],
          ),
          const SizedBox(height: 8),
          _PlantControl(tree: tree),
        ],
      ),
    );
  }
}

/// Remaining-stock chip on a tree card. Turns gold once the tree is nearly
/// gone so scarcity is visible before the user reaches the order screen.
class _StockChip extends StatelessWidget {
  final int stock;
  const _StockChip({required this.stock});

  @override
  Widget build(BuildContext context) {
    final low = stock <= 20;
    final color = stock <= 0
        ? CustomColors.textTertiary
        : low
            ? CustomColors.accent
            : CustomColors.textSecondary;
    return AppStatusChip(
      color: color,
      label: stock <= 0
          ? tr('center.out_of_stock')
          : tr('center.stock_pcs_short', {'stock': stock}),
    );
  }
}

/// "Мод тарих" button shared by the tree cards. Opens the order form.
class _PlantControl extends StatelessWidget {
  final CenterTreeItem tree;
  const _PlantControl({required this.tree});

  @override
  Widget build(BuildContext context) {
    if (!tree.inStock) {
      return const _OutOfStockPill();
    }
    return _CardButton(
      icon: const Icon(Icons.park_rounded, size: 15, color: Colors.black),
      label: tr('center.plant_tree'),
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => TreeOrderScreen(tree: tree),
          ),
        );
      },
    );
  }
}

// ---------------------------------------------------------------------------
// "Бусад" дэлгэцээс орох бие даасан дэлгэцүүд — Center-ийн таб бүр тусдаа
// Scaffold-той. Агуулга нь таб-уудтай яг ижил widget-үүд.
// ---------------------------------------------------------------------------

/// Бие даасан дэлгэцийн дээд тайлбар banner — хуучин таб-ын толгойд
/// харагддаг байсан мессежүүд (мод тарих: ногоон өвийн тухай, бусад:
/// худалдан авалт төслийг дэмждэг тухай).
Widget _screenNote({required Widget note, required Widget body}) {
  return Column(
    children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
        child: note,
      ),
      Expanded(child: body),
    ],
  );
}

Widget _plantNote() => AppBanner(
      icon: Icons.eco_rounded,
      color: CustomColors.positive,
      text: tr('center.plant_legacy_note'),
    );

Widget _supportNote() => AppBanner(
      icon: Icons.favorite_rounded,
      text: tr('center.purchase_supports_note'),
    );

/// Мод тарих — идэвхтэй модны жагсаалт
class CenterTreesScreen extends StatelessWidget {
  CenterTreesScreen({super.key, CenterRepository? repo})
      : repo = repo ?? CenterRepository();
  final CenterRepository repo;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CustomColors.appBackground,
      appBar: appBar(
        tr('center.plant_tree'),
        actions: [
          IconButton(
            tooltip: tr('center.my_planted_trees'),
            icon: const Icon(Icons.forest_rounded,
                color: Colors.white, size: 22),
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(
                  builder: (_) => CenterMyTreeOrdersScreen(repo: repo)),
            ),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: _screenNote(note: _plantNote(), body: _TreesTab(repo: repo)),
    );
  }
}

/// Бүтээгдэхүүн — цогцолборын дэлгүүр, сагстай
class CenterProductsScreen extends StatelessWidget {
  CenterProductsScreen({super.key, CenterRepository? repo})
      : repo = repo ?? CenterRepository();
  final CenterRepository repo;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CustomColors.appBackground,
      appBar: appBar(
        tr('center.products'),
        actions: [
          IconButton(
            tooltip: tr('center.my_orders'),
            icon: SvgPicture.asset(
              'assets/icons/document-list-check.svg',
              width: 22,
              height: 22,
              colorFilter:
                  const ColorFilter.mode(Colors.white, BlendMode.srcIn),
            ),
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(
                  builder: (_) => CenterMyOrdersScreen(repo: repo)),
            ),
          ),
          _CartAction(repo: repo),
          const SizedBox(width: 4),
        ],
      ),
      body: _screenNote(
          note: _supportNote(), body: _ProductsTab(repo: repo)),
    );
  }
}

/// Төслийн тухай — танилцуулга, зургийн цомог
class CenterAboutScreen extends StatelessWidget {
  CenterAboutScreen({super.key, CenterRepository? repo})
      : repo = repo ?? CenterRepository();
  final CenterRepository repo;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CustomColors.appBackground,
      appBar: appBar(tr('center.about_project')),
      body: StreamBuilder<CenterCampaignInfo>(
        stream: repo.watchCampaign(),
        builder: (context, snapshot) {
          final campaign = snapshot.data;
          if (campaign == null) return const _Loading();
          return _AboutTab(campaign: campaign);
        },
      ),
    );
  }
}

/// Дэмжигчид — шилдэг дэмжигчдийн самбар
class CenterSupportersScreen extends StatelessWidget {
  CenterSupportersScreen({super.key, CenterRepository? repo})
      : repo = repo ?? CenterRepository();
  final CenterRepository repo;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CustomColors.appBackground,
      appBar: appBar(tr('more.supporters')),
      body: StreamBuilder<CenterCampaignInfo>(
        stream: repo.watchCampaign(),
        builder: (context, snapshot) {
          final campaign = snapshot.data;
          if (campaign == null) return const _Loading();
          return _screenNote(
            note: _supportNote(),
            body: _DonorsTab(repo: repo, topCount: campaign.topCount),
          );
        },
      ),
    );
  }
}
