import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:onegrgold/models/center_models.dart';
import 'package:onegrgold/repositories/center_repository.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:onegrgold/style/colors.dart';

class CenterMyOrdersScreen extends StatelessWidget {
  final CenterRepository repo;
  const CenterMyOrdersScreen({super.key, required this.repo});

  @override
  Widget build(BuildContext context) {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    return Scaffold(
      backgroundColor: CustomColors.darkContainerColor,
      appBar: AppBar(
        backgroundColor: CustomColors.darkContainerColor,
        iconTheme: const IconThemeData(color: Colors.white),
        title: const Text(
          'Миний туслалцаа',
          style: TextStyle(
              fontFamily: 'InterBold', fontSize: 13, color: Colors.white),
        ),
        centerTitle: false,
      ),
      body: uid == null
          ? const Center(
              child: Text('Нэвтрэх шаардлагатай.',
                  style: TextStyle(color: Colors.white54, fontSize: 13)),
            )
          : StreamBuilder<List<CenterDonationOrder>>(
              stream: repo.watchMyDonations(uid),
              builder: (context, snapshot) {
                if (!snapshot.hasData) {
                  return const Center(
                    child: CircularProgressIndicator(color: Colors.white24),
                  );
                }
                final orders = snapshot.data!;
                if (orders.isEmpty) {
                  return const Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.receipt_long_outlined,
                            color: Colors.white24, size: 48),
                        SizedBox(height: 12),
                        Text('Туслалцааны захиалга алга.',
                            style:
                                TextStyle(color: Colors.white54, fontSize: 13)),
                      ],
                    ),
                  );
                }
                return ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: orders.length,
                  itemBuilder: (context, i) => _OrderTile(order: orders[i]),
                );
              },
            ),
    );
  }
}

String _two(int n) => n.toString().padLeft(2, '0');

String _fmtDate(DateTime? d) => d == null
    ? '—'
    : '${d.year}-${_two(d.month)}-${_two(d.day)} ${_two(d.hour)}:${_two(d.minute)}';

String _fmtDay(DateTime? d) =>
    d == null ? '—' : '${d.year}-${_two(d.month)}-${_two(d.day)}';

Widget _receivedBadge() => Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: CustomColors.successGreen.withOpacity(0.15),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        'Бараа хүлээн авсан',
        style: TextStyle(
            color: CustomColors.successGreen,
            fontSize: 10.5,
            fontWeight: FontWeight.w600),
      ),
    );

class _OrderTile extends StatelessWidget {
  final CenterDonationOrder order;
  const _OrderTile({required this.order});

  @override
  Widget build(BuildContext context) {
    final itemsText = order.items
        .map((it) => '${it.name}${it.qty > 1 ? ' ×${it.qty}' : ''}')
        .join(', ');

    return GestureDetector(
      onTap: () {
        showModalBottomSheet<void>(
          context: context,
          backgroundColor: Colors.transparent,
          isScrollControlled: true,
          builder: (_) => _OrderDetailSheet(order: order),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFF1F1F22),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withOpacity(0.06)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    formatMNT(order.amount),
                    style: TextStyle(
                      color: CustomColors.mainColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ),
                if (order.isDelivered) _receivedBadge(),
              ],
            ),
            if (itemsText.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(
                itemsText,
                style: const TextStyle(color: Colors.white70, fontSize: 12),
              ),
            ],
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  _fmtDate(order.createdAt),
                  style: const TextStyle(color: Colors.white38, fontSize: 11),
                ),
                Row(
                  children: [
                    Text(
                      order.isDelivered ? 'Дэлгэрэнгүй' : 'Код харах',
                      style: TextStyle(
                        color: CustomColors.mainColor,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Icon(Icons.chevron_right_rounded,
                        size: 16, color: CustomColors.mainColor),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _OrderDetailSheet extends StatelessWidget {
  final CenterDonationOrder order;
  const _OrderDetailSheet({required this.order});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFF1A1A1C),
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 10, 20, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              Row(
                children: [
                  const Expanded(
                    child: Text(
                      'Захиалгын дэлгэрэнгүй',
                      style: TextStyle(
                        color: Colors.white,
                        fontFamily: 'InterBold',
                        fontSize: 16,
                      ),
                    ),
                  ),
                  if (order.isDelivered) _receivedBadge(),
                ],
              ),
              const SizedBox(height: 16),
              // Items
              ...order.items.map(
                (it) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          '${it.name}${it.qty > 1 ? '  ×${it.qty}' : ''}',
                          style: const TextStyle(
                              color: Colors.white, fontSize: 13),
                        ),
                      ),
                      Text(
                        formatMNT(it.price * it.qty),
                        style: const TextStyle(
                            color: Colors.white70, fontSize: 13),
                      ),
                    ],
                  ),
                ),
              ),
              const Divider(color: Colors.white12, height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Нийт дүн',
                      style: TextStyle(color: Colors.white70, fontSize: 13)),
                  Text(
                    formatMNT(order.amount),
                    style: TextStyle(
                      color: CustomColors.mainColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 17,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                _fmtDate(order.createdAt),
                style: const TextStyle(color: Colors.white38, fontSize: 11),
              ),
              const SizedBox(height: 20),
              if (order.isDelivered)
                _receivedCard()
              else if (order.pickupCode.isNotEmpty)
                _codeCard(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _codeCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 22, horizontal: 16),
      decoration: BoxDecoration(
        color: CustomColors.mainColor.withOpacity(0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: CustomColors.mainColor.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Icon(Icons.qr_code_2_rounded,
              size: 30, color: CustomColors.mainColor),
          const SizedBox(height: 8),
          const Text(
            'Бараа авах код',
            style: TextStyle(color: Colors.white70, fontSize: 12),
          ),
          const SizedBox(height: 10),
          Text(
            order.pickupCode,
            style: TextStyle(
              color: CustomColors.mainColor,
              fontFamily: 'RubikBold',
              fontSize: 38,
              letterSpacing: 8,
            ),
          ),
          const SizedBox(height: 10),
          const Text(
            'Бараагаа авахдаа энэ кодыг ажилтанд үзүүлнэ үү.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white54, fontSize: 11.5),
          ),
        ],
      ),
    );
  }

  Widget _receivedCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
      decoration: BoxDecoration(
        color: CustomColors.successGreen.withOpacity(0.10),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: CustomColors.successGreen.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Icon(Icons.check_circle_rounded,
              size: 32, color: CustomColors.successGreen),
          const SizedBox(height: 8),
          const Text(
            'Бараа хүлээн авсан',
            style: TextStyle(
              color: Colors.white,
              fontFamily: 'InterBold',
              fontSize: 15,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '${_fmtDay(order.deliveredAt)}-нд хүлээн авсан',
            style: TextStyle(
              color: CustomColors.successGreen,
              fontFamily: 'RubikBold',
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Та энэ захиалгын барааг амжилттай хүлээн авсан тул код '
            'дахин шаардлагагүй.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white54, fontSize: 11.5),
          ),
        ],
      ),
    );
  }
}
