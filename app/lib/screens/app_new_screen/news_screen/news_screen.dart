import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/news_item_model.dart';
import 'package:onegrgold/screens/app_new_screen/news_screen/news_item_widget.dart';
import 'package:onegrgold/style/colors.dart';

class NewsScreen extends StatelessWidget {
  final String uid;
  const NewsScreen({super.key, required this.uid});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CustomColors.darkContainerColor,
      appBar: PreferredSize(
        preferredSize: Size.fromHeight(45.0),
        child: AppBar(
          backgroundColor: CustomColors.darkContainerColor,
          title: Text(
            tr('home.news'),
            style: const TextStyle(
              fontFamily: "InterBold",
              fontSize: 12,
              color: Colors.white,
            ),
          ),
          centerTitle: false,
        ),
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance
            .collection('news')
            .orderBy('createdAt', descending: true)
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CupertinoActivityIndicator());
          }
          
          if (snapshot.hasError) {
            print('Error fetching news: ${snapshot.error}');
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 60, color: Colors.red),
                  SizedBox(height: 16),
                  Text(
                    tr('common.error_with', {'error': snapshot.error}),
                    style: TextStyle(color: Colors.white70),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            );
          }

          if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
            return SizedBox(
              width: MediaQuery.of(context).size.width,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SvgPicture.asset(
                    "assets/icons/empty_news.svg",
                    height: 120.0,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    tr('home.no_news'),
                    style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14.0,
                        color: Colors.white30),
                  ),
                ],
              ),
            );
          }

          final newsItems = snapshot.data!.docs.map((doc) {
            return NewsItem.fromMap(doc.id, doc.data() as Map<String, dynamic>);
          }).toList();

          return ListView.builder(
            scrollDirection: Axis.vertical,
            itemCount: newsItems.length,
            itemBuilder: (context, index) {
              final news = newsItems[index];
              return NewsItemWidget(news: news, uid: uid);
            },
          );
        },
      ),
    );
  }
}