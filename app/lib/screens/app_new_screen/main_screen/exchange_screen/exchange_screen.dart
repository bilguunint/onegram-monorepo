import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:ionicons/ionicons.dart';
import 'package:mrx_charts/mrx_charts.dart';
import 'package:onegrgold/screens/app_new_screen/main_screen/exchange_screen/latest_exchange_rate.dart';
import 'package:onegrgold/style/colors.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class ExchangeScreen extends StatefulWidget {
  const ExchangeScreen(
      {super.key,
      required this.userRepository,
      required this.metalId});
  final dynamic userRepository;
  final int metalId;

  @override
  State<ExchangeScreen> createState() => _ExchangeScreenState();
}

class _ExchangeScreenState extends State<ExchangeScreen> {
  @override
  Widget build(BuildContext context) {
    return DetailView(
      userRepository: widget.userRepository,
      metalId: widget.metalId,
    );
  }
}

class DetailView extends StatefulWidget {
  const DetailView({super.key, required this.userRepository, required this.metalId});
  final dynamic userRepository; // not used but kept for compatibility
  final int metalId;

  @override
  State<DetailView> createState() => _DetailViewState();
}

class _DetailViewState extends State<DetailView> {
  DateTime _toDate(dynamic v) {
    try {
      if (v is Timestamp) return v.toDate();
      if (v is int) return DateTime.fromMillisecondsSinceEpoch(v);
      if (v is String && v.isNotEmpty) {
        final parsed = DateTime.tryParse(v);
        if (parsed != null) return parsed;
      }
    } catch (_) {}
    return DateTime.fromMillisecondsSinceEpoch(0);
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormatter = NumberFormat();

    return Scaffold(
      appBar: AppBar(
        title: Text("Ханшийн мэдээлэл"),
        centerTitle: false,
      ),
      body: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
        stream: FirebaseFirestore.instance
            .collection('rates')
            .where('id', isEqualTo: widget.metalId)
            .orderBy('date', descending: false)
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CupertinoActivityIndicator());
          }
          if (snapshot.hasError) {
            print(snapshot.error);
            return const Center(
              child: Text(
                'Ханшийн мэдээллийг харахад алдаа гарлаа!',
                style: TextStyle(color: Colors.black),
              ),
            );
          }
          final docs = snapshot.data?.docs ?? [];
          if (docs.isEmpty) {
            return const Center(
              child: Text(
                'Мэдээлэл олдсонгүй',
                style: TextStyle(color: Colors.white70),
              ),
            );
          }
      
          // Map docs -> points
          final points = <Map<String, dynamic>>[]; // {rate: double, date: DateTime, change: double}
          double? prev;
          for (final d in docs) {
            final data = d.data();
            final rate = (data['rate'] as num?)?.toDouble() ?? 0.0;
            final dt = _toDate(data['date']);
            double change = 0.0;
            if (prev != null && prev > 0) {
              change = ((rate - prev) / prev) * 100.0;
            }
            points.add({'rate': rate, 'date': dt, 'change': change});
            prev = rate;
          }
      
          final spots = points
              .map((e) => ChartLineDataItem(
                    value: (e['rate'] as double) / 1000.0,
                    x: (e['date'] as DateTime).millisecondsSinceEpoch.toDouble(),
                  ))
              .toList();
      
          final from = (points.first['date'] as DateTime);
          final to = (points.last['date'] as DateTime);
      
