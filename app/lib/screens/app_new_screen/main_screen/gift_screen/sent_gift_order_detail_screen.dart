import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:intl/intl.dart';
import 'package:ionicons/ionicons.dart';
import 'package:lottie/lottie.dart';
import 'package:onegrgold/models/gift_order_model.dart';
import '../../../../repositories/user_repository.dart';
import '../../../../style/colors.dart';
import '../../../../bloc/cancel_gift_bloc/cancel_gift_bloc.dart';
import '../../../../bloc/cancel_gift_bloc/cancel_gift_event.dart';
import '../../../../bloc/cancel_gift_bloc/cancel_gift_state.dart';

class SentGiftOrderDetailScreen extends StatefulWidget {
  const SentGiftOrderDetailScreen({
    super.key,
    required this.giftOrder,
    required this.userRepository,
  });
  
  final GiftOrder giftOrder;
  final UserRepository userRepository;

  @override
  State<SentGiftOrderDetailScreen> createState() => _SentGiftOrderDetailScreenState();
}

class _SentGiftOrderDetailScreenState extends State<SentGiftOrderDetailScreen> {
  final currencyFormatter = NumberFormat();

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => CancelGiftBloc(userRepository: widget.userRepository),
      child: BlocListener<CancelGiftBloc, CancelGiftState>(
        listener: (context, state) {
          if (state is CancelGiftSuccess) {
            Navigator.pop(context);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  'Бэлэг амжилттай цуцлагдлаа.',
                  style: const TextStyle(color: Colors.white),
                ),
                backgroundColor: CustomColors.successGreen,
                duration: const Duration(seconds: 3),
              ),
            );
          } else if (state is CancelGiftFailure) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  'Бэлэг цуцлахад алдаа гарлаа: ${state.error}',
                  style: const TextStyle(color: Colors.white),
                ),
                backgroundColor: CustomColors.alerRed,
                duration: const Duration(seconds: 3),
              ),
            );
          }
        },
        child: _buildScreen(context),
      ),
    );
  }

  Widget _buildScreen(BuildContext context) {
    return Scaffold(
      backgroundColor: CustomColors.scaffoldDarkBack,
      appBar: AppBar(
        backgroundColor: CustomColors.scaffoldDarkBack,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Илгээсэн бэлгийн дэлгэрэнгүй',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Expanded(
              child: ListView(
                children: [
                  SizedBox(
                    width: 150.0,
                    height: 150.0,
                    child: Lottie.asset("assets/icons/animation-gift.json"),
                  ),
                  Padding(
                    padding: const EdgeInsets.only(bottom: 0.0, top: 0.0),
                    child: Text(
                      "Бэлэг - ${widget.giftOrder.quantity}гр алт",
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 18.0,
                        fontFamily: "InterBold",
                        color: Colors.white,
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.only(bottom: 16.0),
                    child: Text(
                      "Та ${widget.giftOrder.receiver.phone} утасны дугаартай хэрэглэгчрүү ${widget.giftOrder.quantity}${widget.giftOrder.metalId == 1 ? 'гр алт' : 'лан мөнгө'} бэлэг болгон илгээсэн байна.",
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 14.0,
                        color: Colors.white60,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16.0),
                  _buildDetailRow("Хүлээн авагчийн дугаар:", widget.giftOrder.receiver.phone),
                  const SizedBox(height: 16.0),
                  _buildDetailRow("Бэлэглэсэн хэмжээ:", "${widget.giftOrder.quantity}${widget.giftOrder.metalId == 1 ? 'гр' : 'лан'}"),
                  const SizedBox(height: 16.0),
                  _buildStatusRow("Төлөв:", widget.giftOrder.status),
                  const SizedBox(height: 16.0),
                  _buildDetailRow("Огноо:", _formatDate(widget.giftOrder.createdAt)),
                  const SizedBox(height: 24.0),
                  if (widget.giftOrder.greeting != null && widget.giftOrder.greeting!.isNotEmpty)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16.0),
                      decoration: BoxDecoration(
                        color: CustomColors.inputDarkColor,
                        borderRadius: BorderRadius.circular(12.0),
                        border: Border.all(color: CustomColors.mainColor.withOpacity(0.3)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            "Зурвас:",
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14.0,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 8.0),
                          Text(
                            widget.giftOrder.greeting!,
                            style: TextStyle(
                              fontSize: 14.0,
                              color: CustomColors.mainColor,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
            if (widget.giftOrder.status == "pending")
              SafeArea(
                child: BlocBuilder<CancelGiftBloc, CancelGiftState>(
                  builder: (context, state) {
                    return Container(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: state is CancelGiftLoading
                            ? null
                            : () async {
                                final user = FirebaseAuth.instance.currentUser;
                                if (user != null) {
                                  try {
                                    final token = await user.getIdToken();
                                    if (token != null) {
                                      // Show confirmation dialog
                                      final shouldCancel = await showDialog<bool>(
                                        context: context,
                                        builder: (BuildContext context) {
                                          return AlertDialog(
                                            backgroundColor: CustomColors.scaffoldDarkBack,
                                            title: const Text(
                                              'Бэлэг цуцлах',
                                              style: TextStyle(color: Colors.white),
                                            ),
                                            content: const Text(
                                              'Та энэ бэлгийг цуцлахдаа итгэлтэй байна уу?',
                                              style: TextStyle(color: Colors.white70),
                                            ),
                                            actions: [
                                              TextButton(
                                                child: const Text('Үгүй'),
                                                onPressed: () => Navigator.of(context).pop(false),
                                              ),
                                              TextButton(
                                                child: const Text(
                                                  'Тийм',
                                                  style: TextStyle(color: Colors.red),
                                                ),
                                                onPressed: () => Navigator.of(context).pop(true),
                                              ),
                                            ],
                                          );
                                        },
                                      );
                                      
                                      if (shouldCancel == true) {
                                        context.read<CancelGiftBloc>().add(
                                              CancelGiftPressed(
                                                giftId: widget.giftOrder.id,
                                                token: token,
                                              ),
                                            );
                                      }
                                    } else {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(
                                          content: Text('Нэвтрэх токен олдсонгүй'),
                                          backgroundColor: Colors.red,
                                        ),
                                      );
                                    }
                                  } catch (e) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text('Токен авахад алдаа гарлаа: $e'),
                                        backgroundColor: Colors.red,
                                      ),
                                    );
                                  }
                                } else {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Нэвтрээгүй байна'),
                                      backgroundColor: Colors.red,
                                    ),
                                  );
                                }
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: CustomColors.alerRed,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16.0),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12.0),
                          ),
                        ),
                        child: state is CancelGiftLoading
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2.0,
                                ),
                              )
                            : const Text(
                                "Цуцлах",
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16.0,
                                ),
                              ),
                      ),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 14.0,
            color: Colors.white,
          ),
        ),
        Flexible(
          child: Text(
            value,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 14.0,
              color: CustomColors.mainColor,
            ),
            textAlign: TextAlign.end,
          ),
        ),
      ],
    );
  }

  Widget _buildStatusRow(String label, String status) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 14.0,
            color: Colors.white,
          ),
        ),
        Flexible(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              Icon(
                _getStatusIcon(status),
                color: _getStatusColor(status),
                size: 16.0,
              ),
              const SizedBox(width: 6.0),
              Text(
                _getStatusText(status),
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 14.0,
                  color: _getStatusColor(status),
                ),
                textAlign: TextAlign.end,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return CustomColors.textGrey;
      case 'received':
        return CustomColors.successGreen;
      case 'cancelled':
      case 'failed':
        return CustomColors.alerRed;
      default:
        return CustomColors.mainColor;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return Ionicons.time_outline;
      case 'received':
        return Ionicons.checkmark_circle_outline;
      case 'cancelled':
        return Ionicons.close_circle_outline;
      case 'failed':
        return Ionicons.alert_circle_outline;
      default:
        return Ionicons.help_circle_outline;
    }
  }

  String _getStatusText(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Хүлээгдэж байна';
      case 'received':
        return 'Хүлээн авсан';
      case 'cancelled':
        return 'Цуцлагдсан';
      case 'failed':
        return 'Амжилтгүй';
      default:
        return status;
    }
  }

  String _formatDate(DateTime dateTime) {
    return DateFormat('yyyy-MM-dd HH:mm').format(dateTime);
  }
}
