import 'dart:async';
import 'dart:math' as math;

import 'package:sensors_plus/sensors_plus.dart';

/// Утасны хазайлт, хөдөлгөөний эрчмийг нэг газар уншиж олон widget-д хуваалцана.
/// Хазайлт = хүндийн хүчний одоогийн чиглэл − аажим дасан зохицдог суурь чиглэл,
/// тиймээс утсыг яаж ч барьсан хөдөлгөхөд хариу үйлдэл үзүүлж, тогтоход голдоо буцна.
class TiltController {
  TiltController._();
  static final TiltController instance = TiltController._();

  StreamSubscription<AccelerometerEvent>? _accSub;
  StreamSubscription<GyroscopeEvent>? _gyroSub;
  int _listeners = 0;

  double _bx = 0.0, _by = 0.0, _bz = 0.0;
  bool _baseInit = false;

  /// Зорилтот утгууд (-1..1); widget бүр өөрөө зөөлрүүлж ашиглана
  double targetX = 0.0;
  double targetY = 0.0;
  double motionTarget = 0.0;

  void acquire() {
    _listeners++;
    if (_listeners > 1) return;
    try {
      _accSub = accelerometerEventStream(
        samplingPeriod: const Duration(milliseconds: 40),
      ).listen((e) {
        final double len = math.sqrt(e.x * e.x + e.y * e.y + e.z * e.z);
        if (len < 0.1) return;
        final double gx = e.x / len, gy = e.y / len, gz = e.z / len;
        if (!_baseInit) {
          _bx = gx;
          _by = gy;
          _bz = gz;
          _baseInit = true;
        } else {
          _bx += (gx - _bx) * 0.016;
          _by += (gy - _by) * 0.016;
          _bz += (gz - _bz) * 0.016;
        }
        double rawX = (gx - _bx) * 1.7;
        double rawY = ((gz - _bz) - (gy - _by)) * 1.2;
        const double dead = 0.035;
        rawX = rawX.abs() < dead ? 0.0 : rawX - dead * rawX.sign;
        rawY = rawY.abs() < dead ? 0.0 : rawY - dead * rawY.sign;
        targetX = rawX.clamp(-1.0, 1.0);
        targetY = rawY.clamp(-1.0, 1.0);
      }, onError: (_) {});
      _gyroSub = gyroscopeEventStream(
        samplingPeriod: const Duration(milliseconds: 40),
      ).listen((g) {
        final double rate = math.sqrt(g.x * g.x + g.y * g.y + g.z * g.z);
        motionTarget = ((rate - 0.25) / 3.5).clamp(0.0, 1.0);
      }, onError: (_) {});
    } catch (_) {}
  }

  void release() {
    _listeners = math.max(0, _listeners - 1);
    if (_listeners > 0) return;
    _accSub?.cancel();
    _gyroSub?.cancel();
    _accSub = null;
    _gyroSub = null;
  }
}
