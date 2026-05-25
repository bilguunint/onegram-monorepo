import 'package:flutter/material.dart';
import 'package:rxdart/rxdart.dart';

class TypeChangerBloc {
  final BehaviorSubject<int> _subject = BehaviorSubject<int>();

  setValue(int value) {
    _subject.sink.add(value);
  }

  void drainStream() {
    _subject.add(10);
  }

  @mustCallSuper
  void dispose() async {
    await _subject.drain();
    _subject.close();
  }

  BehaviorSubject<int> get subject => _subject;
}

final typeChangerBloc = TypeChangerBloc();
