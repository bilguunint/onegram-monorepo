import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/center_models.dart';
import 'package:onegrgold/repositories/center_repository.dart';
import 'package:onegrgold/screens/app_new_screen/center_screen/center_cart.dart';
import 'package:onegrgold/screens/app_new_screen/center_screen/center_cart_screen.dart';
import 'package:onegrgold/screens/app_new_screen/center_screen/center_my_orders_screen.dart';
import 'package:onegrgold/screens/app_new_screen/center_screen/center_my_tree_orders_screen.dart';
import 'package:onegrgold/screens/app_new_screen/center_screen/center_promo_popup.dart';
import 'package:onegrgold/screens/app_new_screen/center_screen/tree_order_screen.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
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
        backgroundColor: CustomColors.darkContainerColor,
        appBar: AppBar(
          backgroundColor: CustomColors.darkContainerColor,
          iconTheme: const IconThemeData(color: Colors.white),
          title: Text(
            tr('center.complex_title'),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontFamily: 'InterBold',
              fontSize: 13,
              color: Colors.white,
            ),
          ),
          centerTitle: false,
          actions: [
            IconButton(
              tooltip: tr('center.my_planted_trees'),
              icon:
                  const Icon(Icons.forest_rounded, color: kLeafGreen, size: 22),
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
              return const Center(
                child: CircularProgressIndicator(color: Colors.white24),
              );
            }
            _maybeShowPopup(campaign);
            return NestedScrollView(
              headerSliverBuilder: (context, _) => [
                SliverToBoxAdapter(
                  child: _Header(campaign: campaign, stat: _stat),
                ),
                SliverPersistentHeader(
                  pinned: true,
                  delegate: _TabBarDelegate(
                    TabBar(
                      indicatorColor: const Color(0xFFFCD535),
                      indicatorWeight: 2.5,
                      labelColor: Colors.white,
                      unselectedLabelColor: Colors.white54,
                      labelPadding: const EdgeInsets.symmetric(horizontal: 2),
                      labelStyle: const TextStyle(
                        fontFamily: 'InterBold',
                        fontSize: 12,
                      ),
                      tabs: [
                        Tab(text: tr('center.plant_tree')),
                        Tab(text: tr('center.products')),
                        Tab(text: tr('center.about_project')),
                        Tab(
                            text: tr(
                                'center.top_n', {'count': campaign.topCount})),
                      ],
                    ),
                  ),
                ),
              ],
              body: TabBarView(
                // Tabs switch only by tapping the TabBar — swiping the
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
class _TabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar tabBar;
  _TabBarDelegate(this.tabBar);

  @override
  double get minExtent => tabBar.preferredSize.height;
  @override
  double get maxExtent => tabBar.preferredSize.height;

  @override
  Widget build(
      BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: CustomColors.darkContainerColor,
      child: tabBar,
    );
  }

  @override
  bool shouldRebuild(covariant _TabBarDelegate oldDelegate) =>
      tabBar != oldDelegate.tabBar;
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
        // 21:9 header banner with the user's donation stat overlaid.
        AspectRatio(
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
        // Below-banner strip swaps with the active tab: the "Мод тарих" tab
        // gets a green planting panel, every other tab shows the fundraising
        // progress. Scrolls away with the header.
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
          child: _TabAwareBody(
            treeInfo: _treeInfo(),
            progress: _campaignProgress(),
          ),
        ),
      ],
    );
  }

  /// Fundraising progress — shown on every tab except "Мод тарих".
  /// Campaign totals, progress bar and supporter counts are intentionally not
  /// shown — only the supporting message remains.
  Widget _campaignProgress() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: BoxDecoration(
            color: CustomColors.mainColor.withOpacity(0.08),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: CustomColors.mainColor.withOpacity(0.25)),
          ),
          child: Row(
            children: [
              Icon(Icons.favorite_rounded,
                  size: 14, color: CustomColors.mainColor),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  tr('center.purchase_supports_note'),
                  style: const TextStyle(
                      color: Colors.white70, fontSize: 11.5, height: 1.4),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  /// Green planting panel — shown on the "Мод тарих" tab. Tree/participant
  /// counts are intentionally not shown; only the legacy message remains.
  Widget _treeInfo() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: BoxDecoration(
            color: kForestGreen.withOpacity(0.12),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: kForestGreen.withOpacity(0.30)),
          ),
          child: Row(
            children: [
              const Icon(Icons.eco_rounded, size: 14, color: kLeafGreen),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  tr('center.plant_legacy_note'),
                  style: const TextStyle(
                      color: Colors.white70, fontSize: 11.5, height: 1.4),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _statOverlay(CenterUserHeaderStat s) {
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
                  style: const TextStyle(
                    color: Colors.white,
                    fontFamily: 'InterBold',
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                    shadows: [Shadow(blurRadius: 6, color: Colors.black87)],
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  s.hasDonated
                      ? tr('center.your_support_amount',
                          {'amount': formatMNT(s.donatedAmount)})
                      : tr('center.no_support_yet'),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color:
                        s.hasDonated ? CustomColors.mainColor : Colors.white70,
                    fontWeight: FontWeight.bold,
                    fontSize: 12.5,
                    shadows: const [
                      Shadow(blurRadius: 6, color: Colors.black87)
                    ],
                  ),
                ),
                const SizedBox(height: 3),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.park_rounded,
                      size: 13,
                      color: kLeafGreen,
                      shadows: [Shadow(blurRadius: 6, color: Colors.black87)],
                    ),
                    const SizedBox(width: 4),
                    Text(
                      tr('center.your_trees_count', {'count': s.treeCount}),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: kLeafGreen,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                        shadows: [Shadow(blurRadius: 6, color: Colors.black87)],
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
        border: Border.all(color: CustomColors.mainColor.withOpacity(0.6)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.emoji_events_rounded,
              size: 15, color: CustomColors.mainColor),
          const SizedBox(width: 5),
          Text(
            '#$rank',
            style: TextStyle(
              color: CustomColors.mainColor,
              fontFamily: 'RubikBold',
              fontSize: 16,
            ),
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
      color: const Color(0xFF161922),
      child: Center(
        child: Icon(Icons.account_balance_rounded,
            size: 48, color: CustomColors.mainColor.withOpacity(0.4)),
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
                      color: CustomColors.mainColor,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: CustomColors.darkContainerColor,
                        width: 1.5,
                      ),
                    ),
                    child: Text(
                      '$count',
                      style: const TextStyle(
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
class _ProductsTab extends StatelessWidget {
  final CenterRepository repo;
  const _ProductsTab({required this.repo});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<CenterProductItem>>(
      stream: repo.watchActiveProducts(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Center(
            child: CircularProgressIndicator(color: Colors.white24),
          );
        }
        final products = snapshot.data!;
        if (products.isEmpty) {
          return Center(
            child: Text(tr('center.no_products'),
                style: const TextStyle(color: Colors.white54, fontSize: 13)),
          );
        }
        return GridView.builder(
          padding: const EdgeInsets.all(12),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 0.62,
          ),
          itemCount: products.length,
          itemBuilder: (context, i) =>
              _ProductGridCard(product: products[i], repo: repo),
        );
      },
    );
  }
}

class _ProductGridCard extends StatelessWidget {
  final CenterProductItem product;
  final CenterRepository repo;
  const _ProductGridCard({required this.product, required this.repo});

  @override
  Widget build(BuildContext context) {
    final cover = product.coverImage;
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1F1F22),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withOpacity(0.06)),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            child: Container(
              color: const Color(0xFF252528),
              child: cover != null
                  ? Image.network(
                      cover,
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
                      errorBuilder: (_, __, ___) => const Center(
                        child: Icon(Icons.image_not_supported_outlined,
                            color: Colors.white24, size: 30),
                      ),
                    )
                  : const Center(
                      child: Icon(Icons.inventory_2_outlined,
                          color: Colors.white24, size: 34),
                    ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  product.name,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  formatMNT(product.price),
                  style: TextStyle(
                    color: CustomColors.mainColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 13.5,
                  ),
                ),
                const SizedBox(height: 8),
                _AddToCartControl(product: product, repo: repo),
              ],
            ),
          ),
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
      return Container(
        height: 32,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(tr('center.out_of_stock'),
            style: const TextStyle(color: Colors.white38, fontSize: 11)),
      );
    }
    return GestureDetector(
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
      child: Container(
        height: 32,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: CustomColors.mainColor,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SvgPicture.asset(
              'assets/icons/shopping-cart-plus.svg',
              width: 16,
              height: 16,
              colorFilter:
                  const ColorFilter.mode(Colors.black, BlendMode.srcIn),
            ),
            const SizedBox(width: 5),
            Text(tr('center.buy'),
                style: const TextStyle(
                    color: Colors.black,
                    fontSize: 11.5,
                    fontWeight: FontWeight.bold)),
          ],
        ),
      ),
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
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (campaign.description.trim().isNotEmpty) ...[
          Text(tr('center.about_project'),
              style: const TextStyle(
                  color: Colors.white, fontFamily: 'InterBold', fontSize: 14)),
          const SizedBox(height: 8),
          Text(
            campaign.description,
            style: const TextStyle(
                color: Colors.white70, fontSize: 13, height: 1.5),
          ),
          const SizedBox(height: 20),
        ],
        if (gallery.isNotEmpty) ...[
          Text(tr('center.gallery'),
              style: const TextStyle(
                  color: Colors.white, fontFamily: 'InterBold', fontSize: 14)),
          const SizedBox(height: 10),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              mainAxisSpacing: 6,
              crossAxisSpacing: 6,
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
                borderRadius: BorderRadius.circular(8),
                child: Image.network(
                  gallery[i],
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    color: const Color(0xFF1F1F22),
                    child: const Center(
                      child: Icon(Icons.broken_image_outlined,
                          color: Colors.white24, size: 22),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
        if (campaign.description.trim().isEmpty && gallery.isEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 40),
            child: Center(
              child: Text(tr('center.info_coming_soon'),
                  style: const TextStyle(color: Colors.white54, fontSize: 13)),
            ),
          ),
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
          return const Center(
            child: CircularProgressIndicator(color: Colors.white24),
          );
        }
        final donors = snapshot.data!;
        return Column(
          children: [
            _engraveInfo(),
            Expanded(
              child: donors.isEmpty
                  ? Center(
                      child: Text(tr('center.no_supporters_yet'),
                          style: const TextStyle(
                              color: Colors.white54, fontSize: 13)),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                      itemCount: donors.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (context, i) {
                        final d = donors[i];
                        final isTop = i == 0;
                        return Row(
                          children: [
                            Container(
                              width: 28,
                              height: 28,
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: isTop
                                    ? CustomColors.mainColor
                                    : Colors.white.withOpacity(0.08),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                '${i + 1}',
                                style: TextStyle(
                                  color: isTop ? Colors.black : Colors.white70,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                d.displayName,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600),
                              ),
                            ),
                            // Donated amounts are intentionally not shown on
                            // the wall — names only.
                          ],
                        );
                      },
                    ),
            ),
          ],
        );
      },
    );
  }

  Widget _engraveInfo() {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 4),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: CustomColors.mainColor.withOpacity(0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: CustomColors.mainColor.withOpacity(0.25)),
      ),
      child: Row(
        children: [
          Icon(Icons.emoji_events_rounded,
              size: 18, color: CustomColors.mainColor),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              tr('center.engrave_note', {'count': topCount}),
              style: const TextStyle(
                  color: Colors.white70, fontSize: 12, height: 1.45),
            ),
          ),
        ],
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
                      : const Center(
                          child:
                              CircularProgressIndicator(color: Colors.white24),
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
/// "Мод тарих" — tree-planting storefront with a forest vibe. Every active
/// tree is shown in one grid (categories are an admin-side concept only).
/// A card opens [TreeOrderScreen].
class _TreesTab extends StatelessWidget {
  final CenterRepository repo;
  const _TreesTab({required this.repo});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<CenterTreeItem>>(
      stream: repo.watchActiveTrees(),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return Center(
            child: Text(tr('center.trees_load_failed'),
                style: const TextStyle(color: Colors.white54, fontSize: 13)),
          );
        }
        if (!snapshot.hasData) {
          return const Center(
            child: CircularProgressIndicator(color: Colors.white24),
          );
        }
        final trees = snapshot.data!;
        if (trees.isEmpty) {
          return Center(
            child: Text(tr('center.trees_coming_soon'),
                style: const TextStyle(color: Colors.white54, fontSize: 13)),
          );
        }
        return GridView.builder(
          padding: const EdgeInsets.all(12),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 0.62,
          ),
          itemCount: trees.length,
          itemBuilder: (context, i) => _TreeGridCard(tree: trees[i]),
        );
      },
    );
  }
}

