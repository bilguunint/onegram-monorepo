import 'dart:async';

import 'package:flutter/widgets.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'translations.dart';

/// UI languages the app ships with. `mn` is both the default and the fallback
/// for any key a translator hasn't filled in yet.
enum AppLanguage { mn, en, zh, ru }

extension AppLanguageInfo on AppLanguage {
  /// Key used in [kTranslations] and in secure storage.
  String get code => name;

  Locale get locale {
    switch (this) {
      case AppLanguage.mn:
        return const Locale('mn');
      case AppLanguage.en:
        return const Locale('en');
      case AppLanguage.zh:
        return const Locale('zh');
      case AppLanguage.ru:
        return const Locale('ru');
    }
  }

  /// Language name written in that language — never translated.
  String get label {
    switch (this) {
      case AppLanguage.mn:
        return 'Монгол';
      case AppLanguage.en:
        return 'English';
      case AppLanguage.zh:
        return '中文';
      case AppLanguage.ru:
        return 'Русский';
    }
  }

  /// Locale id understood by the `timeago` package, so relative dates
  /// ("3 өдрийн өмнө") follow the chosen language too.
  String get timeagoLocale {
    switch (this) {
      case AppLanguage.mn:
        return 'mn';
      case AppLanguage.en:
        return 'en';
      case AppLanguage.zh:
        return 'zh_CN';
      case AppLanguage.ru:
        return 'ru';
    }
  }

  /// Short badge shown in the compact switcher.
  String get shortLabel {
    switch (this) {
      case AppLanguage.mn:
        return 'MN';
      case AppLanguage.en:
        return 'EN';
      case AppLanguage.zh:
        return '中';
      case AppLanguage.ru:
        return 'RU';
    }
  }
}

/// App-wide language selection. Held in a [ValueNotifier] so `MaterialApp` can
/// rebuild the whole tree when it changes, and exposed statically so
/// non-widget code (repositories, exception messages) can translate too.
class AppLocale {
  AppLocale._();

  static const _storageKey = 'app_language';
  static const _storage = FlutterSecureStorage();

  static final ValueNotifier<AppLanguage> notifier =
      ValueNotifier<AppLanguage>(AppLanguage.mn);

  static AppLanguage get current => notifier.value;

  /// Restore the saved language. Call once before `runApp`.
  static Future<void> load() async {
    try {
      final saved = await _storage.read(key: _storageKey);
      if (saved == null) return;
      for (final lang in AppLanguage.values) {
        if (lang.code == saved) {
          notifier.value = lang;
          return;
        }
      }
    } catch (_) {
      // Keychain unavailable — fall back to Mongolian rather than blocking start.
    }
  }

  /// Switches language immediately and persists in the background.
  ///
  /// Deliberately not `async`: the UI must not wait on a keychain write, which
  /// can be slow (and is unavailable in tests). The user sees the new language
  /// on the next frame regardless of how the write goes.
  static void set(AppLanguage lang) {
    if (notifier.value == lang) return;
    notifier.value = lang;
    rebuildAll();
    unawaited(_persist(lang));
  }

  static Future<void> _persist(AppLanguage lang) async {
    try {
      await _storage.write(key: _storageKey, value: lang.code);
    } catch (_) {
      // Keychain unavailable — the choice still applies for this session.
    }
  }

  /// Marks every element in the tree dirty so all `tr()` calls re-evaluate.
  ///
  /// Rebuilding `MaterialApp` alone is not enough: `ModalRoute` memoises the
  /// page it builds (`_ModalScopeState._page ??=`), and `Element.updateChild`
  /// skips a subtree when the incoming widget is the identical instance — so
  /// routes that already exist, including the one on screen, never re-run
  /// `build()`. A plain `Text(tr('x'))` has no `Localizations` dependency, so
  /// changing `MaterialApp.locale` doesn't invalidate it either.
  ///
  /// Walking the tree costs one frame and happens only when the user actually
  /// switches language, and unlike remounting via a key it preserves the
  /// navigator stack and every `State` object.
  static void rebuildAll() {
    final root = WidgetsBinding.instance.rootElement;
    if (root == null) return;
    void visit(Element el) {
      el.markNeedsBuild();
      el.visitChildren(visit);
    }

    visit(root);
  }
}

