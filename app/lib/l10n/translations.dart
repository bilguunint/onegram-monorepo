import 'parts/auth_pin.dart';
import 'parts/center.dart';
import 'parts/common.dart';
import 'parts/home_misc.dart';
import 'parts/nav.dart';
import 'parts/orders.dart';
import 'parts/products_a.dart';
import 'parts/products_b.dart';
import 'parts/register_profile.dart';
import 'parts/server.dart';

/// Every UI string in the app, keyed by a dotted id and then by language code.
///
/// Split into feature files under `parts/` so translators can work on one area
/// without touching the rest. `common` is merged first, so a feature part can
/// deliberately override a shared string if it truly needs a different wording.
final Map<String, Map<String, String>> kTranslations = {
  ...kCommonTranslations,
  ...kNavTranslations,
  ...kAuthPinTranslations,
  ...kRegisterProfileTranslations,
  ...kProductsATranslations,
  ...kProductsBTranslations,
  ...kCenterTranslations,
  ...kOrdersTranslations,
  ...kHomeMiscTranslations,
  ...kServerTranslations,
};
