import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/news_item_model.dart';
import 'package:onegrgold/style/colors.dart';
import 'package:share_plus/share_plus.dart';
import 'package:timeago/timeago.dart' as timeago;
import 'package:url_launcher/url_launcher.dart';

class NewsDetailScreen extends StatefulWidget {
  final NewsItem news;
  final String uid;

  const NewsDetailScreen({super.key, required this.news, required this.uid});

  @override
  State<NewsDetailScreen> createState() => _NewsDetailScreenState();
}

class _NewsDetailScreenState extends State<NewsDetailScreen> {
  Timer? _viewTimer;
  String? sourceLogoUrl = "";
  bool isLimited = false;
  bool _showComments = false;
  final TextEditingController _commentController = TextEditingController();
  double _summaryFontSize = 14.0;
  ThemeMode appTheme = ThemeMode.dark;

  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    // 🧹 Timer цэвэрлэнэ
    _viewTimer?.cancel();
    _commentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.news.titleMn, style: TextStyle(
          fontSize: 12.0
        ),),
      ),
      body: Container(
        color: CustomColors.darkContainerColor,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // 🖼 Зураг
            Stack(
              children: [
                AspectRatio(
                  aspectRatio: 1.3 / 1,
                  child: widget.news.imageUrl.isNotEmpty
                      ? Image.network(
                          widget.news.imageUrl,
                          fit: BoxFit.cover,
                        )
                      : Container(
                          color: const Color.fromARGB(255, 64, 56, 56),
                        ),
                ),
                AspectRatio(
                  aspectRatio: 1.3 / 1,
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          CustomColors.darkContainerColor.withOpacity(0.0),
                          CustomColors.darkContainerColor
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        stops: [0.0, 1.0],
                      ),
                    ),
                  ),
                ),
                Positioned(
                  bottom: 8.0,
                  left: 8.0,
                  right: 8.0,
                  child: SizedBox(
                    width: MediaQuery.of(context).size.width - 20,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.news.titleMn,
                              style: const TextStyle(
                                fontSize: 14,
                                fontFamily: "InterBlack",
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                            SizedBox(height: 16),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    Row(
                                      children: [
                                        SvgPicture.asset(
                                          "assets/icons/clock.svg",
                                          color: Colors.white,
                                          width: 15.0,
                                        ),
                                        SizedBox(width: 4),
                                        Text(
                                          timeago.format(
                                              DateTime.parse(widget
                                                  .news.publishedAt!
                                                  .toString()),
                                              locale: AppLocale.current.timeagoLocale),
                                          style: TextStyle(
                                              fontSize: 9,
                                              fontWeight: FontWeight.bold,
                                              color: Colors.white),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                                Text(
                                  widget.news.category["name"] +
                                      "/" +
                                      widget.news.subCategory["name"],
                                  style: TextStyle(
                                      fontSize: 9,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(
                          left: 8.0, right: 8.0, top: 8.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 4.0),
                          Container(
                            height: 36.0,
                            padding: const EdgeInsets.only(bottom: 8.0),
                            child: ListView(
                              scrollDirection: Axis.horizontal,
                              children: [
                                Container(
                                  padding: EdgeInsets.only(
                                    left: 16.0,
                                    right: 16.0,
                                    bottom: 8.0,
                                    top: 8.0,
                                  ),
                                  decoration: BoxDecoration(
                                    color: appTheme == ThemeMode.dark
                                        ? Colors.white.withOpacity(
                                            0.05,
                                          )
                                        : Colors.black.withOpacity(
                                            0.09,
                                          ),
                                    borderRadius: BorderRadius.circular(
                                      32,
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      GestureDetector(
                                        behavior: HitTestBehavior
                                            .opaque, // 🆕 Invisible area дээр тэр tap detect хийх
                                        onTap: () {
                                          setState(() {
                                            _summaryFontSize += 1;
                                          });
                                        },
                                        child: Container(
                                          width: 28.0, // 🆕 Fixed size
                                          height: 28.0, // 🆕 Fixed size
                                          alignment: Alignment
                                              .center, // 🆕 Perfect centering
                                          child: Icon(
                                            FontAwesomeIcons
                                                .magnifyingGlassPlus,
                                            color: appTheme == ThemeMode.dark
                                                ? Colors.white
                                                : Colors.black,
                                            size: 12.0,
                                          ),
                                        ),
                                      ),
                                      SizedBox(width: 16),
                                      Container(
                                        height: 10.0,
                                        width: 1.0,
                                        color: appTheme == ThemeMode.dark
                                            ? Colors.white
                                            : Colors.black,
                                      ),
                                      SizedBox(width: 16),
                                      GestureDetector(
                                        behavior: HitTestBehavior
                                            .opaque, // 🆕 Invisible area дээр тэр tap detect хийх
                                        onTap: () {
                                          setState(() {
                                            if (_summaryFontSize > 1) {
                                              _summaryFontSize -= 1;
                                            }
                                          });
                                        },
                                        child: Container(
                                          width: 28.0, // 🆕 Fixed size
                                          height: 28.0, // 🆕 Fixed size
                                          alignment: Alignment
                                              .center, // 🆕 Perfect centering
                                          child: Icon(
                                            FontAwesomeIcons
                                                .magnifyingGlassMinus,
                                            color: appTheme == ThemeMode.dark
                                                ? Colors.white
                                                : Colors.black,
                                            size: 11.0,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                SizedBox(width: 8.0),
                                GestureDetector(
                                  onTap: () {
                                    launchNewsUrl(widget.news.url);
                                  },
                                  child: Container(
                                    padding: EdgeInsets.only(
                                      left: 16.0,
                                      right: 16.0,
                                      bottom: 8.0,
                                      top: 8.0,
                                    ),
                                    decoration: BoxDecoration(
                                      color: appTheme == ThemeMode.dark
                                          ? Colors.white.withOpacity(
                                              0.05,
                                            )
                                          : Colors.black.withOpacity(
                                              0.09,
                                            ),
                                      borderRadius: BorderRadius.circular(
                                        32,
                                      ),
                                    ),
                                    child: Row(
                                      children: [
                                        Icon(
                                          FontAwesomeIcons.link,
                                          color: appTheme == ThemeMode.dark
                                              ? Colors.white
                                              : Colors.black,
                                          size: 12.0,
                                        ),
                                        SizedBox(width: 10),
                                        Text(
                                          tr('home.original_source'),
                                          style: TextStyle(
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                SizedBox(width: 8.0),
                                GestureDetector(
                                  onTap: () {
                                    shareNewsWithImage(
                                      widget.news.titleMn,
                                      widget.news.summaryMn,
                                      widget.news.imageUrl,
                                    );
                                  },
                                  child: Container(
                                    padding: EdgeInsets.only(
                                      left: 16.0,
                                      right: 16.0,
                                      bottom: 8.0,
                                      top: 8.0,
                                    ),
                                    decoration: BoxDecoration(
                                      color: appTheme == ThemeMode.dark
                                          ? Colors.white.withOpacity(
                                              0.05,
                                            )
                                          : Colors.black.withOpacity(
                                              0.09,
                                            ),
                                      borderRadius: BorderRadius.circular(
                                        32,
                                      ),
                                    ),
                                    child: Row(
                                      children: [
                                        Icon(
                                          FontAwesomeIcons.share,
                                          color: appTheme == ThemeMode.dark
                                              ? Colors.white
                                              : Colors.black,
                                          size: 12.0,
                                        ),
                                        SizedBox(width: 10),
                                        Text(
                                          tr('home.share'),
                                          style: TextStyle(
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
            SizedBox(height: 8.0),
            _buildArticleSection(),
          ],
        ),
      ),
    );
  }

  String getSourceLogoPath(String sourceUrl) {
    final sourceMap = {
      'tmz.com': 'assets/images/logos/tmz.png',
      'people.com': 'assets/images/logos/people.png',
      'pageSix.com': 'assets/images/logos/page-six.png',
      'dailymail.co.uk': 'assets/images/logos/daily-mail.png',
    };

    final normalizedUrl = sourceUrl.toLowerCase().trim();

    return sourceMap[normalizedUrl] ??
        'assets/images/logos/default.png'; // default fallback
  }

  String formatCategory(String categoryUri) {
    if (categoryUri.contains('/')) {
      return categoryUri.split('/').last.replaceAll('_', ' ');
    }
    return categoryUri;
  }

  Future<void> launchNewsUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      throw tr('home.url_open_failed', {'url': url});
    }
  }

  Widget _buildArticleSection() {
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.only(left: 8.0, right: 8.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.news.summaryMn,
              maxLines: 15,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                height: 1.5,
                fontSize: _summaryFontSize,
                color: appTheme == ThemeMode.dark
                    ? Colors.white.withOpacity(0.9)
                    : Colors.black.withOpacity(0.9),
              ),
            ),
            SizedBox(height: 8.0),
            Row(
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      tr('home.source_label'),
                      style: TextStyle(
                          fontSize: 10,
                          color: appTheme == ThemeMode.dark
                              ? Colors.white70
                              : Colors.black54),
                    ),
                    SizedBox(height: 2),
                    Text(
                      widget.news.sourceName.toUpperCase(),
                      style: TextStyle(
                        fontSize: 12.0,
                        fontFamily: "InterBold",
                        color: CustomColors.mainColor,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> shareNewsWithImage(
    String title,
    String content,
    String imageUrl,
  ) async {
    try {
      final params = ShareParams(
        text:
            '$title\n\n$content\n\n${tr('home.source_label')} ${widget.news.url}\nPowered by Swapp',
      );
      final result = await SharePlus.instance.share(params);
      if (result.status == ShareResultStatus.success) {
        print('Thank you for sharing the picture!');
      }
    } catch (e) {
      print("❌ Share error: $e");
    }
  }
}