/// Tree card in the storefront grid — same geometry as the products grid,
/// tinted green. Tapping anywhere opens the order screen, so the botanical
/// details stay reachable even when the tree is out of stock.
class _TreeGridCard extends StatelessWidget {
  final CenterTreeItem tree;
  const _TreeGridCard({required this.tree});

  @override
  Widget build(BuildContext context) {
    final cover = tree.coverImage;
    return GestureDetector(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => TreeOrderScreen(tree: tree)),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF1F1F22),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: kForestGreen.withOpacity(0.35)),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Expanded (not a fixed ratio) so the image yields space when the
            // user's font-size setting grows the text block.
            Expanded(
              child: Container(
                color: const Color(0xFF223022),
                child: cover != null
                    ? Image.network(
                        cover,
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
                        errorBuilder: (_, __, ___) => const Center(
                          child: Icon(Icons.forest_rounded,
                              color: kLeafGreen, size: 34),
                        ),
                      )
                    : const Center(
                        child: Icon(Icons.forest_rounded,
                            color: kLeafGreen, size: 34),
                      ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    tree.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                      fontSize: 12,
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          formatMNT(tree.price),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: kLeafGreen,
                            fontWeight: FontWeight.bold,
                            fontSize: 13.5,
                          ),
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
            ),
          ],
        ),
      ),
    );
  }
}

