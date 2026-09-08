import 'dart:convert';
import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:path_provider/path_provider.dart';

class RatePoint {
  const RatePoint(this.date, this.rate);
  final DateTime date;
  final double rate;
}

/// Алтны ханшийн бүх түүхийг утасны файлд кэшилж, Firestore-оос зөвхөн
/// сүүлийн кэшилсэн огнооноос хойшхи шинэ бичлэгүүдийг л татдаг.
class RateHistoryCache {
  static const Duration _refreshInterval = Duration(hours: 6);
  static final Map<int, List<RatePoint>> _memory = {};
  static final Map<int, DateTime> _lastRefresh = {};

  static Future<List<RatePoint>> load({int metalId = 1}) async {
    final mem = _memory[metalId];
    final last = _lastRefresh[metalId];
    if (mem != null &&
        last != null &&
        DateTime.now().difference(last) < _refreshInterval) {
      return mem;
    }

    List<RatePoint> points = mem ?? await _readFile(metalId);
    DateTime? updated = last ?? await _readUpdated(metalId);

    final bool stale = updated == null ||
        DateTime.now().difference(updated) >= _refreshInterval;
    if (points.isEmpty || stale) {
      try {
        final fresh = await _fetch(metalId,
            after: points.isEmpty ? null : points.last.date);
        if (fresh.isNotEmpty) {
          points = [...points, ...fresh];
        }
        updated = DateTime.now();
        await _writeFile(metalId, points, updated);
      } catch (_) {
        // Сүлжээгүй үед кэштэйгээ үлдэнэ
      }
    }

    _memory[metalId] = points;
    _lastRefresh[metalId] = updated ?? DateTime.now();
    return points;
  }

  static Future<List<RatePoint>> _fetch(int metalId, {DateTime? after}) async {
    Query<Map<String, dynamic>> q = FirebaseFirestore.instance
        .collection('rates')
        .where('id', isEqualTo: metalId);
    if (after != null) {
      q = q.where('date', isGreaterThan: Timestamp.fromDate(after));
    }
    final snap = await q.orderBy('date').get();
    final out = <RatePoint>[];
    for (final d in snap.docs) {
      final data = d.data();
      final DateTime? dt = _toDate(data['date']);
      final double rate = (data['rate'] as num?)?.toDouble() ?? 0.0;
      if (dt == null || rate <= 0) continue;
      out.add(RatePoint(dt, rate));
    }
    return out;
  }

  static DateTime? _toDate(dynamic v) {
    if (v is Timestamp) return v.toDate();
    if (v is int) return DateTime.fromMillisecondsSinceEpoch(v);
    if (v is String && v.isNotEmpty) return DateTime.tryParse(v);
    return null;
  }

  static Future<File> _file(int metalId) async {
    final dir = await getApplicationDocumentsDirectory();
    return File('${dir.path}/rate_history_v2_$metalId.json');
  }

  static Future<List<RatePoint>> _readFile(int metalId) async {
    try {
      final f = await _file(metalId);
      if (!await f.exists()) return [];
      final map = jsonDecode(await f.readAsString()) as Map<String, dynamic>;
      final list = (map['points'] as List).cast<List>();
      return list
          .map((e) => RatePoint(
              DateTime.fromMillisecondsSinceEpoch(e[0] as int),
              (e[1] as num).toDouble()))
          .toList();
    } catch (_) {
      return [];
    }
  }

  static Future<DateTime?> _readUpdated(int metalId) async {
    try {
      final f = await _file(metalId);
      if (!await f.exists()) return null;
      final map = jsonDecode(await f.readAsString()) as Map<String, dynamic>;
      final ms = map['updated'] as int?;
      return ms == null ? null : DateTime.fromMillisecondsSinceEpoch(ms);
    } catch (_) {
      return null;
    }
  }

  static Future<void> _writeFile(
      int metalId, List<RatePoint> points, DateTime updated) async {
    try {
      final f = await _file(metalId);
      await f.writeAsString(jsonEncode({
        'updated': updated.millisecondsSinceEpoch,
        'points':
            points.map((p) => [p.date.millisecondsSinceEpoch, p.rate]).toList(),
      }));
    } catch (_) {}
  }
}
