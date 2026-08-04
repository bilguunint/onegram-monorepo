import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/style/colors.dart';

class CategorySelector extends StatefulWidget {
  final Function(List<Map<String, dynamic>>) onSelectedChanged;

  const CategorySelector({
    super.key,
    required this.onSelectedChanged,
  });

  @override
  State<CategorySelector> createState() => _CategorySelectorState();
}

class _CategorySelectorState extends State<CategorySelector> {
  List<Map<String, dynamic>> categories = [];
  List<Map<String, dynamic>> favoriteCategories = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    fetchCategories();
  }

  Future<void> fetchCategories() async {
    try {
      final snapshot = await FirebaseFirestore.instance
          .collection('categories')
          .orderBy('id')
          .get();

      final fetched = snapshot.docs.map((doc) {
        final data = doc.data();
        data['id'] = doc.id;
        return data;
      }).toList();

      setState(() {
        categories = fetched;
        isLoading = false;
      });
    } catch (e) {
      print('🔥 fetchCategories error: $e');
      setState(() {
        isLoading = false;
      });
    }
  }

  void toggleCategory(Map<String, dynamic> category) {
    final alreadySelected = favoriteCategories.any((c) => c['id'] == category['id']);

    setState(() {
      if (alreadySelected) {
        favoriteCategories.removeWhere((c) => c['id'] == category['id']);
      } else {
        if (favoriteCategories.length < 3) {
          favoriteCategories.add(category);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(tr('reg.max_three_categories'))),
          );
        }
      }
    });

    widget.onSelectedChanged(favoriteCategories);
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return Column(
      children: categories.map((category) {
        final isSelected =
            favoriteCategories.any((c) => c['id'] == category['id']);
        return Container(
          decoration: const BoxDecoration(
            border: Border(
              bottom: BorderSide(color: Colors.white10, width: 0.5),
            ),
          ),
          child: ListTile(
            title: Text(
              category['name'] ?? '',
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 12.0,
                fontFamily: 'InterBold',
              ),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '@${category['slug']}',
                  style: const TextStyle(fontSize: 10.0),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Text(
                      tr('reg.news_count', {'count': category['total_news']}),
                      style: const TextStyle(
                        fontSize: 10.0,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Container(
                      height: 3.0,
                      width: 3.0,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: CustomColors.mainColor,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      tr('reg.subscriber_count',
                          {'count': category['total_subscribers']}),
                      style: const TextStyle(
                        fontSize: 10.0,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            trailing: Container(
              height: 30.0,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8.0),
                color:
                    isSelected ? Colors.white10 : CustomColors.mainColor,
              ),
              child: TextButton(
                onPressed: () => toggleCategory(category),
                child: Text(
                  isSelected ? tr('reg.selected') : tr('reg.select'),
                  style: TextStyle(
                    fontSize: 10.0,
                    color: isSelected ? Colors.white : Colors.black,
                  ),
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}