/// Remaining-stock pill on a tree card. Turns amber once the tree is nearly
/// gone so scarcity is visible before the user reaches the order screen.
class _StockChip extends StatelessWidget {
  final int stock;
  const _StockChip({required this.stock});

  @override
  Widget build(BuildContext context) {
    final low = stock <= 20;
    final color = stock <= 0
        ? Colors.white38
        : low
            ? const Color(0xFFFFB300)
            : Colors.white60;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.14),
        borderRadius: BorderRadius.circular(5),
      ),
      child: Text(
        stock <= 0
            ? tr('center.out_of_stock')
            : tr('center.stock_pcs_short', {'stock': stock}),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: TextStyle(
          color: color,
          fontSize: 9.5,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

/// Green "Мод тарих" button shared by the tree cards. Opens the order form.
class _PlantControl extends StatelessWidget {
  static const double height = 30;

  final CenterTreeItem tree;
  const _PlantControl({required this.tree});

  @override
  Widget build(BuildContext context) {
    if (!tree.inStock) {
      return Container(
        height: height,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(tr('center.out_of_stock'),
            style: const TextStyle(color: Colors.white38, fontSize: 10.5)),
      );
    }
    return GestureDetector(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => TreeOrderScreen(tree: tree),
          ),
        );
      },
      child: Container(
        height: height,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          gradient: const LinearGradient(colors: [kForestGreen, kLeafGreen]),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.park_rounded, size: 14, color: Colors.white),
            const SizedBox(width: 4),
            Text(tr('center.plant_tree'),
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }
}