/// Translates [key] into the active language.
///
/// Falls back to Mongolian, then to the key itself, so a missing entry shows
/// something readable instead of throwing. `{name}`-style placeholders in the
/// translation are replaced from [params].
///
/// ```dart
/// tr('common.cancel')
/// tr('common.unexpected_response', {'code': res.statusCode})
/// ```
String tr(String key, [Map<String, Object?>? params]) {
  final entry = kTranslations[key];
  final template = entry?[AppLocale.current.code] ?? entry?['mn'] ?? key;
  if (params == null || params.isEmpty) return template;
  // Single pass over the template: a substituted value is never rescanned, so
  // a caller passing text that itself contains `{...}` can't have it replaced,
  // and the result no longer depends on the map's insertion order.
  return template.replaceAllMapped(RegExp(r'\{(\w+)\}'), (m) {
    final name = m.group(1);
    if (params.containsKey(name)) return '${params[name] ?? ''}';
    return m.group(0)!; // unknown placeholder — leave it rather than blank it
  });
}

// ---------------------------------------------------------------------------
// Backend-message translation (see trServer below).
// ---------------------------------------------------------------------------

/// Lazily built index for [trServer]: exact Mongolian backend message → the
/// `server.*` key that carries its translations. Only entries without
/// placeholders participate — parameterised messages go through
/// [_serverPatterns] instead.
Map<String, String>? _serverExactByMn;

/// Lazily built list of (pattern, key) pairs for parameterised backend
/// messages, e.g. `Бараа олдсонгүй: {p0}` → `^Бараа олдсонгүй: (.+?)$`.
List<(RegExp, String, List<String>)>? _serverPatterns;

final RegExp _serverPlaceholderRe = RegExp(r'\{(p\d+)\}');

/// Translates a raw BACKEND response message into the active language.
///
/// The Cloud Functions backend speaks Mongolian: error and success messages
/// arrive as literal Mongolian strings in `error` / `msg` / `message` fields.
/// Rather than deploying a backend change, the app keeps a catalogue of every
/// known server string in `parts/server.dart` (keys prefixed `server.`, whose
/// `mn` value is byte-identical to what the server sends) and maps a known
/// message onto its translation for the user's selected language:
///
/// 1. null/empty input returns ''.
/// 2. Exact match: the trimmed input is looked up in an index of all
///    placeholder-free `server.*` Mongolian values.
/// 3. Parameterised match: templates containing `{p0}`-style placeholders are
///    compiled once into anchored RegExps (literal parts escaped, each
///    placeholder becoming a lazy `(.+?)` group); captured values are fed
///    back into [tr] as params, so interpolated bits (product names, ids)
///    survive translation.
/// 4. Anything unknown — new backend wording, English fallbacks, network
///    errors — passes through unchanged, so the user still sees something
///    meaningful.
String trServer(String? raw) {
  if (raw == null) return '';
  final input = raw.trim();
  if (input.isEmpty) return '';

  final exact = (_serverExactByMn ??= _buildServerExactIndex())[input];
  if (exact != null) return tr(exact);

  for (final (pattern, key, names) in _serverPatterns ??=
      _buildServerPatterns()) {
    final m = pattern.firstMatch(input);
    if (m != null) {
      return tr(key, {
        for (var i = 0; i < names.length; i++) names[i]: m.group(i + 1),
      });
    }
  }
  return raw;
}

Map<String, String> _buildServerExactIndex() {
  final index = <String, String>{};
  for (final entry in kTranslations.entries) {
    if (!entry.key.startsWith('server.')) continue;
    final mn = entry.value['mn'];
    if (mn == null || mn.contains('{')) continue;
    index[mn] = entry.key;
  }
  return index;
}

List<(RegExp, String, List<String>)> _buildServerPatterns() {
  final patterns = <(RegExp, String, List<String>)>[];
  for (final entry in kTranslations.entries) {
    if (!entry.key.startsWith('server.')) continue;
    final mn = entry.value['mn'];
    if (mn == null || !mn.contains(_serverPlaceholderRe)) continue;

    final names = <String>[];
    final buf = StringBuffer('^');
    var last = 0;
    for (final m in _serverPlaceholderRe.allMatches(mn)) {
      buf.write(RegExp.escape(mn.substring(last, m.start)));
      buf.write('(.+?)');
      names.add(m.group(1)!);
      last = m.end;
    }
    buf
      ..write(RegExp.escape(mn.substring(last)))
      ..write(r'$');
    patterns.add((RegExp(buf.toString(), dotAll: true), entry.key, names));
  }
  return patterns;
}
