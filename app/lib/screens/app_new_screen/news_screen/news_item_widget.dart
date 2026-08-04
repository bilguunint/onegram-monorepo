import 'package:flutter/material.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/news_item_model.dart';
import 'package:onegrgold/style/colors.dart';
import 'package:onegrgold/screens/app_new_screen/news_screen/news_detail_screen.dart';

class NewsItemWidget extends StatefulWidget {
  final NewsItem news;
  final String uid;

  const NewsItemWidget({super.key, required this.news, required this.uid});

  @override
  State<NewsItemWidget> createState() => _NewsItemWidgetState();
}

class _NewsItemWidgetState extends State<NewsItemWidget> {
  String _formatTimeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);
    
    if (difference.inDays > 0) {
      return tr('home.days_ago', {'count': difference.inDays});
    } else if (difference.inHours > 0) {
      return tr('home.hours_ago', {'count': difference.inHours});
    } else if (difference.inMinutes > 0) {
      return tr('home.minutes_ago', {'count': difference.inMinutes});
    } else {
      return tr('home.just_now');
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        // NewsDetailScreen руу шилжих
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => NewsDetailScreen(
              news: widget.news,
              uid: widget.uid,
            ),
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.all(16.0),
        width: MediaQuery.of(context).size.width,
        decoration: BoxDecoration(
          color: CustomColors.darkContainerColor,
          border: Border(
            bottom: BorderSide(
              color: Colors.white12,
              width: 1.0,
            ),
          ),
        ),
        child: Row(
          children: [
            // Зураг
            if (widget.news.imageUrl.isNotEmpty)
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8.0),
                  image: DecorationImage(
                    image: NetworkImage(widget.news.imageUrl),
                    fit: BoxFit.cover,
                  ),
                ),
              )
            else
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8.0),
                  color: Colors.grey.shade800,
                ),
                child: Icon(Icons.article, color: Colors.white54),
              ),
            SizedBox(width: 12.0),
            
            // Мэдээний мэдээлэл
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Эх сурвалж болон ангилал
                  Row(
                    children: [
                      Text(
                        widget.news.sourceName.toUpperCase(),
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: CustomColors.mainColor,
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 8.0),
                  
                  // Гарчиг
                  Text(
                    widget.news.titleMn.isNotEmpty 
                        ? widget.news.titleMn 
                        : widget.news.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 13.0,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      height: 1.3,
                    ),
                  ),
                  SizedBox(height: 8.0),
                  
                  // Хураангуй
                  if (widget.news.summaryMn.isNotEmpty)
                    Text(
                      widget.news.summaryMn,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 10,
                        color: Colors.white70,
                        height: 1.2,
                      ),
                    ),
                  SizedBox(height: 8.0),
                  
                  // Огноо
                  Text(
                    widget.news.publishedAt != null
                        ? _formatTimeAgo(widget.news.publishedAt!)
                        : '',
                    style: TextStyle(
                      fontSize: 10,
                      color: Colors.white54,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
