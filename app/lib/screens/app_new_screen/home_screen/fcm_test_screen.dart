// lib/screens/test/fcm_test_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'dart:io';

class FCMTestScreen extends StatefulWidget {
  @override
  _FCMTestScreenState createState() => _FCMTestScreenState();
}

class _FCMTestScreenState extends State<FCMTestScreen> {
  String _status = 'Initializing...';
  String _fcmToken = '';
  String _savedToken = '';
  String _permissions = '';
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _testFCMToken();
  }

  Future<void> _testFCMToken() async {
    setState(() {
      _isLoading = true;
      _status = 'Testing FCM Token...';
    });

    try {
      final messaging = FirebaseMessaging.instance;
      final uid = FirebaseAuth.instance.currentUser?.uid;

      // 1. Permission check
      setState(() => _status = 'Step 1: Checking permissions...');
      NotificationSettings settings = await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );

      _permissions = '''
Platform: ${Platform.isIOS ? 'iOS' : 'Android'}
Authorization: ${settings.authorizationStatus}
Alert: ${settings.alert}
Badge: ${settings.badge}
Sound: ${settings.sound}
''';

      if (settings.authorizationStatus == AuthorizationStatus.denied) {
        setState(() {
          _status = 'Permission denied!';
          _isLoading = false;
        });
        return;
      }

      // 2. Get FCM Token
      setState(() => _status = 'Step 2: Getting FCM token...');
      String? token = await messaging.getToken();

      if (token != null) {
        _fcmToken = token;
        setState(() => _status = 'Step 3: Saving to Firestore...');

        // 3. Save to Firestore
        if (uid != null) {
          await FirebaseFirestore.instance
              .collection('users')
              .doc(uid)
              .set({
            'fcm_token': token,
            'updated_at': FieldValue.serverTimestamp(),
          }, SetOptions(merge: true));

          // 4. Verify saved token
          setState(() => _status = 'Step 4: Verifying saved token...');
          final doc = await FirebaseFirestore.instance
              .collection('users')
              .doc(uid)
              .get();

          if (doc.exists) {
            _savedToken = doc.data()?['fcm_token'] ?? 'NOT FOUND';
          }
        }

        setState(() {
          _status = 'SUCCESS!';
          _isLoading = false;
        });
      } else {
        setState(() {
          _status = 'FAILED: FCM token is null';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _status = 'ERROR: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('FCM Token Test'),
        backgroundColor: Colors.blue,
      ),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status
            Card(
              child: Padding(
                padding: EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Status:', style: TextStyle(fontWeight: FontWeight.bold)),
                    SizedBox(height: 8),
                    Text(_status),
                    if (_isLoading) 
                      Padding(
                        padding: EdgeInsets.only(top: 8),
                        child: CircularProgressIndicator(),
                      ),
                  ],
                ),
              ),
            ),

            // Permissions
            if (_permissions.isNotEmpty)
              Card(
                child: Padding(
                  padding: EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Permissions:', style: TextStyle(fontWeight: FontWeight.bold)),
                      SizedBox(height: 8),
                      Text(_permissions),
                    ],
                  ),
                ),
              ),

            // FCM Token
            if (_fcmToken.isNotEmpty)
              Card(
                child: Padding(
                  padding: EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text('FCM Token:', style: TextStyle(fontWeight: FontWeight.bold)),
                          Spacer(),
                          IconButton(
                            icon: Icon(Icons.copy),
                            onPressed: () {
                              Clipboard.setData(ClipboardData(text: _fcmToken));
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('Token copied to clipboard!')),
                              );
                            },
                          ),
                        ],
                      ),
                      SizedBox(height: 8),
                      Text(
                        _fcmToken,
                        style: TextStyle(fontSize: 12, fontFamily: 'monospace'),
                      ),
                      SizedBox(height: 8),
                      Text('Length: ${_fcmToken.length}'),
                    ],
                  ),
                ),
              ),

            // Saved Token
            if (_savedToken.isNotEmpty)
              Card(
                child: Padding(
                  padding: EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Saved in Firestore:', style: TextStyle(fontWeight: FontWeight.bold)),
                      SizedBox(height: 8),
                      Text(
                        _savedToken,
                        style: TextStyle(fontSize: 12, fontFamily: 'monospace'),
                      ),
                      SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(
                            _savedToken == _fcmToken ? Icons.check_circle : Icons.error,
                            color: _savedToken == _fcmToken ? Colors.green : Colors.red,
                          ),
                          SizedBox(width: 8),
                          Text(
                            _savedToken == _fcmToken ? 'Tokens match!' : 'Tokens do not match!',
                            style: TextStyle(
                              color: _savedToken == _fcmToken ? Colors.green : Colors.red,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

            // Retry button
            SizedBox(height: 20),
            Center(
              child: ElevatedButton(
                onPressed: _isLoading ? null : _testFCMToken,
                child: Text('Retry Test'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}