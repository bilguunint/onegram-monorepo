import 'package:flutter/material.dart';
import 'package:ionicons/ionicons.dart';
import 'package:onegrgold/elements/gold_waves_background.dart';

/// Туршилтын дэлгэц: crypto wallet маягийн шинэ home дизайны прототип.
/// Бүх дата demo — бодит холболтгүй.
class HomeScreenTest extends StatelessWidget {
  const HomeScreenTest({super.key});

  // Дизайны локал өнгөнүүд (accent-ийг CustomColors.accent болгож сольж болно)
  static const Color _accent = Color(0xFFF6B800);
  static const Color _bg = Color(0xFF0A0A0A);
  static const Color _surface = Color(0xFF1A1A1A);
  static const Color _surfaceDeep = Color(0xFF141414);
  static const Color _border = Color(0x14FFFFFF);
  static const Color _textMuted = Color(0xFF9CA1A8);
  static const Color _green = Color(0xFF34C77B);
  static const Color _red = Color(0xFFF0524D);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment(0.0, -0.2),
            colors: [Color(0xFF3A2C05), _bg],
          ),
        ),
        child: SafeArea(
          bottom: false,
          child: Column(
            children: [
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  children: [
                    const SizedBox(height: 8.0),
                    _header(),
                    const SizedBox(height: 20.0),
                    _title(),
                    const SizedBox(height: 16.0),
                    _balanceCard(),
                    const SizedBox(height: 16.0),
                    _actionsRow(),
                    const SizedBox(height: 24.0),
                    _sectionTitle(),
                    const SizedBox(height: 12.0),
                    ..._coinRows(),
                    const SizedBox(height: 90.0),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: _bottomBar(),
    );
  }

  // ---------------------------------------------------------------- header
  Widget _header() {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 8.0),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.08),
            borderRadius: BorderRadius.circular(24.0),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                width: 44.0,
                height: 22.0,
                child: Stack(
                  children: [
                    _miniCoin(0, const Color(0xFF2BB673), Ionicons.logo_usd),
                    _miniCoin(11, const Color(0xFF4A90D9), Icons.diamond),
                    _miniCoin(
                        22, const Color(0xFFF7931A), Ionicons.logo_bitcoin),
                  ],
                ),
              ),
              const SizedBox(width: 8.0),
              const Text(
                "All Account",
                style: TextStyle(
                  fontFamily: "InterBold",
                  fontSize: 13.0,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
              const SizedBox(width: 4.0),
              const Icon(Ionicons.chevron_down,
                  size: 14.0, color: Colors.white70),
            ],
          ),
        ),
        const Spacer(),
        _circleButton(
            const Icon(Ionicons.search, size: 18.0, color: Colors.white)),
        const SizedBox(width: 10.0),
        CircleAvatar(
          radius: 20.0,
          backgroundColor: _accent.withOpacity(0.25),
          child: const Text(
            "Б",
            style: TextStyle(
              fontFamily: "InterBold",
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
        ),
      ],
    );
  }

  Widget _miniCoin(double left, Color color, IconData icon) {
    return Positioned(
      left: left,
      child: Container(
        width: 22.0,
        height: 22.0,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: color,
          border: Border.all(width: 1.5, color: const Color(0xFF2B230B)),
        ),
        child: Icon(icon, size: 11.0, color: Colors.white),
      ),
    );
  }

  Widget _circleButton(Widget child) {
    return Container(
      width: 40.0,
      height: 40.0,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: Colors.white.withOpacity(0.08),
      ),
      child: Center(child: child),
    );
  }

  // ----------------------------------------------------------------- title
  Widget _title() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "Wallet Coins... !",
          style: TextStyle(
            fontFamily: "InterBold",
            fontSize: 30.0,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 4.0),
        Row(
          children: const [
            Text(
              "(wallet-xyz-1234-abcd-5678-efgh)",
              style: TextStyle(
                fontFamily: "Inter",
                fontSize: 12.0,
                color: _textMuted,
              ),
            ),
            SizedBox(width: 6.0),
            Icon(Ionicons.copy_outline, size: 13.0, color: _textMuted),
          ],
        ),
      ],
    );
  }

  // ---------------------------------------------------------- balance card
  Widget _balanceCard() {
    return Container(
      height: 190.0,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24.0),
        border: Border.all(width: 1.0, color: _border),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24.0),
        child: Stack(
          children: [
            const Positioned.fill(child: GoldWavesBackground()),
            // Баруун талын давхарласан coin картууд
            Positioned(right: -6.0, top: 44.0, child: _stackCard(0)),
            Positioned(right: 2.0, top: 68.0, child: _stackCard(1)),
            Positioned(right: 10.0, top: 92.0, child: _stackCard(2)),
            Padding(
              padding: const EdgeInsets.all(18.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      const Text.rich(
                        TextSpan(
                          children: [
                            TextSpan(
                              text: "\$8,000",
                              style: TextStyle(fontSize: 32.0),
                            ),
                            TextSpan(
                              text: ".00",
                              style: TextStyle(
                                  fontSize: 20.0, color: Colors.white70),
                            ),
                          ],
                        ),
                        style: TextStyle(
                          fontFamily: "InterBold",
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(width: 10.0),
                      Container(
                        margin: const EdgeInsets.only(bottom: 6.0),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8.0, vertical: 3.0),
                        decoration: BoxDecoration(
                          color: _green,
                          borderRadius: BorderRadius.circular(12.0),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: const [
                            Icon(Ionicons.trending_up,
                                size: 11.0, color: Colors.black),
                            SizedBox(width: 3.0),
                            Text(
                              "+2.50",
                              style: TextStyle(
                                fontFamily: "InterBold",
                                fontSize: 11.0,
                                fontWeight: FontWeight.bold,
                                color: Colors.black,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4.0),
                  const Text.rich(
                    TextSpan(
                      children: [
                        TextSpan(text: "Today "),
                        TextSpan(
                          text: "+10.50%",
                          style: TextStyle(color: _green),
                        ),
                      ],
                    ),
                    style: TextStyle(
                      fontFamily: "Inter",
                      fontSize: 13.0,
                      color: _textMuted,
                    ),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 20.0, vertical: 10.0),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24.0),
                    ),
                    child: const Text(
                      "View More",
                      style: TextStyle(
                        fontFamily: "InterBold",
                        fontSize: 13.0,
                        fontWeight: FontWeight.bold,
                        color: Colors.black,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _stackCard(int depth) {
    final bool front = depth == 2;
    return Container(
      width: 168.0 - depth * 8.0,
      height: 44.0,
      padding: const EdgeInsets.symmetric(horizontal: 12.0),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14.0),
        border: Border.all(width: 1.0, color: _border),
        gradient: front
            ? const LinearGradient(
                colors: [Color(0xFFF6B800), Color(0xFFFFD34D)])
            : LinearGradient(colors: [
                const Color(0xFF2A2415).withOpacity(0.9),
                const Color(0xFF1E1A0F).withOpacity(0.9),
              ]),
      ),
      child: Row(
        children: [
          Container(
            width: 24.0,
            height: 24.0,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: front ? Colors.white : const Color(0xFF4A90D9),
            ),
            child: Icon(
              Icons.diamond,
              size: 13.0,
              color: front ? _accent : Colors.white,
            ),
          ),
          const SizedBox(width: 8.0),
          Text(
            "Ethereum",
            style: TextStyle(
              fontFamily: "InterBold",
              fontSize: 13.0,
              fontWeight: FontWeight.w600,
              color: front ? Colors.black : Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  // ------------------------------------------------------------ureactions
  Widget _actionsRow() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        _actionTile(Ionicons.add, "Add", filled: true),
        _actionTile(Ionicons.arrow_up_circle_outline, "Send"),
        _actionTile(Ionicons.arrow_down_circle_outline, "Receive"),
        _actionTile(Ionicons.swap_horizontal, "Swap"),
      ],
    );
  }

  Widget _actionTile(IconData icon, String label, {bool filled = false}) {
    return Container(
      width: 80.0,
      height: 88.0,
      decoration: BoxDecoration(
        color: _surface,
        borderRadius: BorderRadius.circular(20.0),
        border: Border.all(width: 1.0, color: _border),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 40.0,
            height: 40.0,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: filled ? _accent : Colors.transparent,
              border:
                  filled ? null : Border.all(width: 1.2, color: Colors.white54),
            ),
            child: Icon(icon,
                size: 20.0, color: filled ? Colors.black : Colors.white),
          ),
          const SizedBox(height: 8.0),
          Text(
            label,
            style: const TextStyle(
              fontFamily: "Inter",
              fontSize: 12.0,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------- coin section
  Widget _sectionTitle() {
    return const Text.rich(
      TextSpan(
        children: [
          TextSpan(text: "Your entire "),
          TextSpan(
            text: "coin stash!",
            style:
                TextStyle(fontFamily: "InterBold", fontWeight: FontWeight.bold),
          ),
        ],
      ),
      style: TextStyle(
        fontFamily: "Inter",
        fontSize: 20.0,
        color: Colors.white,
      ),
    );
  }

  List<Widget> _coinRows() {
    final coins = [
      _CoinData(
          "Ethereum",
          "0.004 ETH",
          "\$16.22",
          -4.36,
          const Color(0xFF4A90D9),
          Icons.diamond,
          const [3, 5, 4, 6, 5, 7, 4, 3, 5, 2]),
      _CoinData(
          "Bitcoin",
          "0.001 BTC",
          "\$78,548",
          4.79,
          const Color(0xFFF7931A),
          Ionicons.logo_bitcoin,
          const [2, 3, 5, 4, 6, 5, 7, 6, 8, 9]),
      _CoinData(
          "Solana",
          "1.204 SOL",
          "\$104.48",
          1.29,
          const Color(0xFF2BB673),
          Ionicons.logo_usd,
          const [4, 5, 3, 6, 4, 7, 5, 6, 7, 8]),
      _CoinData(
          "Dogecoin",
          "320.5 DOGE",
          "\$0.10",
          -3.58,
          const Color(0xFFC9A93B),
          Ionicons.logo_bitcoin,
          const [6, 5, 7, 4, 5, 3, 4, 2, 3, 2]),
    ];
    return coins
        .map((c) => Padding(
              padding: const EdgeInsets.only(bottom: 10.0),
              child: _coinRow(c),
            ))
        .toList();
  }

  Widget _coinRow(_CoinData c) {
    final bool isDown = c.changePercent < 0;
    return Container(
      padding: const EdgeInsets.all(14.0),
      decoration: BoxDecoration(
        color: _surfaceDeep,
        borderRadius: BorderRadius.circular(18.0),
        border: Border.all(width: 1.0, color: _border),
      ),
      child: Row(
        children: [
          Container(
            width: 42.0,
            height: 42.0,
            decoration: BoxDecoration(shape: BoxShape.circle, color: c.color),
            child: Icon(c.icon, size: 20.0, color: Colors.white),
          ),
          const SizedBox(width: 12.0),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                c.name,
                style: const TextStyle(
                  fontFamily: "InterBold",
                  fontSize: 14.0,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 3.0),
              Text(
                c.holding,
                style: const TextStyle(
                  fontFamily: "Inter",
                  fontSize: 12.0,
                  color: _textMuted,
                ),
              ),
            ],
          ),
          const Spacer(),
          SizedBox(
            width: 70.0,
            height: 28.0,
            child: CustomPaint(
              painter: _SparklinePainter(
                c.spark,
                isDown ? _red : _green,
              ),
            ),
          ),
          const SizedBox(width: 14.0),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                c.price,
                style: const TextStyle(
                  fontFamily: "InterBold",
                  fontSize: 14.0,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 3.0),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    isDown
                        ? Ionicons.arrow_down_outline
                        : Ionicons.arrow_up_outline,
                    size: 10.0,
                    color: isDown ? _red : _green,
                  ),
                  const SizedBox(width: 2.0),
                  Text(
                    "${c.changePercent.abs().toStringAsFixed(2)} %",
                    style: TextStyle(
                      fontFamily: "Inter",
                      fontSize: 11.0,
                      color: isDown ? _red : _green,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ------------------------------------------------------------ bottom bar
  Widget _bottomBar() {
    return Container(
      height: 82.0,
      decoration: const BoxDecoration(
        color: Color(0xFF111111),
        border: Border(top: BorderSide(width: 1.0, color: _border)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _navItem(Ionicons.home, "Home", active: true),
          _navItem(Ionicons.heart_outline, "Wishlist"),
          Container(
            width: 52.0,
            height: 52.0,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: _accent,
            ),
            child: const Icon(Ionicons.sync_outline,
                size: 24.0, color: Colors.black),
          ),
          _navItem(Ionicons.briefcase_outline, "Portfolio"),
          _navItem(Ionicons.settings_outline, "Settings"),
        ],
      ),
    );
  }

  Widget _navItem(IconData icon, String label, {bool active = false}) {
    final Color color = active ? Colors.white : _textMuted;
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(icon, size: 20.0, color: color),
        const SizedBox(height: 4.0),
        Text(
          label,
          style: TextStyle(fontFamily: "Inter", fontSize: 10.0, color: color),
        ),
      ],
    );
  }
}

class _CoinData {
  const _CoinData(this.name, this.holding, this.price, this.changePercent,
      this.color, this.icon, this.spark);

  final String name;
  final String holding;
  final String price;
  final double changePercent;
  final Color color;
  final IconData icon;
  final List<int> spark;
}

class _SparklinePainter extends CustomPainter {
  _SparklinePainter(this.values, this.color);

  final List<int> values;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.6
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final int maxV = values.reduce((a, b) => a > b ? a : b);
    final int minV = values.reduce((a, b) => a < b ? a : b);
    final double range = (maxV - minV).toDouble().clamp(1.0, double.infinity);

    final path = Path();
    for (int i = 0; i < values.length; i++) {
      final double x = size.width * i / (values.length - 1);
      final double y = size.height - (values[i] - minV) / range * size.height;
      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(_SparklinePainter oldDelegate) =>
      oldDelegate.values != values || oldDelegate.color != color;
}
