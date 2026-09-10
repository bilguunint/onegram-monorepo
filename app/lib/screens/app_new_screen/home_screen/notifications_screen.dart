import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/models/notification_model.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

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
        backgroundColor: CustomColors.appBackground,
        appBar: appBar(tr('home.notifications_title')),
        body: const AppEmptyState(
          icon: Icons.person_off_outlined,
          title: "User not authenticated",
        ),
      );
    }

    return Scaffold(
      backgroundColor: CustomColors.appBackground,
      appBar: appBar(tr('home.notifications_title')),
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
            return const Center(
                child: CupertinoActivityIndicator(color: Colors.white));
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
    return AppEmptyState(
      icon: Icons.error_outline_rounded,
      iconColor: CustomColors.negative,
      title: error,
    );
  }

  Widget _buildEmptyWidget() {
    return AppEmptyState(
      icon: Icons.notifications_none_rounded,
      title: tr('home.no_notifications'),
    );
  }

  Widget _buildNotificationsList(List<QueryDocumentSnapshot> docs) {
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16.0, 8.0, 16.0, 32.0),
      itemCount: docs.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12.0),
      itemBuilder: (context, index) {
        final doc = docs[index];
        final notification = NotificationModel.fromFirestore(doc);
        final formatedDate = DateFormat('yyyy-MM-dd HH:mm').format(notification.createdAt);
        final bool unread = !notification.read;

        return InkWell(
          onTap: () async {
            // Mark as read when tapped
            if (!notification.read) {
              await _markAsRead(notification.id);
            }
          },
          borderRadius: BorderRadius.circular(16.0),
          child: AppCard(
            padding: const EdgeInsets.all(12.0),
            radius: 16.0,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AppIconTile(
                  size: 44.0,
                  color: unread
                      ? CustomColors.accentSoft
                      : CustomColors.surfaceAlt,
                  child: Icon(
                    _getIconByType(notification.type),
                    size: 20.0,
                    color: unread
                        ? CustomColors.accent
                        : CustomColors.textSecondary,
                  ),
                ),
                const SizedBox(width: 12.0),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Text(
                              notification.title,
                              style: unread
                                  ? AppText.bodyBold
                                  : AppText.body,
                            ),
                          ),
                          if (unread) ...[
                            const SizedBox(width: 8.0),
                            Padding(
                              padding: const EdgeInsets.only(top: 5.0),
                              child: Container(
                                width: 8.0,
                                height: 8.0,
                                decoration: BoxDecoration(
                                  color: CustomColors.accent,
                                  shape: BoxShape.circle,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 4.0),
                      Text(
                        notification.body,
                        style: AppText.caption.copyWith(
                          color: unread
                              ? Colors.white.withOpacity(0.78)
                              : CustomColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 6.0),
                      Text(
                        formatedDate,
                        style: AppText.caption.copyWith(
                          fontSize: 11.0,
                          color: CustomColors.textTertiary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
