import 'package:flutter/foundation.dart';
import 'package:onegrgold/models/center_models.dart';

class CenterCartLine {
  final CenterProductItem product;
  int qty;
  CenterCartLine(this.product, this.qty);
  int get lineTotal => product.price * qty;
}

/// Ephemeral in-memory cart for the donation campaign. A singleton because the
/// cart spans several pushed routes (detail → cart → payment); cleared after a
/// confirmed purchase.
class CenterCart extends ChangeNotifier {
  CenterCart._();
  static final CenterCart instance = CenterCart._();

  final Map<String, CenterCartLine> _lines = {};

  List<CenterCartLine> get lines => _lines.values.toList();
  bool get isEmpty => _lines.isEmpty;
  int get count => _lines.values.fold(0, (s, l) => s + l.qty);
  int get total => _lines.values.fold(0, (s, l) => s + l.lineTotal);
  int qtyOf(String id) => _lines[id]?.qty ?? 0;

  void add(CenterProductItem p, [int qty = 1]) {
    final line = _lines[p.id];
    if (line == null) {
      _lines[p.id] = CenterCartLine(p, qty);
    } else {
      line.qty += qty;
    }
    notifyListeners();
  }

  void setQty(String id, int qty) {
    if (qty <= 0) {
      _lines.remove(id);
    } else {
      final line = _lines[id];
      if (line != null) line.qty = qty;
    }
    notifyListeners();
  }

  void remove(String id) {
    _lines.remove(id);
    notifyListeners();
  }

  void clear() {
    _lines.clear();
    notifyListeners();
  }

  List<Map<String, dynamic>> toRequestItems() => _lines.values
      .map((l) => {'product_id': l.product.id, 'qty': l.qty})
      .toList();
}
