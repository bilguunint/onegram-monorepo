import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:onegrgold/models/news_item_model.dart';
import 'package:onegrgold/screens/app_new_screen/news_screen/news_detail_screen.dart';
import 'package:onegrgold/style/colors.dart';

class RecentNewsWidget extends StatefulWidget {
  const RecentNewsWidget({super.key});

  @override
  State<RecentNewsWidget> createState() => _RecentNewsWidgetState();
}

class _RecentNewsWidgetState extends State<RecentNewsWidget> {
  final PageController _pageController = PageController();
  int _currentPage = 0;
  List<NewsItem> _news = []; // NewsItem object болгож өөрчилсөн
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchNews();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _fetchNews() async {
    try {
      final querySnapshot = await FirebaseFirestore.instance
          .collection('news')
          .orderBy('createdAt', descending: true)
          .limit(5)
          .get();

      setState(() {
        _news = querySnapshot.docs
            .map((doc) => NewsItem.fromMap(doc.id, doc.data() as Map<String, dynamic>))
            .toList();
        _isLoading = false;
      });
    } catch (e) {
      print('Error fetching news: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
                    padding: EdgeInsets.only(
                        top: 16.0, bottom: 16.0),
                    child: Text(
                      "Алт барьцаалсан зээл",
                      style: TextStyle(
                        fontFamily: "InterBold",
                        fontSize: 14.0,
                      ),
                    ),
                  ),
        Padding(
          padding: const EdgeInsets.only(right: 16.0),
          child: Center(
            child: Container(
              width: MediaQuery.of(context).size.width / 2 - 24,
              height: 240,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                
              ),
              child: _isLoading
                  ? const Center(
                      child: CircularProgressIndicator(
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white54),
                      ),
                    )
                  : _news.isEmpty
                      ? const Center(
                          child: Text(
                            'Мэдээ олдсонгүй',
                            style: TextStyle(
                              color: Colors.white54,
                              fontSize: 14,
                              fontFamily: "Inter",
                            ),
                          ),
                        )
                      : ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Stack(
                            children: [
                              // News slider
                              PageView.builder(
                                controller: _pageController,
                                onPageChanged: (index) {
                                  setState(() {
                                    _currentPage = index;
                                  });
                                },
                                itemCount: _news.length,
                                itemBuilder: (context, index) {
                                  final newsItem = _news[index];
                                  return _buildNewsItem(newsItem);
                                },
                              ),
                              
                              // Dot indicators
                              if (_news.length > 1)
                                Positioned(
                                  bottom: 8,
                                  left: 0,
                                  right: 0,
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: List.generate(
                                      _news.length,
                                      (index) => Container(
                                        margin: const EdgeInsets.symmetric(horizontal: 3),
                                        width: _currentPage == index ? 8 : 6,
                                        height: _currentPage == index ? 8 : 6,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: _currentPage == index
                                              ? CustomColors.mainColor
                                              : Colors.white38,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildNewsItem(NewsItem newsItem) {
    final String title = newsItem.titleMn.isNotEmpty ? newsItem.titleMn : 'Гарчиггүй мэдээ';
    final String imageUrl = newsItem.imageUrl;
    
    return GestureDetector(
      onTap: () {
        final currentUser = FirebaseAuth.instance.currentUser;
        
        Navigator.push(
          context,
          CupertinoPageRoute(
            builder: (_) => NewsDetailScreen(
              news: newsItem,
              uid: currentUser?.uid ?? '',
            ),
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          image: imageUrl.isNotEmpty
              ? DecorationImage(
                  image: NetworkImage(imageUrl),
                  fit: BoxFit.cover,
                  
                )
              : null,
          gradient: imageUrl.isEmpty
              ? const LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                colors: [
                  Color(0xFF37474F),
                  Color(0xFF263238),
                ],
              )
            : null,
      ), 
      child: Stack(
        
        children: [
          Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Colors.black.withOpacity(0.0),
                          Colors.black,
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        stops: const [0.5, 1.0],
                      ),
                    ),
                  ),
          Positioned(
            bottom: 30.0,
            left: 10.0,
            right: 10.0,
            child: Text(
              title,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontFamily: "RubikBold",
                height: 1.3,
              ),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          
        ],
      ),
    ) // Container хаагдсан
    ); // GestureDetector хаагдсан
  }
}