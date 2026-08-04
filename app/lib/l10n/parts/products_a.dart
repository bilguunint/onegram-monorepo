/// Product detail, purchase detail and installment-cancellation screens.
///
/// Domain wording is fixed: "хуваан төлөлт" = instalment plan, "урьдчилгаа" =
/// down payment, "буцаан олголт" = refund, "шимтгэл" = fee. Keep these
/// consistent — they describe real money movements.
const Map<String, Map<String, String>> kProductsATranslations = {
  // Kept separate from common.error_with / common.cancel so the Mongolian
  // wording on these screens stays exactly as it shipped.
  'product.error_with': {
    'mn': 'Алдаа: {error}',
    'en': 'Error: {error}',
    'zh': '错误：{error}',
    'ru': 'Ошибка: {error}'
  },
  'product.dismiss': {
    'mn': 'Цуцлах',
    'en': 'Cancel',
    'zh': '取消',
    'ru': 'Отмена'
  },
  // ── Purchase detail ──────────────────────────────────────────────────────
  'product.purchase_title': {
    'mn': 'Худалдан авалт',
    'en': 'Purchase',
    'zh': '购买',
    'ru': 'Покупка'
  },
  'product.yes': {'mn': 'Тийм', 'en': 'Yes', 'zh': '是', 'ru': 'Да'},
  'product.no': {'mn': 'Үгүй', 'en': 'No', 'zh': '否', 'ru': 'Нет'},
  'product.got_it': {'mn': 'За', 'en': 'OK', 'zh': '好的', 'ru': 'Хорошо'},

  'product.cancel_confirm_title': {
    'mn': 'Цуцлахдаа итгэлтэй байна уу?',
    'en': 'Cancel this plan?',
    'zh': '确定要取消吗？',
    'ru': 'Точно отменить?'
  },
  'product.cancel_confirm_body': {
    'mn': 'Хуваан төлөлтийг цуцалснаар нийт төлсөн дүнгээс цуцлалтын шимтгэл '
        '({percent}%) хасагдаж, үлдэгдэл таны данс руу буцаан шилжинэ.',
    'en': 'If you cancel the instalment plan, a cancellation fee ({percent}%) '
        'is deducted from the total you have paid and the remainder is '
        'transferred back to your account.',
    'zh': '取消分期付款后，将从您已付总额中扣除取消手续费（{percent}%），余额将退回您的账户。',
    'ru': 'При отмене рассрочки из общей уплаченной суммы удерживается '
        'комиссия за отмену ({percent}%), а остаток возвращается на ваш счёт.'
  },
  'product.cancel_installment': {
    'mn': 'Хуваан төлөлт цуцлах',
    'en': 'Cancel instalment plan',
    'zh': '取消分期付款',
    'ru': 'Отменить рассрочку'
  },

  'product.payment_history': {
    'mn': 'Төлбөрийн түүх',
    'en': 'Payment history',
    'zh': '付款记录',
    'ru': 'История платежей'
  },
  'product.no_payment_history': {
    'mn': 'Төлбөрийн түүх алга.',
    'en': 'No payments yet.',
    'zh': '暂无付款记录。',
    'ru': 'Платежей пока нет.'
  },
  'product.schedule_summary': {
    'mn': 'Нийт {days} өдөр × {amount} ({months} сар)',
    'en': 'Total {days} days × {amount} ({months} months)',
    'zh': '共 {days} 天 × {amount}（{months} 个月）',
    'ru': 'Всего {days} дней × {amount} ({months} мес.)'
  },
  'product.day_payment': {
    'mn': '{day}-р өдрийн төлбөр',
    'en': 'Day {day} payment',
    'zh': '第 {day} 天付款',
    'ru': 'Платёж за {day}-й день'
  },
  'product.creating_invoice': {
    'mn': 'Нэхэмжлэх үүсгэж байна…',
    'en': 'Creating invoice…',
    'zh': '正在生成账单…',
    'ru': 'Создание счёта…'
  },
  'product.pay_from_day': {
    'mn': 'Төлбөр төлөх ({day}-р өдрөөс, {remaining} үлдсэн)',
    'en': 'Pay (from day {day}, {remaining} left)',
    'zh': '付款（从第 {day} 天起，剩余 {remaining} 天）',
    'ru': 'Оплатить (с {day}-го дня, осталось {remaining})'
  },

  'product.installment_summary': {
    'mn': '{months} сар ({days} өдөр) хуваан төлөх',
    'en': 'Instalment: {months} months ({days} days)',
    'zh': '分期付款：{months} 个月（{days} 天）',
    'ru': 'Рассрочка: {months} мес. ({days} дней)'
  },
  'product.direct_purchase': {
    'mn': 'Шууд худалдан авалт',
    'en': 'Direct purchase',
    'zh': '直接购买',
    'ru': 'Прямая покупка'
  },

  // Purchase statuses
  'product.status_active': {
    'mn': 'Идэвхтэй',
    'en': 'Active',
    'zh': '进行中',
    'ru': 'Активна'
  },
  'product.status_fully_paid': {
    'mn': 'Бүрэн төлөгдсөн',
    'en': 'Fully paid',
    'zh': '已付清',
    'ru': 'Полностью оплачено'
  },
  'product.status_delivered': {
    'mn': 'Хүлээлгэн өгсөн',
    'en': 'Delivered',
    'zh': '已交付',
    'ru': 'Выдано'
  },
  'product.status_cancelled': {
    'mn': 'Цуцлагдсан',
    'en': 'Cancelled',
    'zh': '已取消',
    'ru': 'Отменено'
  },

  // Stat cells
  'product.stat_total': {
    'mn': 'Нийт',
    'en': 'Total',
    'zh': '总计',
    'ru': 'Всего'
  },
  'product.stat_paid': {
    'mn': 'Төлсөн',
    'en': 'Paid',
    'zh': '已付',
    'ru': 'Оплачено'
  },
  'product.stat_remaining': {
    'mn': 'Үлдсэн',
    'en': 'Remaining',
    'zh': '剩余',
    'ru': 'Осталось'
  },

  // Progress card
  'product.days_paid_of': {
    'mn': '{paid}/{total} өдөр төлөгдсөн',
    'en': '{paid}/{total} days paid',
    'zh': '已付 {paid}/{total} 天',
    'ru': 'Оплачено {paid}/{total} дней'
  },
  'product.deadline_with': {
    'mn': 'Дуусах хугацаа: {date}',
    'en': 'Deadline: {date}',
    'zh': '截止日期：{date}',
    'ru': 'Срок: {date}'
  },
  'product.days_overdue': {
    'mn': '{days} өдөр хоцорсон',
    'en': '{days} days overdue',
    'zh': '逾期 {days} 天',
    'ru': 'Просрочено на {days} дн.'
  },
  'product.days_left': {
    'mn': 'Үлдсэн: {days} өдөр',
    'en': '{days} days left',
    'zh': '剩余 {days} 天',
    'ru': 'Осталось: {days} дн.'
  },

  // Cancelled card
  'product.cancel_reason': {
    'mn': 'Шалтгаан: {reason}',
    'en': 'Reason: {reason}',
    'zh': '原因：{reason}',
    'ru': 'Причина: {reason}'
  },
  'product.fee_amount': {
    'mn': 'Шимтгэл: {amount}',
    'en': 'Fee: {amount}',
    'zh': '手续费：{amount}',
    'ru': 'Комиссия: {amount}'
  },
  'product.refunded_amount': {
    'mn': 'Буцаасан дүн: {amount}',
    'en': 'Refunded: {amount}',
    'zh': '已退款：{amount}',
    'ru': 'Возвращено: {amount}'
  },

  // Missed-payment warning
  'product.lapse_critical_title': {
    'mn': 'Цуцлагдах эрсдэлтэй',
    'en': 'At risk of cancellation',
    'zh': '有被取消的风险',
    'ru': 'Риск отмены'
  },
  'product.lapse_warning_title': {
    'mn': 'Төлбөрийн анхааруулга',
    'en': 'Payment reminder',
    'zh': '付款提醒',
    'ru': 'Напоминание о платеже'
  },
  'product.lapse_critical_body': {
    'mn': 'Та {gap} хоног төлбөр хийгээгүй байна. Хуваан төлөлт цуцлагдах '
        'эрсдэлтэй боллоо. Цуцлагдвал төлсөн дүнгээс цуцлах шимтгэл '
        'хасагдана. Төлбөрөө яаралтай хийнэ үү.',
    'en': 'You have not paid for {gap} days. Your instalment plan is at risk '
        'of being cancelled. If it is cancelled, a cancellation fee will be '
        'deducted from the amount you have paid. Please pay as soon as '
        'possible.',
    'zh': '您已 {gap} 天未付款，分期付款有被取消的风险。若被取消，将从您已付金额中扣除取消手续费。请尽快付款。',
    'ru': 'Вы не платили {gap} дней. Ваша рассрочка может быть отменена. При '
        'отмене из уплаченной суммы будет удержана комиссия за отмену. '
        'Пожалуйста, внесите платёж как можно скорее.'
  },
  'product.lapse_warning_body': {
    'mn': 'Та {gap} хоног төлбөр хийгээгүй байна. Дараалсан {threshold} хоног '
        'төлбөр хийхгүй бол хуваан төлөлт цуцлагдаж болзошгүй{extra}. '
        'Төлбөрөө хийж үргэлжлүүлээрэй.',
    'en': 'You have not paid for {gap} days. If you miss {threshold} days in a '
        'row, your instalment plan may be cancelled{extra}. Please keep making '
        'your payments.',
    'zh': '您已 {gap} 天未付款。若连续 {threshold} 天未付款，分期付款可能被取消{extra}。请继续按时付款。',
    'ru': 'Вы не платили {gap} дней. Если платежей не будет {threshold} дней '
        'подряд, рассрочка может быть отменена{extra}. Пожалуйста, продолжайте '
        'вносить платежи.'
  },
  'product.lapse_extra_days': {
    'mn': ' (танд {days} хоног үлдсэн)',
    'en': ' (you have {days} days left)',
    'zh': '（您还剩 {days} 天）',
    'ru': ' (у вас осталось {days} дн.)'
  },
  'product.cancel_pending_banner': {
    'mn': 'Цуцлах хүсэлт илгээгдсэн. Админ шалгаж баталгаажуулсны дараа '
        'хуваан төлөлт цуцлагдаж, буцаан олгох дүн таны данс руу '
        'шилжинэ. Энэ хооронд төлбөр хийх боломжгүй.',
    'en': 'Cancellation request sent. Once an admin reviews and approves it, '
        'the instalment plan will be cancelled and the refund transferred to '
        'your account. No payments can be made in the meantime.',
    'zh': '取消申请已提交。管理员审核确认后，分期付款将被取消，退款将转入您的账户。在此期间无法付款。',
    'ru': 'Запрос на отмену отправлен. После проверки и подтверждения '
        'администратором рассрочка будет отменена, а возврат переведён на ваш '
        'счёт. В это время платежи недоступны.'
  },

  // ── Cancellation request screen ──────────────────────────────────────────
  'product.select_bank_error': {
    'mn': 'Банкаа сонгоно уу.',
    'en': 'Please select a bank.',
    'zh': '请选择银行。',
    'ru': 'Выберите банк.'
  },
  'product.invalid_account': {
    'mn': 'Дансны дугаараа зөв оруулна уу (зөвхөн тоо).',
    'en': 'Enter a valid account number (digits only).',
    'zh': '请输入正确的账号（仅限数字）。',
    'ru': 'Введите корректный номер счёта (только цифры).'
  },
  'product.enter_holder_name': {
    'mn': 'Хүлээн авагчийн нэрийг оруулна уу.',
    'en': 'Enter the account holder name.',
    'zh': '请输入收款人姓名。',
    'ru': 'Введите имя получателя.'
  },
  'product.accept_refund_terms': {
    'mn': 'Буцаан олголтын нөхцөлийг хүлээн зөвшөөрнө үү.',
    'en': 'Please accept the refund terms.',
    'zh': '请接受退款条款。',
    'ru': 'Примите условия возврата.'
  },
  'product.request_sent': {
    'mn': 'Хүсэлт илгээгдлээ',
    'en': 'Request sent',
    'zh': '申请已提交',
    'ru': 'Запрос отправлен'
  },
  'product.cancel_request_sent_body': {
    'mn': 'Таны цуцлах хүсэлтийг админ шалгаж баталгаажуулсны дараа '
        '{amount} ажлын 5 хоногийн дотор таны данс руу шилжинэ.',
    'en': 'Once an admin reviews and approves your cancellation request, '
        '{amount} will be transferred to your account within 5 business days.',
    'zh': '管理员审核确认您的取消申请后，{amount} 将在 5 个工作日内转入您的账户。',
    'ru': 'После проверки и подтверждения администратором вашего запроса на '
        'отмену {amount} будет переведено на ваш счёт в течение 5 рабочих дней.'
  },
  'product.total_paid': {
    'mn': 'Нийт төлсөн дүн',
    'en': 'Total paid',
    'zh': '已付总额',
    'ru': 'Всего оплачено'
  },
  'product.cancel_fee_percent': {
    'mn': 'Цуцлалтын шимтгэл ({percent}%)',
    'en': 'Cancellation fee ({percent}%)',
    'zh': '取消手续费（{percent}%）',
    'ru': 'Комиссия за отмену ({percent}%)'
  },
  'product.refund_amount': {
    'mn': 'Буцаан олгох дүн',
    'en': 'Refund amount',
    'zh': '退款金额',
    'ru': 'Сумма возврата'
  },
  'product.refund_account': {
    'mn': 'Буцаан олголт хүлээн авах данс',
    'en': 'Account to receive the refund',
    'zh': '接收退款的账户',
    'ru': 'Счёт для получения возврата'
  },
  'product.select_bank': {
    'mn': 'Банк сонгох',
    'en': 'Select bank',
    'zh': '选择银行',
    'ru': 'Выберите банк'
  },
  'product.account_number': {
    'mn': 'Дансны дугаар',
    'en': 'Account number',
    'zh': '账号',
    'ru': 'Номер счёта'
  },
  'product.account_holder': {
    'mn': 'Хүлээн авагчийн нэр',
    'en': 'Account holder name',
    'zh': '收款人姓名',
    'ru': 'Имя получателя'
  },
  'product.refund_terms_title': {
    'mn': 'Буцаан олголтын нөхцөл',
    'en': 'Refund terms',
    'zh': '退款条款',
    'ru': 'Условия возврата'
  },
  'product.refund_terms': {
    'mn': '1. Хуваан төлөлтийг цуцлахад нийт төлсөн дүнгээс цуцлалтын шимтгэл ({percent}%) суутгагдана.\n'
        '\n'
        '2. Буцаан олгох дүнг цуцлах хүсэлтийг админ шалгаж баталгаажуулснаас хойш АЖЛЫН 5 ХОНОГИЙН ДОТОР таны заасан банкны данс руу шилжүүлнэ.\n'
        '\n'
        '3. Банк, дансны дугаар, хүлээн авагчийн нэрийг үнэн зөв оруулах нь хэрэглэгчийн хариуцлага бөгөөд буруу мэдээллээс үүдэх хойшлолт, алдааг Компани хариуцахгүй.\n'
        '\n'
        '4. Цуцлах хүсэлт хүлээгдэж байх хугацаанд тухайн хуваан төлөлтөд шинэ төлбөр хийх боломжгүй.\n'
        '\n'
        '5. Цуцлалт баталгаажсаны дараа худалдан авалт сэргээгдэхгүй бөгөөд төлсөн өдрүүд шинэ худалдан авалтад шилжихгүй.\n'
        '\n'
        '6. Буцаан олголт нь зөвхөн хэрэглэгчийн заасан данс руу нэг удаа хийгдэнэ.',
    'en': '1. When an instalment plan is cancelled, a cancellation fee ({percent}%) is deducted from the total amount paid.\n'
        '\n'
        '2. The refund is transferred to the bank account you specify WITHIN 5 BUSINESS DAYS after an admin reviews and approves the cancellation request.\n'
        '\n'
        '3. Entering the bank, account number and account holder name correctly is the responsibility of the user, and the Company is not liable for delays or errors caused by incorrect information.\n'
        '\n'
        '4. While a cancellation request is pending, no new payments can be made on that instalment plan.\n'
        '\n'
        '5. Once the cancellation is confirmed, the purchase cannot be restored and the days already paid cannot be carried over to a new purchase.\n'
        '\n'
        '6. The refund is paid out only once, and only to the account specified by the user.',
    'zh': '1. 取消分期付款时，将从已付总额中扣除取消手续费（{percent}%）。\n'
        '\n'
        '2. 管理员审核确认取消申请后，退款将在 5 个工作日内转入您指定的银行账户。\n'
        '\n'
        '3. 正确填写银行、账号及收款人姓名由用户负责，因信息有误导致的延误或错误，公司概不负责。\n'
        '\n'
        '4. 取消申请审核期间，该分期付款无法进行新的付款。\n'
        '\n'
        '5. 取消确认后，购买不可恢复，已付天数不可转入新的购买。\n'
        '\n'
        '6. 退款仅向用户指定的账户一次性支付。',
    'ru': '1. При отмене рассрочки из общей уплаченной суммы удерживается комиссия за отмену ({percent}%).\n'
        '\n'
        '2. Сумма возврата перечисляется на указанный вами банковский счёт В ТЕЧЕНИЕ 5 РАБОЧИХ ДНЕЙ после проверки и подтверждения запроса на отмену администратором.\n'
        '\n'
        '3. Правильность указания банка, номера счёта и имени получателя — ответственность пользователя, и Компания не несёт ответственности за задержки и ошибки, вызванные неверными данными.\n'
        '\n'
        '4. Пока запрос на отмену находится на рассмотрении, вносить новые платежи по этой рассрочке нельзя.\n'
        '\n'
        '5. После подтверждения отмены покупка не восстанавливается, а уже оплаченные дни не переносятся на новую покупку.\n'
        '\n'
        '6. Возврат выполняется только один раз и только на указанный пользователем счёт.'
  },
  'product.accept_terms_checkbox': {
    'mn': 'Би мөнгөн буцаан олголтын дээрх нөхцөлүүдийг бүрэн '
        'уншиж танилцаж, хүлээн зөвшөөрч байна.',
    'en': 'I have read and fully accept the refund terms above.',
    'zh': '我已阅读并完全接受以上退款条款。',
    'ru': 'Я прочитал(а) и полностью принимаю указанные выше условия возврата.'
  },
  'product.cancel_info_note': {
    'mn': 'Хүсэлтийг админ шалгаж баталгаажуулсны дараа хуваан төлөлт '
        'цуцлагдаж, буцаан олгох дүн ажлын 5 хоногийн дотор дээрх данс '
        'руу шилжинэ. Хүсэлт хүлээгдэж байх хооронд төлбөр хийх '
        'боломжгүй.',
    'en': 'Once an admin reviews and approves the request, the instalment plan '
        'will be cancelled and the refund transferred to the account above '
        'within 5 business days. No payments can be made while the request is '
        'pending.',
    'zh': '管理员审核确认申请后，分期付款将被取消，退款将在 5 个工作日内转入上述账户。申请审核期间无法付款。',
    'ru': 'После проверки и подтверждения запроса администратором рассрочка '
        'будет отменена, а возврат переведён на указанный счёт в течение 5 '
        'рабочих дней. Пока запрос на рассмотрении, платежи недоступны.'
  },

  // ── Product detail ───────────────────────────────────────────────────────
  'product.active_installment_exists': {
    'mn': 'Танд аль хэдийн идэвхтэй хуваан төлөлт байна.',
    'en': 'You already have an active instalment plan.',
    'zh': '您已有正在进行的分期付款。',
    'ru': 'У вас уже есть активная рассрочка.'
  },
  'product.active_installment_banner': {
    'mn': 'Танд аль хэдийн идэвхтэй хуваан төлөлт байна. '
        'Уг хуваан төлөлтөө дуусгасны дараа шинэ худалдан авалт '
        'хийх боломжтой болно.',
    'en': 'You already have an active instalment plan. You can make a new '
        'purchase once it is completed.',
    'zh': '您已有正在进行的分期付款。完成后方可进行新的购买。',
    'ru': 'У вас уже есть активная рассрочка. Новую покупку можно оформить '
        'после её завершения.'
  },
  'product.installment_day_one_title': {
    'mn': 'Хуваан төлөлт — 1-р өдөр',
    'en': 'Instalment — day 1',
    'zh': '分期付款 — 第 1 天',
    'ru': 'Рассрочка — 1-й день'
  },
  'product.installment_started': {
    'mn': 'Хуваан төлөлт эхэллээ',
    'en': 'Instalment plan started',
    'zh': '分期付款已开始',
    'ru': 'Рассрочка началась'
  },
  'product.installment_started_message': {
    'mn': 'Эхний өдрийн {amount} төлбөр амжилттай төлөгдлөө. '
        'Цаашид өдөр бүр төлбөрөө хийгээрэй ({months} сарын дотор).',
    'en': 'The first day payment of {amount} went through. Keep paying every '
        'day (within {months} months).',
    'zh': '第 1 天的 {amount} 已成功支付。请继续每日付款（{months} 个月内完成）。',
    'ru': 'Платёж за первый день на {amount} прошёл успешно. Продолжайте '
        'платить ежедневно (в течение {months} мес.).'
  },
  'product.stock_remaining': {
    'mn': 'Үлдсэн: {count} ширхэг',
    'en': 'Remaining: {count} pcs',
    'zh': '剩余：{count} 件',
    'ru': 'Осталось: {count} шт.'
  },
  'product.description': {
    'mn': 'Тайлбар',
    'en': 'Description',
    'zh': '描述',
    'ru': 'Описание'
  },
  'product.duration': {
    'mn': 'Хугацаа',
    'en': 'Duration',
    'zh': '期限',
    'ru': 'Срок'
  },
  'product.months_value': {
    'mn': '{months} сар',
    'en': '{months} months',
    'zh': '{months} 个月',
    'ru': '{months} мес.'
  },
  'product.months_range': {
    'mn': '{min}-{max} сар',
    'en': '{min}-{max} months',
    'zh': '{min}-{max} 个月',
    'ru': '{min}-{max} мес.'
  },
  'product.cancel_fee': {
    'mn': 'Цуцлах шимтгэл',
    'en': 'Cancellation fee',
    'zh': '取消手续费',
    'ru': 'Комиссия за отмену'
  },
  'product.unavailable': {
    'mn': 'Энэ бараа одоогоор боломжгүй байна.',
    'en': 'This item is currently unavailable.',
    'zh': '该商品暂时无法购买。',
    'ru': 'Этот товар сейчас недоступен.'
  },
  'product.total_price': {
    'mn': 'Нийт үнэ',
    'en': 'Total price',
    'zh': '总价',
    'ru': 'Общая цена'
  },
  'product.installment_hint': {
    'mn': 'Хуваан төлөхөд {months} сар, өдөр бүр {amount}',
    'en': 'Instalment: {months} months, {amount} per day',
    'zh': '分期：{months} 个月，每日 {amount}',
    'ru': 'Рассрочка: {months} мес., по {amount} в день'
  },
  'product.buy_installment': {
    'mn': 'Хуваан авах',
    'en': 'Buy in instalments',
    'zh': '分期购买',
    'ru': 'В рассрочку'
  },
  'product.buy_direct': {
    'mn': 'Шууд авах',
    'en': 'Buy now',
    'zh': '立即购买',
    'ru': 'Купить сразу'
  },
  'product.direct_purchase_confirm': {
    'mn':
        'Та {amount}-аар нэг удаа төлж бараагаа шууд авах гэж байна. Та итгэлтэй байна уу?',
    'en': 'You are about to pay {amount} in a single payment and receive the '
        'item right away. Are you sure?',
    'zh': '您将一次性支付 {amount} 并立即获得商品。确定吗？',
    'ru': 'Вы собираетесь оплатить {amount} одним платежом и сразу получить '
        'товар. Продолжить?'
  },
  'product.yes_buy': {
    'mn': 'Тийм, авах',
    'en': 'Yes, buy',
    'zh': '确认购买',
    'ru': 'Да, купить'
  },
};
