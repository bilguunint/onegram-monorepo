import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:onegrgold/elements/main_button.dart';
import 'package:onegrgold/models/make_order_model.dart';
import 'package:onegrgold/models/order_model.dart';
import 'package:onegrgold/repositories/user_repository.dart';
import 'package:onegrgold/style/colors.dart';
import 'package:url_launcher/url_launcher.dart';

class PaymentScreen extends StatefulWidget {
  const PaymentScreen(
      {super.key,
      required this.makeOrder,
      required this.order,
      required this.userRepository,
      required this.uid});
  final MakeOrder makeOrder;
  final OrderModel order;
  final UserRepository userRepository;
  final String uid;

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen>
    with SingleTickerProviderStateMixin {
  List<String> tabs = [
    "Банкны апп",
    "Шилжүүлэг",
  ];
  final currencyFormatter = NumberFormat();
  late TabController _tabController;

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
        title: const Text("Төлбөр төлөх"),
        centerTitle: false,
      ),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "Төлөх дүн:",
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(
                    height: 4.0,
                  ),
                  Text(
                    "${currencyFormatter.format(widget.order.amount)}₮",
                    style: TextStyle(
                        color: CustomColors.mainColor,
                        fontSize: 20.0,
                        fontFamily: "InterBold"),
                  ),
                ],
              ),
            ),
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
                  padding: const EdgeInsets.all(8.0),
                  child: GridView.builder(
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 3, // number of items in each row
                      mainAxisSpacing: 8.0, // spacing between rows
                      crossAxisSpacing: 8.0, // spacing between columns
                    ),
                    itemCount: widget.makeOrder.links.length,
                    itemBuilder: (context, index) {
                      return GestureDetector(
                        onTap: () {
                          final Uri url =
                              Uri.parse(widget.makeOrder.links[index].deeplink);
                          launchUrl(url);
                        },
                        child: Container(
                            padding: const EdgeInsets.all(8.0),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(8.0),
                              color:  CustomColors.darkContainerColor,
                            ), // color of grid items
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Container(
                                  height: 50.0,
                                  width: 50.0,
                                  decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(12.0),
                                      image: DecorationImage(
                                          fit: BoxFit.cover,
                                          image: NetworkImage(widget
                                              .makeOrder.links[index].logo))),
                                ),
                                const SizedBox(
                                  height: 12.0,
                                ),
                                Text(
                                  widget.makeOrder.links[index].description,
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 10.0),
                                )
                              ],
                            )),
                      );
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "Банк:",
                            style: TextStyle(
                                fontSize: 13.0,
                                color: Colors.white70),
                          ),
                          const SizedBox(
                            height: 5.0,
                          ),
                          Text(
                            "Хаан банк",
                            style: TextStyle(
                                fontSize: 14.0,
                                fontWeight: FontWeight.bold,
                                color:
                                    Colors.white),
                          ),
                        ],
                      ),
                      const SizedBox(
                        height: 16.0,
                      ),
                      Container(
                        width: MediaQuery.of(context).size.width,
                        height: 0.5,
                        color: Colors.white12,
                      ),
                      const SizedBox(
                        height: 16.0,
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                "Данс эзэмшигч:",
                                style: TextStyle(
                                    fontSize: 13.0,
                                    color: Colors.white70),
                              ),
                              const SizedBox(
                                height: 5.0,
                              ),
                              Text(
                                "УАН ГРАММ ГОУЛД СТОНЕ ХХК",
                                style: TextStyle(
                                    fontSize: 14.0,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white),
                              ),
                            ],
                          ),
                          GestureDetector(
                            onTap: () {
                              Clipboard.setData(
                                  ClipboardData(text: "УАН ГРАММ ГОУЛД СТОНЕ ХХК"));
                              ScaffoldMessenger.of(context)
                                ..hideCurrentSnackBar()
                                ..showSnackBar(
                                  SnackBar(
                                      backgroundColor:
                                          CustomColors.darkContainerColor,
                                      content: Text(
                                        '"УАН ГРАММ ГОУЛД СТОНЕ ХХК"  хуулагдлаа',
                                        style: TextStyle(color: Colors.white),
                                      )),
                                );
                            },
                            child: Container(
                              padding: const EdgeInsets.only(
                                  left: 15.0,
                                  right: 15.0,
                                  top: 6.0,
                                  bottom: 6.0),
                              decoration: BoxDecoration(
                                  color: CustomColors.mainColor,
                                  borderRadius: const BorderRadius.all(
                                      Radius.circular(10.0))),
                              child: Text(
                                "Хуулах".toUpperCase(),
                                style: TextStyle(
                                    color: Colors.black,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 10.0),
                              ),
                            ),
                          )
                        ],
                      ),
                      const SizedBox(
                        height: 16.0,
                      ),
                      Container(
                        width: MediaQuery.of(context).size.width,
                        height: 0.5,
                        color: Colors.white12,
                      ),
                      const SizedBox(
                        height: 16.0,
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                "Дансны дугаар:",
                                style: TextStyle(
                                    fontSize: 13.0,
                                    color: Colors.white70),
                              ),
                              const SizedBox(
                                height: 5.0,
                              ),
                              Text(
                                "190005005926653395",
                                style: TextStyle(
                                    fontSize: 14.0,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white),
                              ),
                            ],
                          ),
                          GestureDetector(
                            onTap: () {
                              Clipboard.setData(
                                  ClipboardData(text: "190005005926653395"));
                              ScaffoldMessenger.of(context)
                                ..hideCurrentSnackBar()
                                ..showSnackBar(
                                  SnackBar(
                                      backgroundColor:
                                          CustomColors.darkContainerColor,
                                      content: Text(
                                        '"190005005926653395"  хуулагдлаа',
                                        style: TextStyle(color: Colors.white),
                                      )),
                                );
                            },
                            child: Container(
                              padding: const EdgeInsets.only(
                                  left: 15.0,
                                  right: 15.0,
                                  top: 6.0,
                                  bottom: 6.0),
                              decoration: BoxDecoration(
                                  color: CustomColors.mainColor,
                                  borderRadius: const BorderRadius.all(
                                      Radius.circular(10.0))),
                              child: Text(
                                "Хуулах".toUpperCase(),
                                style: TextStyle(
                                    color: Colors.black,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 10.0),
                              ),
                            ),
                          )
                        ],
                      ),
                      const SizedBox(
                        height: 16.0,
                      ),
                      Container(
                        width: MediaQuery.of(context).size.width,
                        height: 0.5,
                        color: Colors.white12,
                      ),
                      const SizedBox(
                        height: 16.0,
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                "Гүйлгээний утга:",
                                style: TextStyle(
                                    fontSize: 13.0,
                                    color: Colors.white70),
                              ),
                              const SizedBox(
                                height: 5.0,
                              ),
                              Text(
                                widget.order.client!.phone.isNotEmpty
                                    ? "${widget.order.client!.phone}-${widget.order.quantity}"
                                    : "${widget.order.client!.email}-${widget.order.quantity}",
                                style: TextStyle(
                                    fontSize: 14.0,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white),
                              ),
                            ],
                          ),
                          GestureDetector(
                            onTap: () {
                              final transactionText = widget.order.client!.phone.isNotEmpty
                                  ? "${widget.order.client!.phone}-${widget.order.quantity}"
                                  : "${widget.order.client!.email}-${widget.order.quantity}";
                              
                              Clipboard.setData(ClipboardData(text: transactionText));
                              ScaffoldMessenger.of(context)
                                ..hideCurrentSnackBar()
                                ..showSnackBar(
                                  SnackBar(
                                      backgroundColor:
                                          CustomColors.darkContainerColor,
                                      content: Text(
                                        '"$transactionText"  хуулагдлаа',
                                        style: TextStyle(color: Colors.white),
                                      )),
                                );
                            },
                            child: Container(
                              padding: const EdgeInsets.only(
                                  left: 15.0,
                                  right: 15.0,
                                  top: 6.0,
                                  bottom: 6.0),
                              decoration: BoxDecoration(
                                  color: CustomColors.mainColor,
                                  borderRadius: const BorderRadius.all(
                                      Radius.circular(10.0))),
                              child: Text(
                                "Хуулах".toUpperCase(),
                                style: TextStyle(
                                    color: Colors.black,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 10.0),
                              ),
                            ),
                          )
                        ],
                      ),
                      const SizedBox(
                        height: 16.0,
                      ),
                      Container(
                        width: MediaQuery.of(context).size.width,
                        height: 0.5,
                        color: Colors.white12,
                      ),
                      const SizedBox(
                        height: 16.0,
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                "Нийт дүн:",
                                style: TextStyle(
                                    fontSize: 13.0,
                                    color: Colors.white70),
                              ),
                              const SizedBox(
                                height: 5.0,
                              ),
                              Text(
                                "${currencyFormatter.format(widget.order.amount.toInt())}₮",
                                style: TextStyle(
                                    fontSize: 14.0,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white),
                              ),
                            ],
                          ),
                          GestureDetector(
                            onTap: () {
                              Clipboard.setData(ClipboardData(
                                  text: currencyFormatter.format(
                                      widget.order.amount.toInt())));
                              ScaffoldMessenger.of(context)
                                ..hideCurrentSnackBar()
                                ..showSnackBar(
                                  SnackBar(
                                      backgroundColor:
                                          CustomColors.darkContainerColor,
                                      content: Text(
                                        '"${currencyFormatter.format(widget.order.amount.toInt())}"  хуулагдлаа',
                                        style: const TextStyle(
                                            color: Colors.white),
                                      )),
                                );
                            },
                            child: Container(
                              padding: const EdgeInsets.only(
                                  left: 15.0,
                                  right: 15.0,
                                  top: 6.0,
                                  bottom: 6.0),
                              decoration: BoxDecoration(
                                  color: CustomColors.mainColor,
                                  borderRadius: const BorderRadius.all(
                                      Radius.circular(10.0))),
                              child: Text(
                                "Хуулах".toUpperCase(),
                                style: const TextStyle(
                                    color: Colors.black,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 10.0),
                              ),
                            ),
                          )
                        ],
                      ),
                      const SizedBox(
                        height: 8.0,
                      ),
                      Container(
                        width: MediaQuery.of(context).size.width,
                        height: 0.5,
                        color: Colors.white12,
                      ),
                      const SizedBox(
                        height: 8.0,
                      ),
                    ],
                  ),
                )
              ]),
            ),
            Padding(
              padding: const EdgeInsets.only(
                  left: 32.0, right: 32.0, top: 8.0, bottom: 8.0),
              child: Row(
                children: [
                  Expanded(
                    child: MainButton(
                        title: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              "Болсон",
                              style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black),
                            ),
                          ],
                        ),
                        onPress: () {
                          Navigator.pop(context);
                        },
                        isLoading: false),
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