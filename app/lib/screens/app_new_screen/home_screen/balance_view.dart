import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:onegrgold/elements/gold_card_background.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/user_model.dart';
import 'package:onegrgold/data/gold_history.dart';

/// Алтан картын агуулга: хуримтлалын дүн, төгрөгийн үнэ цэнэ ба өөрчлөлт,
/// доод хэсэгт алтны ханшийн түүхийн муруй.
class BalanceView extends StatefulWidget {
  const BalanceView({super.key, required this.uid});
  final String uid;

  @override
  State<BalanceView> createState() => _BalanceViewState();
}

class _BalanceViewState extends State<BalanceView>
    with AutomaticKeepAliveClientMixin {
  final currencyFormatter = NumberFormat();

  // ListView-д гүйлгэхэд карт устгагдаж дахин үүсэхээс сэргийлнэ
  @override
  bool get wantKeepAlive => true;

  // Таб солиход шинэ instance шууд өмнөх өгөгдлөө харуулна
  static UserModel? _lastUser;
  // Дэлхийн алтны бүх цаг үеийн муруй — нэг удаа тооцоод дахин ашиглана
  static final List<Offset> _chartPoints = goldHistoryPoints();
  static final List<MapEntry<String, double>> _chartMarkers = goldYearMarkers();

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return StreamBuilder<DocumentSnapshot>(
      stream: FirebaseFirestore.instance
          .collection('users')
          .doc(widget.uid)
          .snapshots(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          final cachedUser = _lastUser;
          if (cachedUser != null) {
            return _buildCard(context, cachedUser);
          }
          return const SizedBox(
            height: 210.0,
            child: Stack(children: [
              Positioned.fill(child: GoldCardBackground()),
              Center(child: CircularProgressIndicator(color: Colors.white)),
            ]),
          );
        }
        if (snapshot.hasError || !snapshot.hasData || !snapshot.data!.exists) {
          return SizedBox(
            height: 210.0,
            child: Stack(children: [
              const Positioned.fill(child: GoldCardBackground()),
              Center(
                child: Text(tr('home.balance_load_error'),
                    style: const TextStyle(color: Colors.white)),
              ),
            ]),
          );
        }
        final userData = snapshot.data!.data() as Map<String, dynamic>;
        final userModel = UserModel.fromMap(widget.uid, userData);
        _lastUser = userModel;
        return _buildCard(context, userModel);
      },
    );
  }

  Widget _buildCard(BuildContext context, UserModel user) {
    return SizedBox(
      height: 210.0,
      child: Stack(
        children: [
          // Алтан дэвсгэр — үлдэгдлийг картан дээр сийлж харуулна
          Positioned.fill(
            child: GoldCardBackground(
              engraveValue: '${user.balance.gold}',
              engraveUnit: tr('home.grams_unit'),
              chartPoints: _chartPoints,
              chartMarkers: _chartMarkers,
            ),
          ),
        ],
      ),
    );
  }
}
