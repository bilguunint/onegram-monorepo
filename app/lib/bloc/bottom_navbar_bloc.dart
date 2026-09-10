import 'dart:async';

enum NavBarItem { home, exchange, products, more }

class BottomNavBarBloc {
  /// Одоо дэлгэцэн дээр ажиллаж буй MainScreen-ийн bloc — нүүрний картууд
  /// доод nav-ийн таб руу шууд шилжүүлэхэд ашиглана.
  static BottomNavBarBloc? current;

  final StreamController<NavBarItem> _navBarController =
      StreamController<NavBarItem>.broadcast();

  NavBarItem defaultItem = NavBarItem.home;

  Stream<NavBarItem> get itemStream => _navBarController.stream;

  void pickItem(int i) {
    switch (i) {
      case 0:
        _navBarController.sink.add(NavBarItem.home);
        break;
      case 1:
        _navBarController.sink.add(NavBarItem.exchange);
        break;
      case 2:
        _navBarController.sink.add(NavBarItem.products);
        break;
      case 3:
        _navBarController.sink.add(NavBarItem.more);
        break;
    }
  }

  close() {
    _navBarController.close();
  }
}
