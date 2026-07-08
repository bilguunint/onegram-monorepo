import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:onegrgold/models/center_models.dart';
import 'package:onegrgold/repositories/center_repository.dart';
import 'package:onegrgold/screens/app_new_screen/center_screen/center_cart.dart';
import 'package:onegrgold/screens/app_new_screen/center_screen/center_cart_screen.dart';
import 'package:onegrgold/screens/app_new_screen/center_screen/center_my_orders_screen.dart';
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

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        backgroundColor: CustomColors.darkContainerColor,
        appBar: AppBar(
          backgroundColor: CustomColors.darkContainerColor,
          iconTheme: const IconThemeData(color: Colors.white),
          title: const Text(
            'Дэлхийн морин хуурын төв цогцолбор',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontFamily: 'InterBold',
              fontSize: 13,
              color: Colors.white,
            ),
          ),
          centerTitle: false,
          actions: [
            IconButton(
              tooltip: 'Миний захиалга',
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
                        const Tab(text: 'Бүтээгдэхүүн'),
                        const Tab(text: 'Төслийн тухай'),
                        Tab(text: 'Шилдэг ${campaign.topCount}'),
                      ],
                    ),
                  ),
                ),
              ],
              body: TabBarView(
                children: [
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
    final pct = campaign.progress * 100;
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
        // Slim campaign progress strip (scrolls away with the header).
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    formatMNT(campaign.totalRaised),
                    style: TextStyle(
                      color: CustomColors.mainColor,
                      fontFamily: 'RubikBold',
                      fontSize: 13,
                    ),
                  ),
                  Text(
                    '${pct.toStringAsFixed(pct < 10 ? 1 : 0)}% · ${formatMNT(campaign.targetAmount)}',
                    style: const TextStyle(color: Colors.white70, fontSize: 11),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: LinearProgressIndicator(
                  value: campaign.progress,
                  minHeight: 6,
                  backgroundColor: Colors.white.withOpacity(0.18),
                  valueColor:
                      AlwaysStoppedAnimation<Color>(CustomColors.mainColor),
                ),
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  const Icon(Icons.volunteer_activism_rounded,
                      size: 13, color: Colors.white54),
                  const SizedBox(width: 5),
                  Text('${campaign.donorCount} дэмжигч',
                      style:
                          const TextStyle(color: Colors.white70, fontSize: 12)),
                ],
              ),
              const SizedBox(height: 10),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                decoration: BoxDecoration(
                  color: CustomColors.mainColor.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                      color: CustomColors.mainColor.withOpacity(0.25)),
                ),
                child: Row(
                  children: [
                    Icon(Icons.favorite_rounded,
                        size: 14, color: CustomColors.mainColor),
                    const SizedBox(width: 8),
                    const Expanded(
                      child: Text(
                        'Таны худалдан авалт Дэлхийн морин хуурын төв '
                        'цогцолборыг бүтээн байгуулах үйл хэрэгт дэмжлэг болно.',
                        style: TextStyle(
                            color: Colors.white70, fontSize: 11.5, height: 1.4),
                      ),
                    ),
                  ],
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
                if (s.name.isNotEmpty)
                  Text(
                    s.name,
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
                      ? 'Таны дэмжлэг: ${formatMNT(s.donatedAmount)}'
                      : 'Та хараахан дэмжлэг үзүүлээгүй байна',
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
          tooltip: 'Сагс',
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
          return const Center(
            child: Text('Бараа алга.',
                style: TextStyle(color: Colors.white54, fontSize: 13)),
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
        child: const Text('Дууссан',
            style: TextStyle(color: Colors.white38, fontSize: 11)),
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
            const Text('Худалдан авах',
                style: TextStyle(
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
          const Text('Төслийн тухай',
              style: TextStyle(
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
          const Text('Зургийн цомог',
              style: TextStyle(
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
          const Padding(
            padding: EdgeInsets.only(top: 40),
            child: Center(
              child: Text('Мэдээлэл удахгүй нэмэгдэнэ.',
                  style: TextStyle(color: Colors.white54, fontSize: 13)),
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
                  ? const Center(
                      child: Text('Дэмжигч одоогоор алга.',
                          style:
                              TextStyle(color: Colors.white54, fontSize: 13)),
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
                            const SizedBox(width: 8),
                            Text(
                              formatMNT(d.amount),
                              style: TextStyle(
                                color: CustomColors.mainColor,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
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
              'Та шилдэг $topCount дэмжигчийн нэг болбол таны нэрийг алтан '
              'үсгээр сийлэн төв цогцолбортоо мөнхөлнө.',
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
