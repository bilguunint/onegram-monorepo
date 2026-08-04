import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:intl/intl.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:onegrgold/models/notification_model.dart';
import 'package:onegrgold/l10n/app_locale.dart';

class NotificationScreen extends StatefulWidget {
  const NotificationScreen({super.key});

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  @override
  void initState() {
    super.initState();
  }

  IconData _getIconByType(String type) {
    switch (type.toLowerCase()) {
      case 'gift':
        return Icons.card_giftcard;
      case 'order':
        return Icons.shopping_cart;
      case 'withdraw':
        return Icons.account_balance_wallet;
      case 'system':
        return Icons.info;
      case 'promotion':
        return Icons.local_offer;
      default:
        return Icons.notifications;
    }
  }

  Future<void> _markAsRead(String notificationId) async {
    try {
      final user = _auth.currentUser;
      if (user != null) {
        await _firestore
            .collection('users')
            .doc(user.uid)
            .collection('notifications')
            .doc(notificationId)
            .update({'read': true});
      }
    } catch (e) {
      print("Error marking notification as read: $e");
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = _auth.currentUser;
    
    if (user == null) {
      return Scaffold(
        appBar: AppBar(
          title: Text(tr('home.notifications_title')),
          centerTitle: false,
        ),
        body: const Center(
          child: Text("User not authenticated"),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(tr('home.notifications_title')),
        centerTitle: false,
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: _firestore
            .collection('users')
            .doc(user.uid)
            .collection('notifications')
            .orderBy('createdAt', descending: true)
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return _buildErrorWidget("Error: ${snapshot.error}");
          }

          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CupertinoActivityIndicator());
          }

          if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
            return _buildEmptyWidget();
          }

          return _buildNotificationsList(snapshot.data!.docs);
        },
      ),
    );
  }
  Widget _buildErrorWidget(String error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          SizedBox(
            width: 80.0,
            height: 80.0,
            child: SvgPicture.asset("assets/icons/empty-notif.svg"),
          ),
          Padding(
            padding: const EdgeInsets.only(top: 16.0),
            child: Text(
              error,
              style: const TextStyle(
                fontSize: 12.0,
                color: Colors.white38,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyWidget() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          SizedBox(
            width: 80.0,
            height: 80.0,
            child: SvgPicture.asset("assets/icons/empty-notif.svg"),
          ),
          Padding(
            padding: const EdgeInsets.only(top: 16.0),
            child: Text(
              tr('home.no_notifications'),
              style: const TextStyle(
                fontSize: 12.0,
                color: Colors.white38,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationsList(List<QueryDocumentSnapshot> docs) {
    return ListView.builder(
      itemCount: docs.length,
      itemBuilder: (context, index) {
        final doc = docs[index];
        final notification = NotificationModel.fromFirestore(doc);
        final formatedDate = DateFormat('yyyy-MM-dd HH:mm').format(notification.createdAt);

        return Container(
          margin: const EdgeInsets.symmetric(vertical: 4.0),
          decoration: BoxDecoration(
            color: notification.read ? Colors.grey.withOpacity(0.1) : Colors.white.withOpacity(0.1),
      
            border: Border(
              bottom: BorderSide(
                color: notification.read ? Colors.grey.withOpacity(0.3) : Colors.white.withOpacity(0.3),
                width: 1.0,
            ),
          ),),
          child: ListTile(
            onTap: () async {
              // Mark as read when tapped
              if (!notification.read) {
                await _markAsRead(notification.id);
              }
            },
            leading: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: notification.read ? Colors.grey : Colors.blue,
                shape: BoxShape.circle,
              ),
              child: Icon(
                _getIconByType(notification.type),
                color: Colors.white,
                size: 20,
              ),
            ),
            title: Row(
              children: [
                Expanded(
                  child: Text(
                    notification.title,
                    style: TextStyle(
                      fontSize: 14.0,
                      fontWeight: notification.read ? FontWeight.normal : FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
                if (!notification.read)
                  Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      color: Colors.blue,
                      shape: BoxShape.circle,
                    ),
                  ),
              ],
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 4),
                Text(
                  notification.body,
                  style: TextStyle(
                    fontSize: 12.0,
                    color: notification.read ? Colors.white60 : Colors.white70,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  formatedDate,
                  style: const TextStyle(fontSize: 10.0, color: Colors.grey),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}