          return ListView(
            children: [
              LatestExchangeRate(
                metalId: widget.metalId,
                userRepository: widget.userRepository,
              ),
              const Padding(
                padding: EdgeInsets.only(left: 16.0, right: 16.0, bottom: 16.0),
                child: Text(
                  'График',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(left: 16.0, right: 16.0),
                child: Container(
                  height: 250.0,
                  padding: const EdgeInsets.only(bottom: 16.0, left: 16.0, top: 16.0),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16.0),
                    color: CustomColors.darkContainerColor,
                  ),
                  child: Chart(
                    layers: layers(from, to, spots),
                    padding: const EdgeInsets.symmetric(horizontal: 30.0).copyWith(
                      bottom: 12.0,
                    ),
                  ),
                ),
              ),
              const Padding(
                padding: EdgeInsets.all(16.0),
                child: Text(
                  'Өдөр, өдрөөр',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              Column(
                children: points.reversed.map((e) {
                  final rate = e['rate'] as double;
                  final dt = e['date'] as DateTime;
                  final change = e['change'] as double;
                  return Padding(
                    padding: const EdgeInsets.only(left: 16.0, right: 16.0, bottom: 8.0),
                    child: Container(
                      padding: const EdgeInsets.all(10.0),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(8.0),
                        color: CustomColors.darkContainerColor,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                "${currencyFormatter.format(rate)}₮",
                                style: const TextStyle(
                                  fontSize: 14.0,
                                  fontFamily: 'InterBold',
                                ),
                              ),
                              const SizedBox(height: 4.0),
                              Text(
                                DateFormat('yyyy-MM-dd').format(dt),
                                style: const TextStyle(fontSize: 12.0, color: Colors.white24),
                              ),
                            ],
                          ),
                          Row(
                            children: [
                              Text(
                                "${change.toStringAsFixed(2)}%",
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: change.isNegative ? CustomColors.alerRed : CustomColors.successGreen,
                                  fontSize: 12.0,
                                ),
                              ),
                              const SizedBox(width: 4.0),
                              Container(
                                padding: const EdgeInsets.all(0.0),
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(4.0),
                                  color: change.isNegative ? CustomColors.alerRed : CustomColors.successGreen,
                                ),
                                child: Icon(
                                  change.isNegative ? Ionicons.caret_down : Ionicons.caret_up,
                                  color: Colors.white,
                                  size: 18.0,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          );
        },
      ),
    );
  }

  List<ChartLayer> layers(
      DateTime from, DateTime to, List<ChartLineDataItem> items) {
    final frequency =
        (to.millisecondsSinceEpoch - from.millisecondsSinceEpoch) / 5.0;
    final currencyFormatter = NumberFormat();
    return [
      ChartHighlightLayer(
        shape: () => ChartHighlightLineShape<ChartLineDataItem>(
          backgroundColor: Colors.transparent,
          currentPos: (item) => item.currentValuePos,
          radius: const BorderRadius.all(Radius.circular(8.0)),
          width: 60.0,
        ),
      ),
      ChartAxisLayer(
        settings: ChartAxisSettings(
          x: ChartAxisSettingsAxis(
            frequency: frequency,
            max: to.millisecondsSinceEpoch.toDouble(),
            min: from.millisecondsSinceEpoch.toDouble(),
            textStyle: TextStyle(
                color: Colors.white.withOpacity(0.6),
                fontSize: 9.0,
                fontWeight: FontWeight.bold),
          ),
          y: ChartAxisSettingsAxis(
            frequency: 50.0,
            max: widget.metalId == 1 ? 750.0 : 4.0,
            min: widget.metalId == 1 ? 350.0 : 1.0,
            textStyle: TextStyle(
                color: Colors.white.withOpacity(0.6),
                fontSize: 10.0,
                fontWeight: FontWeight.bold),
          ),
        ),
        labelX: (value) => DateFormat('yyyy/M')
            .format(DateTime.fromMillisecondsSinceEpoch(value.toInt())),
        labelY: (value) => value.toInt().toString() + "K",
      ),
      ChartLineLayer(
        items: items,
        settings: ChartLineSettings(
          color: widget.metalId == 1 ? CustomColors.mainColor : CustomColors.mainSilver,
          thickness: 3.0,
        ),
      ),
      ChartTooltipLayer(
        shape: () => ChartTooltipLineShape<ChartLineDataItem>(
          backgroundColor: Colors.white,
          circleBackgroundColor: Colors.white,
          circleBorderColor: Colors.transparent,
          circleSize: 4.0,
          circleBorderThickness: 2.0,
          currentPos: (item) => item.currentValuePos,
          onTextValue: (item) =>
              '${currencyFormatter.format(item.value * 1000).toString()}₮',
          marginBottom: 6.0,
          padding: const EdgeInsets.symmetric(
            horizontal: 12.0,
            vertical: 8.0,
          ),
          radius: 16.0,
          textStyle: const TextStyle(
              color: Colors.black,
              letterSpacing: 0.2,
              fontSize: 10.0,
              fontWeight: FontWeight.bold),
        ),
      ),
    ];
  }
}