import 'dart:io';

import 'package:dio/dio.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:onegrgold/app.dart';
import 'package:onegrgold/bloc/auth_bloc/auth_bloc.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/repositories/auth_repository.dart';
import 'package:onegrgold/repositories/user_repository.dart';
import 'repositories/notificationservice.dart';
import 'package:timeago/timeago.dart' as timeago;

// Top-level function for background message handling
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print("🔔 Background message received: ${message.notification?.title}");
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Relative dates follow the UI language, so a Chinese user doesn't get
  // Mongolian "3 өдрийн өмнө" under a Chinese headline.
  timeago.setLocaleMessages('mn', timeago.MnMessages());
  timeago.setLocaleMessages('en', timeago.EnMessages());
  timeago.setLocaleMessages('zh_CN', timeago.ZhCnMessages());
  timeago.setLocaleMessages('ru', timeago.RuMessages());
  // Restore the saved UI language before the first frame so nothing flashes
  // in Mongolian for a user who picked another language.
  await AppLocale.load();
  await Firebase.initializeApp();
  
  // Initialize Firebase Messaging
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  
  // Request FCM permissions early
  final messaging = FirebaseMessaging.instance;
  await messaging.requestPermission(
    alert: true,
    announcement: false,
    badge: true,
    carPlay: false,
    criticalAlert: false,
    provisional: false,
    sound: true,
  );
  
  final dio = Dio();
  final authRepository = AuthRepository(dio: dio);
  final userRepository = UserRepository();
  await NotificationService().initNotification();
  NotificationService().requestIOSPermissions();

  if (Platform.isAndroid) {
    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      systemNavigationBarColor: Colors.black,
    ));
  }
  runApp(
    MultiRepositoryProvider(
      providers: [
        RepositoryProvider.value(value: authRepository),
        RepositoryProvider.value(value: userRepository),
      ],
      child: MultiBlocProvider(
        providers: [
          BlocProvider(create: (_) => AuthBloc(authRepository, userRepository)..add(AppStarted())),    
        ],
        child: MyApp(
          authRepository: authRepository,
          userRepository: userRepository,
        ),
      ),
    ),
  );
}
