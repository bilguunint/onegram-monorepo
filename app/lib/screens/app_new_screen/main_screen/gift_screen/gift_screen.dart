import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:onegrgold/repositories/user_repository.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/style/colors.dart';
import 'received_gift_orders_widget.dart';
import 'sent_gift_orders_widget.dart';

class GiftListScreen extends StatefulWidget {
  const GiftListScreen({
    super.key,
    required this.userRepository,
  });
  final UserRepository userRepository;

  @override
  State<GiftListScreen> createState() => _OrdersListScreenState();
}

class _OrdersListScreenState extends State<GiftListScreen> with SingleTickerProviderStateMixin{

  late TabController _tabController;
  late List<String> tabs = [
    tr('order.gift_received_tab'),
    tr('order.gift_sent_tab'),
  ];

  @override
  void initState() {
    // TODO: implement initState
    super.initState();
    _tabController = TabController(vsync: this, length: tabs.length);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(tr('order.gift')),
        centerTitle: false,
      ),
      body: Column(
        children: [
          TabBar(
              controller: _tabController,
              indicatorColor: CustomColors.mainColor,
              indicatorSize: TabBarIndicatorSize.tab,
              padding: const EdgeInsets.all(8.0),
              indicatorWeight: 3.0,
              unselectedLabelColor:
                  Colors.white38,
              labelColor: Colors.white,
              tabs: tabs.map((String tab) {
                return Container(
                    padding: const EdgeInsets.only(bottom: 10.0, top: 8.0),
                    child: Text(tab.toUpperCase(),
                        style: const TextStyle(
                            fontSize: 12.0, fontWeight: FontWeight.bold)));
              }).toList(),
            ),
            Expanded(
              child: TabBarView(controller: _tabController, children: [
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: const ReceivedGiftOrdersWidget(),
                ),
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: RepositoryProvider.value(
                    value: widget.userRepository,
                    child: SentGiftOrdersWidget(),
                  ),
                ),
              ]),
            ),
        ],
      ),
    );
  }
}