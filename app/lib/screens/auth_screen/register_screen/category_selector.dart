import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/style/app_text.dart';
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
      return Center(
        child: CircularProgressIndicator(
          color: CustomColors.accent,
          strokeWidth: 2.0,
        ),
      );
    }

    final List<Widget> rows = [];
    for (int i = 0; i < categories.length; i++) {
      final category = categories[i];
      final isSelected =
          favoriteCategories.any((c) => c['id'] == category['id']);
      if (i > 0) rows.add(const AppDivider(vertical: 2.0));
      rows.add(
        AppListRow(
          title: category['name'] ?? '',
          subtitle:
              '@${category['slug']}  ·  ${tr('reg.news_count', {'count': category['total_news']})}  ·  ${tr('reg.subscriber_count', {'count': category['total_subscribers']})}',
          onTap: () => toggleCategory(category),
          trailing: _SelectPill(
            selected: isSelected,
            label: isSelected ? tr('reg.selected') : tr('reg.select'),
          ),
        ),
      );
    }

    return AppCard(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 4.0),
      child: Column(children: rows),
    );
  }
}

/// Сонгосон / сонгоогүй төлөвийн жижиг pill — accent = сонгосон
class _SelectPill extends StatelessWidget {
  const _SelectPill({required this.selected, required this.label});

  final bool selected;
  final String label;

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 150),
      padding: const EdgeInsets.symmetric(horizontal: 10.0, vertical: 6.0),
      decoration: BoxDecoration(
        color: selected ? CustomColors.accent : CustomColors.surfaceAlt,
        borderRadius: BorderRadius.circular(12.0),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (selected) ...[
            const Icon(Icons.check_rounded, size: 14.0, color: Colors.black),
            const SizedBox(width: 4.0),
          ],
          Text(
            label,
            style: AppText.label.copyWith(
              color: selected ? Colors.black : Colors.white,
              fontFamily: selected ? AppText.bold : AppText.medium,
              fontWeight: selected ? FontWeight.bold : FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
