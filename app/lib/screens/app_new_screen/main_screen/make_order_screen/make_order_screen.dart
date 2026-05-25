import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:onegrgold/bloc/make_order_bloc/make_order_bloc.dart';
import 'package:onegrgold/repositories/user_repository.dart';
import 'package:onegrgold/screens/app_new_screen/main_screen/make_order_screen/make_order_view.dart';

class MakeOrderScreen extends StatefulWidget {
  const MakeOrderScreen(
      {super.key,
      required this.userRepository,
      required this.uid,
      required this.metalId
      });
  final UserRepository userRepository;
  final String uid;
  final int metalId;

  @override
  State<MakeOrderScreen> createState() => _MakeOrderScreenState();
}

class _MakeOrderScreenState extends State<MakeOrderScreen> {

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Захиалга өгөх"),
        centerTitle: false,
      ),
      body: BlocProvider(
        create: (context) {
          return MakeOrderBloc(
            userRepository: widget.userRepository,
          );
        },
        child: MakeOrderView(
          userRepository: widget.userRepository,
          uid: widget.uid,
          metalId: widget.metalId,
        ),
      ),
    );
  }
}