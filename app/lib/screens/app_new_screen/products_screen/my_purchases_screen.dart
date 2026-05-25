import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:onegrgold/models/product_purchase_model.dart';
import 'package:onegrgold/repositories/product_repository.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/purchase_detail_screen.dart';
import 'package:onegrgold/style/colors.dart';

class MyPurchasesScreen extends StatefulWidget {
  final String uid;

  const MyPurchasesScreen({super.key, required this.uid});

  @override
  State<MyPurchasesScreen> createState() => _MyPurchasesScreenState();
}

class _MyPurchasesScreenState extends State<MyPurchasesScreen> {
  final ProductRepository _repo = ProductRepository();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CustomColors.darkContainerColor,
      appBar: AppBar(
        backgroundColor: CustomColors.darkContainerColor,
        iconTheme: const IconThemeData(color: Colors.white),
        title: const Text(
          'Миний худалдан авалт',
          style: TextStyle(
            fontFamily: 'InterBold',
            fontSize: 13,
            color: Colors.white,
          ),
        ),
        centerTitle: false,
      ),
      body: StreamBuilder<List<ProductPurchase>>(
        stream: _repo.watchMyPurchases(widget.uid),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CupertinoActivityIndicator());
          }
          if (snapshot.hasError) {
            final err = snapshot.error;
            final stack = snapshot.stackTrace;
            debugPrint('[MyPurchasesScreen] error: $err');
            if (stack != null) debugPrintStack(stackTrace: stack);
            FlutterError.reportError(FlutterErrorDetails(
              exception: err ?? 'Unknown error',
              stack: stack,
              library: 'MyPurchasesScreen',
              context: ErrorDescription('watchMyPurchases stream'),
            ));
            return _ErrorState(message: '$err');
          }
          final list = snapshot.data ?? const <ProductPurchase>[];
          if (list.isEmpty) {
            return const _EmptyState();
          }
          final sorted = _sortByStatusPriority(list);
          return ListView.separated(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 24),
            itemCount: sorted.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (context, index) {
              final p = sorted[index];
              return _PurchaseRowCard(
                purchase: p,
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => PurchaseDetailScreen(purchase: p),
                    ),
                  );
                },
              );
            },
          );
        },
      ),
    );
  }
}

/// Active > completed > delivered > cancelled, within each by startedAt desc
/// (the underlying stream already orders by startedAt desc).
List<ProductPurchase> _sortByStatusPriority(List<ProductPurchase> list) {
  int priority(ProductPurchaseStatus s) {
    switch (s) {
      case ProductPurchaseStatus.active:
        return 0;
      case ProductPurchaseStatus.completed:
        return 1;
      case ProductPurchaseStatus.delivered:
        return 2;
      case ProductPurchaseStatus.cancelled:
        return 3;
    }
  }

  final sorted = [...list]
    ..sort((a, b) => priority(a.status).compareTo(priority(b.status)));
  return sorted;
}

class _PurchaseRowCard extends StatelessWidget {
  final ProductPurchase purchase;
  final VoidCallback onTap;

  const _PurchaseRowCard({
    required this.purchase,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final ps = purchase.productSnapshot;
    final isInstallment = purchase.purchaseType == PurchaseType.installment;
    final progress = purchase.progress;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFF1F1F22),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white.withOpacity(0.06)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                // Image
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    width: 56,
                    height: 56,
                    color: const Color(0xFF252528),
                    child: ps.image != null && ps.image!.isNotEmpty
                        ? Image.network(
                            ps.image!,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => const Icon(
                              Icons.image_not_supported_outlined,
                              color: Colors.white24,
                            ),
                          )
                        : const Icon(
                            Icons.inventory_2_outlined,
                            color: Colors.white24,
                          ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        ps.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          _StatusBadge(status: purchase.status),
                          const SizedBox(width: 6),
                          if (isInstallment)
                            Text(
                              '${purchase.paidMonths}/${purchase.months} сар',
                              style: const TextStyle(
                                color: Colors.white54,
                                fontSize: 11,
                              ),
                            )
                          else
                            const Text(
                              'Шууд авалт',
                              style: TextStyle(
                                color: Colors.white54,
                                fontSize: 11,
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      formatMNT(purchase.paidAmount),
                      style: TextStyle(
                        color: CustomColors.mainColor,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                    Text(
                      '/${formatMNT(purchase.totalPrice)}',
                      style: const TextStyle(
                        color: Colors.white54,
                        fontSize: 10,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            if (isInstallment &&
                purchase.status != ProductPurchaseStatus.cancelled) ...[
              const SizedBox(height: 10),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: progress,
                  minHeight: 5,
                  backgroundColor: Colors.white.withOpacity(0.08),
                  valueColor: AlwaysStoppedAnimation(_progressColor()),
                ),
              ),
              if (purchase.nextDueDate != null &&
                  purchase.status == ProductPurchaseStatus.active) ...[
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Icon(
                      Icons.event,
                      size: 12,
                      color: Colors.white54,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Дараагийн төлбөр: ${_fmtDate(purchase.nextDueDate!)}',
                      style: const TextStyle(
                        color: Colors.white54,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ],
        ),
      ),
    );
  }

  Color _progressColor() {
    switch (purchase.status) {
      case ProductPurchaseStatus.active:
        return CustomColors.mainColor;
      case ProductPurchaseStatus.completed:
        return CustomColors.successGreen;
      case ProductPurchaseStatus.delivered:
        return CustomColors.activeGreen;
      case ProductPurchaseStatus.cancelled:
        return CustomColors.alerRed;
    }
  }
}

class _StatusBadge extends StatelessWidget {
  final ProductPurchaseStatus status;
  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    String text;
    switch (status) {
      case ProductPurchaseStatus.active:
        bg = const Color(0x331E88E5);
        fg = const Color(0xFF7CC2FF);
        text = 'Идэвхтэй';
        break;
      case ProductPurchaseStatus.completed:
        bg = const Color(0x3343A047);
        fg = const Color(0xFF7BD389);
        text = 'Төлөгдсөн';
        break;
      case ProductPurchaseStatus.delivered:
        bg = const Color(0x33FCD535);
        fg = CustomColors.mainColor;
        text = 'Хүлээлгэн өгсөн';
        break;
      case ProductPurchaseStatus.cancelled:
        bg = const Color(0x33C2240B);
        fg = const Color(0xFFE57373);
        text = 'Цуцалсан';
        break;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        text,
        style: TextStyle(color: fg, fontSize: 10, fontWeight: FontWeight.w600),
      ),
    );
  }
}

String _fmtDate(DateTime d) {
  final y = d.year.toString().padLeft(4, '0');
  final m = d.month.toString().padLeft(2, '0');
  final day = d.day.toString().padLeft(2, '0');
  return '$y.$m.$day';
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.receipt_long_outlined,
              size: 56, color: Colors.white.withOpacity(0.3)),
          const SizedBox(height: 12),
          const Text(
            'Худалдан авалт байхгүй байна',
            style: TextStyle(
              color: Colors.white54,
              fontWeight: FontWeight.w600,
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 6),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 40),
            child: Text(
              'Бүтээгдэхүүн сонгож хуваан төлөх эсвэл шууд худалдан авалт хийгээрэй.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white38, fontSize: 11),
            ),
          ),
        ],
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  final String message;
  const _ErrorState({required this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 56, color: Colors.redAccent),
            const SizedBox(height: 12),
            const Text(
              'Худалдан авалт ачаалахад алдаа гарлаа',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 6),
            Text(
              message,
              style: const TextStyle(color: Colors.white54, fontSize: 11),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
