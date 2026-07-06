import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:version/version.dart';
import 'package:url_launcher/url_launcher.dart';

class VersionService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  /// Check if app version needs update.
  ///
  /// Reads the REAL installed version at runtime via package_info_plus
  /// (sourced from pubspec.yaml at build time) instead of a hardcoded
  /// constant — otherwise the constant silently drifts from the shipped
  /// version and the update prompt keeps showing even on the latest build.
  Future<bool> needsUpdate() async {
    try {
      // Get the actual installed app version (e.g. "2.0.8"). PackageInfo
      // strips the "+build" suffix, matching the "x.y.z" stored in Firestore.
      final packageInfo = await PackageInfo.fromPlatform();
      final currentVersion = Version.parse(packageInfo.version);

      // Determine platform
      final platform = Platform.isIOS ? 'ios' : 'android';

      // Get version from Firestore
      final versionDoc = await _firestore
          .collection('versions')
          .doc(platform)
          .get();

      if (!versionDoc.exists) {
        print('Version document not found for platform: $platform');
        return false;
      }

      final firestoreVersionString = versionDoc.data()?['version'] as String?;
      if (firestoreVersionString == null || firestoreVersionString.isEmpty) {
        print('Version field not found in document');
        return false;
      }

      final firestoreVersion = Version.parse(firestoreVersionString.trim());

      // Update is needed only when the installed version is strictly older
      // than the required version published in Firestore.
      print('Installed version: $currentVersion, Required version: $firestoreVersion');
      return currentVersion < firestoreVersion;
    } catch (e) {
      print('Error checking version: $e');
      return false;
    }
  }

  /// Open app store based on platform
  Future<void> _openStore() async {
    try {
      String storeUrl;
      if (Platform.isIOS) {
        // Replace with your actual App Store ID
        storeUrl = 'https://apps.apple.com/app/ikh-khaadiin-chuluu/id6572300454';
      } else {
        // Replace with your actual package name
        storeUrl = 'https://play.google.com/store/apps/details?id=mn.u999.onegrgold';
      }
      
      final Uri url = Uri.parse(storeUrl);
      if (await canLaunchUrl(url)) {
        await launchUrl(url, mode: LaunchMode.externalApplication);
      }
    } catch (e) {
      print('Error opening store: $e');
    }
  }

  /// Show update alert dialog
  void showUpdateAlert(BuildContext context) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Шинэчлэлт хийх шаардлагатай'),
          content: const Text(
            'Таны апп-н хувилбар хуучирсан байна. Үргэлжлүүлэхийн тулд шинэчлэлт хийнэ үү.',
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                _openStore();
              },
              child: const Text('Шинэчлэх'),
            ),
          ],
        );
      },
    );
  }

  /// Check version and show alert if needed
  Future<void> checkAndShowUpdateIfNeeded(BuildContext context) async {
    final needUpdate = await needsUpdate();
    if (needUpdate && context.mounted) {
      showUpdateAlert(context);
    }
  }
}
