/// Purchase flow: products catalog + card, installment setup / day selection,
/// QPay payment screens, my-purchases list, pickup-ready view and the
/// product repository error messages.
///
/// Shared sentences (OK / Cancel / "Төлөх дүн" / "Банкны апп" / sign-in and
/// server errors) live in `common.dart` and are reused from there.
const Map<String, Map<String, String>> kProductsBTranslations = {
  // ---------------------------------------------------------------------
  // Catalog (products_screen.dart, product_card_widget.dart)
  // ---------------------------------------------------------------------
  'purchase.products_title': {
    'mn': 'Бүтээгдэхүүн',
    'en': 'Products',
    'zh': '商品',
    'ru': 'Товары'
  },
  'purchase.no_products': {
    'mn': 'Одоогоор бүтээгдэхүүн алга',
    'en': 'No products available yet',
    'zh': '暂无商品',
    'ru': 'Товаров пока нет'
  },
  'purchase.products_load_error': {
    'mn': 'Бүтээгдэхүүн ачаалахад алдаа гарлаа',
    'en': 'Failed to load products',
    'zh': '加载商品失败',
    'ru': 'Не удалось загрузить товары'
  },
  'purchase.daily_with_months': {
    'mn': 'Өдөр бүр {amount} ({months} сар)',
    'en': '{amount} per day ({months} mo)',
    'zh': '每日 {amount}（{months}个月）',
    'ru': '{amount} в день ({months} мес.)'
  },

  // ---------------------------------------------------------------------
  // Pickup-ready banner (products_screen.dart)
  // ---------------------------------------------------------------------
  'purchase.pickup_ready': {
    'mn': 'Хүлээж авахад бэлэн',
    'en': 'Ready for pickup',
    'zh': '可以取货',
    'ru': 'Готово к получению'
  },
  'purchase.view_pickup_code': {
    'mn': '{product} — авах кодоо харах',
    'en': '{product} — view pickup code',
    'zh': '{product} — 查看取货码',
    'ru': '{product} — посмотреть код получения'
  },

  // ---------------------------------------------------------------------
  // My purchases (my_purchases_screen.dart)
  // ---------------------------------------------------------------------
  'purchase.my_purchases': {
    'mn': 'Миний худалдан авалт',
    'en': 'My purchases',
    'zh': '我的购买',
    'ru': 'Мои покупки'
  },
  'purchase.days_progress': {
    'mn': '{paid}/{total} өдөр',
    'en': '{paid}/{total} days',
    'zh': '{paid}/{total} 天',
    'ru': '{paid}/{total} дн.'
  },
  'purchase.direct_short': {
    'mn': 'Шууд авалт',
    'en': 'Direct',
    'zh': '直接购买',
    'ru': 'Прямая покупка'
  },
  'purchase.deadline_with_date': {
    'mn': 'Дуусах хугацаа: {date}',
    'en': 'Deadline: {date}',
    'zh': '截止日期：{date}',
    'ru': 'Срок окончания: {date}'
  },
  'purchase.status_active': {
    'mn': 'Идэвхтэй',
    'en': 'Active',
    'zh': '进行中',
    'ru': 'Активна'
  },
  'purchase.status_paid': {
    'mn': 'Төлөгдсөн',
    'en': 'Paid',
    'zh': '已付清',
    'ru': 'Оплачено'
  },
  'purchase.status_delivered': {
    'mn': 'Хүлээлгэн өгсөн',
    'en': 'Handed over',
    'zh': '已交付',
    'ru': 'Выдано'
  },
  'purchase.status_cancelled': {
    'mn': 'Цуцлагдсан',
    'en': 'Cancelled',
    'zh': '已取消',
    'ru': 'Отменено'
  },
  'purchase.empty_title': {
    'mn': 'Худалдан авалт байхгүй байна',
    'en': 'No purchases yet',
    'zh': '暂无购买记录',
    'ru': 'Покупок пока нет'
  },
  'purchase.empty_subtitle': {
    'mn':
        'Бүтээгдэхүүн сонгож хуваан төлөх эсвэл шууд худалдан авалт хийгээрэй.',
    'en': 'Pick a product and pay in instalments, or buy it outright.',
    'zh': '选择商品，可分期付款或直接购买。',
    'ru': 'Выберите товар и оплатите в рассрочку или купите сразу.'
  },
  'purchase.load_error': {
    'mn': 'Худалдан авалт ачаалахад алдаа гарлаа',
    'en': 'Failed to load purchases',
    'zh': '加载购买记录失败',
    'ru': 'Не удалось загрузить покупки'
  },

  // ---------------------------------------------------------------------
  // Active installment banner (active_purchase_banner.dart)
  // ---------------------------------------------------------------------
  'purchase.active_purchase': {
    'mn': 'Идэвхтэй худалдан авалт',
    'en': 'Active purchase',
    'zh': '进行中的购买',
    'ru': 'Активная покупка'
  },
  'purchase.total_with': {
    'mn': 'Нийт: {amount}',
    'en': 'Total: {amount}',
    'zh': '合计：{amount}',
    'ru': 'Итого: {amount}'
  },
  'purchase.days_paid': {
    'mn': '{paid}/{total} өдөр төлөгдсөн',
    'en': '{paid}/{total} days paid',
    'zh': '已付 {paid}/{total} 天',
    'ru': 'Оплачено {paid}/{total} дн.'
  },
  'purchase.daily': {
    'mn': 'Өдөр бүр',
    'en': 'Per day',
    'zh': '每日',
    'ru': 'В день'
  },
  'purchase.paid': {'mn': 'Төлсөн', 'en': 'Paid', 'zh': '已付', 'ru': 'Оплачено'},
  'purchase.remaining': {
    'mn': 'Үлдсэн',
    'en': 'Remaining',
    'zh': '剩余',
    'ru': 'Остаток'
  },
  'purchase.deadline': {
    'mn': 'Дуусах хугацаа',
    'en': 'Deadline',
    'zh': '截止日期',
    'ru': 'Срок окончания'
  },

  // ---------------------------------------------------------------------
  // Installment setup sheet (installment_setup_sheet.dart)
  // ---------------------------------------------------------------------
  'purchase.installment_plan_title': {
    'mn': 'Хуваан төлөх төлөвлөгөө',
    'en': 'Instalment plan',
    'zh': '分期付款方案',
    'ru': 'План рассрочки'
  },
  'purchase.total_price': {
    'mn': 'Нийт үнэ',
    'en': 'Total price',
    'zh': '总价',
    'ru': 'Полная стоимость'
  },
  'purchase.selected_term': {
    'mn': 'Сонгосон хугацаа',
    'en': 'Selected term',
    'zh': '所选期限',
    'ru': 'Выбранный срок'
  },
  'purchase.months_days': {
    'mn': '{months} сар ({days} өдөр)',
    'en': '{months} mo ({days} days)',
    'zh': '{months}个月（{days}天）',
    'ru': '{months} мес. ({days} дн.)'
  },
  'purchase.select_months': {
    'mn': 'Сар сонгох',
    'en': 'Choose months',
    'zh': '选择月数',
    'ru': 'Выберите месяцы'
  },
  'purchase.n_months': {
    'mn': '{n} сар',
    'en': '{n} mo',
    'zh': '{n}个月',
    'ru': '{n} мес.'
  },
  'purchase.terms_title': {
    'mn': 'Үйлчилгээний нөхцөл',
    'en': 'Terms of service',
    'zh': '服务条款',
    'ru': 'Условия услуги'
  },
  'purchase.terms_accept': {
    'mn': 'Би үйлчилгээний нөхцөлийг бүрэн уншиж танилцлаа, зөвшөөрч байна.',
    'en': 'I have read the terms of service in full and I agree to them.',
    'zh': '我已完整阅读并同意服务条款。',
    'ru': 'Я полностью прочитал(а) условия услуги и согласен(на) с ними.'
  },

  // ---------------------------------------------------------------------
  // Day-selection sheet (installment_day_select_sheet.dart)
  // ---------------------------------------------------------------------
  'purchase.select_days_title': {
    'mn': 'Төлөх өдрүүдээ сонгоно уу',
    'en': 'Choose the days to pay',
    'zh': '请选择要支付的天数',
    'ru': 'Выберите дни для оплаты'
  },
  'purchase.select_days_subtitle': {
    'mn':
        'Дараагийн төлөгдөөгүй өдрөөс эхлэн хэдэн ч өдрийг нэг дор төлж болно.',
    'en':
        'Starting from the next unpaid day you can pay any number of days at once.',
    'zh': '从下一个未付款的日期开始，可一次性支付任意天数。',
    'ru':
        'Начиная со следующего неоплаченного дня можно оплатить любое количество дней сразу.'
  },
  'purchase.preset_one_day': {
    'mn': '1 өдөр',
    'en': '1 day',
    'zh': '1 天',
    'ru': '1 день'
  },
  'purchase.preset_week': {
    'mn': '7 хоног',
    'en': '7 days',
    'zh': '7 天',
    'ru': '7 дней'
  },
  'purchase.preset_month': {
    'mn': '30 хоног',
    'en': '30 days',
    'zh': '30 天',
    'ru': '30 дней'
  },
  'purchase.preset_all_remaining': {
    'mn': 'Үлдсэн бүх өдөр ({count})',
    'en': 'All remaining ({count})',
    'zh': '全部剩余（{count}）',
    'ru': 'Весь остаток ({count})'
  },
  'purchase.selected_days': {
    'mn': 'Сонгосон: {count} өдөр{range}',
    'en': 'Selected: {count} days{range}',
    'zh': '已选：{count} 天{range}',
    'ru': 'Выбрано: {count} дн.{range}'
  },
  'purchase.pay': {'mn': 'Төлөх', 'en': 'Pay', 'zh': '支付', 'ru': 'Оплатить'},

  // ---------------------------------------------------------------------
  // Day labels shared by the payment + day-select screens
  // ---------------------------------------------------------------------
  'purchase.day_single': {
    'mn': '{day}-р өдөр',
    'en': 'Day {day}',
    'zh': '第 {day} 天',
    'ru': 'День {day}'
  },
  'purchase.day_range': {
    'mn': '{from}–{to}-р өдөр',
    'en': 'Days {from}–{to}',
    'zh': '第 {from}–{to} 天',
    'ru': 'Дни {from}–{to}'
  },

  // ---------------------------------------------------------------------
  // Installment payment screen (installment_payment_screen.dart)
  // ---------------------------------------------------------------------
  'purchase.day_payment_title': {
    'mn': '{day} — төлбөр',
    'en': '{day} payment',
    'zh': '{day} 付款',
    'ru': 'Платёж — {day}'
  },
  'purchase.fully_paid_title': {
    'mn': 'Бүрэн төлөгдлөө!',
    'en': 'Paid in full!',
    'zh': '已全部付清！',
    'ru': 'Оплачено полностью!'
  },
  'purchase.payment_success_title': {
    'mn': 'Төлбөр амжилттай',
    'en': 'Payment successful',
    'zh': '付款成功',
    'ru': 'Платёж выполнен'
  },
  'purchase.fully_paid_body': {
    'mn':
        'Та энэ барааны бүх өдрийн төлбөрөө төлж дуусгалаа. Удахгүй барааг хүлээлгэн өгөх болно.',
    'en':
        'You have paid every day for this product. It will be handed over to you shortly.',
    'zh': '您已付清该商品的全部每日款项，商品将尽快交付给您。',
    'ru':
        'Вы оплатили все дни по этому товару. Товар будет выдан вам в ближайшее время.'
  },
  'purchase.day_payment_success_body': {
    'mn': '{day}: {amount} амжилттай төлөгдлөө.',
    'en': '{day}: {amount} paid successfully.',
    'zh': '{day}：{amount} 付款成功。',
    'ru': '{day}: платёж {amount} выполнен успешно.'
  },
  'purchase.auto_refresh_hint_pay': {
    'mn': 'Төлбөр амжилттай төлөгдмөгц дэлгэц автоматаар шинэчлэгдэх '
        'болно. QR кодыг QPay эсвэл банкны апп-аар уншуулж төлбөрөө '
        'хийнэ үү.',
    'en': 'The screen updates automatically as soon as the payment goes '
        'through. Scan the QR code with QPay or your bank app to pay.',
    'zh': '付款成功后页面将自动更新。请使用 QPay 或银行 App 扫描二维码完成付款。',
    'ru': 'Экран обновится автоматически, как только платёж пройдёт. '
        'Отсканируйте QR-код приложением QPay или банка и оплатите.'
  },
  'purchase.ok': {'mn': 'За', 'en': 'OK', 'zh': '好', 'ru': 'ОК'},

  // ---------------------------------------------------------------------
  // Direct purchase payment screen (direct_purchase_payment_screen.dart)
  // ---------------------------------------------------------------------
  'purchase.direct_purchase': {
    'mn': 'Шууд худалдан авалт',
    'en': 'Direct purchase',
    'zh': '直接购买',
    'ru': 'Прямая покупка'
  },
  'purchase.purchase_success': {
    'mn': 'Худалдан авалт амжилттай',
    'en': 'Purchase successful',
    'zh': '购买成功',
    'ru': 'Покупка совершена'
  },
  'purchase.purchase_success_body': {
    'mn': '{product} барааг {amount}-ээр амжилттай худалдан авлаа.',
    'en': 'You have successfully bought {product} for {amount}.',
    'zh': '您已成功以 {amount} 购买 {product}。',
    'ru': 'Вы успешно приобрели {product} за {amount}.'
  },
  'purchase.auto_refresh_hint': {
    'mn': 'Төлбөр амжилттай төлөгдмөгц дэлгэц автоматаар шинэчлэгдэх '
        'болно. QR кодыг QPay эсвэл банкны апп-аар уншуулна уу.',
    'en': 'The screen updates automatically as soon as the payment goes '
        'through. Scan the QR code with QPay or your bank app.',
    'zh': '付款成功后页面将自动更新。请使用 QPay 或银行 App 扫描二维码。',
    'ru': 'Экран обновится автоматически, как только платёж пройдёт. '
        'Отсканируйте QR-код приложением QPay или банка.'
  },

  // ---------------------------------------------------------------------
  // Pickup-ready view (pickup_ready_view.dart)
  // ---------------------------------------------------------------------
  'purchase.congrats': {
    'mn': 'Баяр хүргэе!',
    'en': 'Congratulations!',
    'zh': '恭喜！',
    'ru': 'Поздравляем!'
  },
  'purchase.pickup_ready_subtitle': {
    'mn': 'Та төлбөрөө бүрэн төлж дуусгалаа.\nБараагаа авахад бэлэн боллоо.',
    'en': 'You have paid in full.\nYour item is ready to be picked up.',
    'zh': '您已付清全部款项。\n商品已可领取。',
    'ru': 'Вы полностью оплатили покупку.\nТовар готов к получению.'
  },
  'purchase.months_fully_paid': {
    'mn': '{months} сарын төлбөрийг бүрэн төлсөн',
    'en': 'Paid in full over {months} mo',
    'zh': '{months}个月已付清',
    'ru': 'Полностью оплачено за {months} мес.'
  },
  'purchase.pickup_code_label': {
    'mn': 'Бараа хүлээн авах код',
    'en': 'Pickup code',
    'zh': '取货码',
    'ru': 'Код получения'
  },
  'purchase.pickup_code_hint': {
    'mn': 'Энэхүү кодыг манай ажилтанд үзүүлснээр бараагаа авна.',
    'en': 'Show this code to our staff to collect your item.',
    'zh': '向我们的工作人员出示此码即可领取商品。',
    'ru': 'Покажите этот код нашему сотруднику, чтобы получить товар.'
  },
  'purchase.code_copied': {
    'mn': 'Код хуулагдлаа',
    'en': 'Code copied',
    'zh': '已复制取货码',
    'ru': 'Код скопирован'
  },
  'purchase.copy': {
    'mn': 'Хуулах',
    'en': 'Copy',
    'zh': '复制',
    'ru': 'Копировать'
  },
  'purchase.store_name': {
    'mn': 'Их хаадын чулуу — Төв салбар',
    'en': 'Ikh Khaadyn Chuluu — Main branch',
    'zh': 'Ikh Khaadyn Chuluu — 总店',
    'ru': 'Их хаадын чулуу — Главный филиал'
  },
  'purchase.store_address': {
    'mn':
        'ХУД, 15-р хороо, Махатма Гандигийн гудамж,\nOne Center /Хуучнаар Home Plaza/',
    'en':
        'Khan-Uul district, 15th khoroo, Mahatma Gandhi street,\nOne Center /formerly Home Plaza/',
    'zh': '汗乌拉区15区、圣雄甘地大街，\nOne Center（原 Home Plaza）',
    'ru':
        'Район Хан-Уул, 15-й хороо, ул. Махатмы Ганди,\nOne Center /бывш. Home Plaza/'
  },
  'purchase.store_hours': {
    'mn': 'Өдөр бүр 11:00 — 20:00',
    'en': 'Daily 11:00 — 20:00',
    'zh': '每日 11:00 — 20:00',
    'ru': 'Ежедневно 11:00 — 20:00'
  },
  'purchase.id_required_notice': {
    'mn':
        'Бараагаа авахдаа иргэний үнэмлэхтэйгээ өөрийн биеэр ирнэ үү. Бусдад итгэмжлэн авахуулах боломжгүй.',
    'en':
        'Come in person with your national ID (identity document) to collect your item. It cannot be collected by anyone else on your behalf.',
    'zh': '请本人携带身份证（身份证件）前来领取商品。不可委托他人代领。',
    'ru':
        'Приходите за товаром лично с удостоверением личности (документом). Получение по доверенности невозможно.'
  },

  // ---------------------------------------------------------------------
  // Repository errors (product_repository.dart)
  // ---------------------------------------------------------------------
  'purchase.err_installment_init': {
    'mn': 'Хуваан төлөлтийг эхлүүлж чадсангүй ({code}).',
    'en': 'Could not start the instalment plan ({code}).',
    'zh': '无法开始分期付款（{code}）。',
    'ru': 'Не удалось начать рассрочку ({code}).'
  },
  'purchase.err_create_invoice': {
    'mn': 'Төлбөрийн нэхэмжлэх үүсгэж чадсангүй ({code}).',
    'en': 'Could not create the payment invoice ({code}).',
    'zh': '无法创建付款单（{code}）。',
    'ru': 'Не удалось создать счёт на оплату ({code}).'
  },
  'purchase.err_cancel_request': {
    'mn': 'Цуцлах хүсэлтийг илгээж чадсангүй ({code}).',
    'en': 'Could not send the cancellation request ({code}).',
    'zh': '无法发送取消申请（{code}）。',
    'ru': 'Не удалось отправить запрос на отмену ({code}).'
  },
  'purchase.err_no_qpay_invoice': {
    'mn': 'QPay нэхэмжлэх олдсонгүй.',
    'en': 'QPay invoice not found.',
    'zh': '未找到 QPay 付款单。',
    'ru': 'Счёт QPay не найден.'
  },
  'purchase.err_no_pending_id': {
    'mn': 'pending_id олдсонгүй.',
    'en': 'pending_id not found.',
    'zh': '未找到 pending_id。',
    'ru': 'pending_id не найден.'
  },

  // ---------------------------------------------------------------------
  // Instalment terms of service (installment_setup_sheet.dart)
  // ---------------------------------------------------------------------
  'purchase.terms_text': {
    'mn': '''
ХУВААН ТӨЛӨХ ҮЙЛЧИЛГЭЭНИЙ НӨХЦӨЛ

Энэхүү нөхцөл нь "ИХ ХААДЫН ЧУЛУУ" ХХК ("Компани")-ийн аппликейшнаар дамжуулан үзүүлэх хуваан төлөх үйлчилгээг авахтай холбоотойгоор Компани, Хэрэглэгч хоёрын эрх, үүрэг, хариуцлагыг зохицуулна.

1. ҮЙЛЧИЛГЭЭНИЙ МӨН ЧАНАР
1.1. Хэрэглэгч сонгосон барааны нийт үнийг 1–12 сар (1 сар = 30 хоног) хүртэлх хугацаанд өдөрт ногдох тэнцүү дүнд хуваан тооцно. Жишээ нь: 6 сар сонгосон бол нийт үнэ 180 хоногт хуваагдаж, өдрийн төлбөрийн дүн тодорхойлогдоно.
1.2. Өдрийн төлбөрийн дүн нь "нийт үнэ ÷ нийт хоног" томьёогоор тооцогдоно.

2. ГЭРЭЭ ҮҮСЭХ
2.1. Худалдан авалт нь зөвхөн ЭХНИЙ ӨДРИЙН ТӨЛБӨР амжилттай төлөгдсөн үед системд бүртгэгдэж, талуудын эрх, үүрэг үүснэ. Үүнээс өмнө аливаа үүрэг хариуцлага үүсэхгүй.

3. ТӨЛБӨР
3.1. Хэрэглэгч төлбөрөө аппликейшнд нэвтэрч өөрөө хийх бөгөөд төлбөр амжилттай хийгдсэн эсэхийг аппликейшн дотроос шалгаж болно.
3.2. Төлбөрийг заавал өдөр бүр хийх албагүй. Хэрэглэгч өөрийн санхүүгийн боломжид тохируулан дуртай үедээ, хэдэн ч удаа төлбөрөө хийж болно. Гэхдээ өдөр бүр тогтмол төлснөөр нэг удаагийн төлбөрийн дүн бага байж, санхүүгийн дарамтгүй байх давуу талтай.
3.3. Хэрэглэгч хуваан төлөлтөө тогтмол хийж байх үүрэгтэй. Дараалсан 10 (арав) хоногийн турш ямар нэгэн төлбөр хийгээгүй тохиолдолд төлөлт цуцлагдах эрсдэлтэй (4.3, 4.4-р зүйлийг үзнэ үү).
3.4. Барааны үнэ нь худалдан авалт эхэлсэн өдрийн үнээр тогтоогдох ба төлөлтийн туршид өөрчлөгдөхгүй. Дараа нь барааны үнэ өөрчлөгдсөн нь идэвхтэй төлөлтөд нөлөөлөхгүй.

4. ХУГАЦАА БА ТӨЛБӨРИЙН ҮҮРЭГ
4.1. Хэрэглэгч сонгосон нийт хугацаа ("дуусах хугацаа") дуусахаас өмнө барааны нийт үнийг бүрэн төлж дуусгасан байх үүрэгтэй.
4.2. Дуусах хугацаа дууссанаас хойш ажлын 3 хоногийн дотор төлбөрөө бүрэн төлж дуусгаагүй тохиолдолд гэрээ цуцлагдана. Энэ үед тухайн бараанд заасан цуцлах шимтгэлийг төлсөн нийт дүнгээс хасаж, үлдсэн дүнг Хэрэглэгчийн дансанд буцаан олгоно.
4.3. Хэрэглэгч хуваан төлөлтөө тогтмол хийх үүрэгтэй. Дараалсан 5 (тав) хоногийн турш ямар нэгэн төлбөр хийгээгүй тохиолдолд Хэрэглэгч аппликейшн болон мэдэгдлээр анхааруулга хүлээн авна.
4.4. Хэрэглэгч дараалсан 10 (арав) хоногийн турш ямар нэгэн төлбөр хийгээгүй тохиолдолд Компани тухайн хуваан төлөлтийг цуцлах эрхтэй. Цуцлагдсан тохиолдолд тухайн бараанд заасан цуцлах шимтгэлийг төлсөн нийт дүнгээс хасаж, үлдсэн дүнг Хэрэглэгчийн дансанд буцаан олгоно.

5. БАРАА ГАРДУУЛАЛТ
5.1. Бараа нь БҮХ ТӨЛБӨР БҮРЭН ТӨЛӨГДСӨНИЙ дараа олгогдоно.
5.2. Төлбөр бүрэн дуусахад системээс 6 оронтой авах код үүснэ. Хэрэглэгч уг кодыг "Их хаадын чулуу" төв салбарт өөрийн биеэр, иргэний үнэмлэхийн хамт ирж үзүүлснээр бараагаа гардан авна.
5.3. Төлбөр бүрэн төлөгдөөгүй тохиолдолд бараа олгогдохгүй.

6. ЦУЦЛАЛТ БА БУЦААН ОЛГОЛТ
6.1. Хэрэглэгч төлөлтөө хүссэн үедээ цуцлах эрхтэй.
6.2. Цуцлах тохиолдолд тухайн бараанд заасан цуцлах шимтгэлийн хувийг төлсөн нийт дүнгээс хасаж, үлдэгдлийг ажлын 7 хоногийн дотор Хэрэглэгчийн дансанд буцаан олгоно. Цуцлах шимтгэлийн хэмжээ нь барааны дэлгэрэнгүй хэсэгт тодорхой заасан байна.

7. БУСАД НӨХЦӨЛ
7.1. Хэрэглэгч нэгэн зэрэг ЗӨВХӨН НЭГ идэвхтэй хуваан төлөлттэй байж болно. Шинэ худалдан авалт хийхээс өмнө одоогийн төлөлтөө бүрэн дуусгах эсвэл цуцлах шаардлагатай.
7.2. Хэрэглэгч өөрийн оруулсан мэдээллийн үнэн зөвийг бүрэн хариуцна. Компани нь залилан, хуурамч мэдээлэл, зүй бус үйлдэл илэрсэн тохиолдолд холбогдох худалдан авалтыг цуцлах, цаашид үйлчилгээ үзүүлэхээс татгалзах эрхтэй.
7.3. Хэрэглэгчийн хувийн болон санхүүгийн мэдээллийг зөвхөн үйлчилгээ үзүүлэх, төлбөр тооцоо хийх зорилгоор ашиглах ба нууцлалыг хадгална.
7.4. Бараатай холбоотой чанарын асуудлыг гардан авсны дараа Монгол Улсын холбогдох хууль тогтоомжийн дагуу шийдвэрлэнэ.

8. НӨХЦӨЛИЙН ӨӨРЧЛӨЛТ БА ЗӨВШӨӨРӨЛ
8.1. Энэхүү нөхцөл нь үйлчилгээний шинэчлэлтэй уялдан өөрчлөгдөж болох бөгөөд өөрчлөгдсөн нөхцөл нь хүчин төгөлдөр болсон өдрөөс хойших шинэ худалдан авалтад үйлчилнэ. Аль хэдийн эхэлсэн төлөлтөд эхлэх үеийн нөхцөл хадгалагдана.
8.2. "Зөвшөөрч байна" гэснээр Хэрэглэгч энэхүү нөхцөлийг бүрэн уншиж, ойлгож, хүлээн зөвшөөрсөнд тооцогдоно.
''',
    'en': '''
INSTALMENT SERVICE TERMS AND CONDITIONS

These terms govern the rights, obligations and liabilities of the Company and the User in relation to the instalment service provided by "IKH KHAADYN CHULUU" LLC (the "Company") through its application.

1. NATURE OF THE SERVICE
1.1. The total price of the product chosen by the User is divided into equal daily amounts over a term of 1–12 months (1 month = 30 days). For example: if 6 months is selected, the total price is divided over 180 days and the daily payment amount is determined accordingly.
1.2. The daily payment amount is calculated with the formula "total price ÷ total days".

2. FORMATION OF THE AGREEMENT
2.1. The purchase is registered in the system, and the rights and obligations of the parties arise, only once the FIRST DAY'S PAYMENT has been made successfully. No obligation or liability arises before that.

3. PAYMENTS
3.1. The User makes payments themselves by signing in to the application, and can check inside the application whether a payment went through successfully.
3.2. Payment does not have to be made every day. The User may pay whenever they wish, as many times as they wish, according to their own financial situation. However, paying regularly every day keeps each single payment small and avoids financial strain.
3.3. The User is obliged to keep making instalment payments regularly. If no payment is made for 10 (ten) consecutive days, the plan is at risk of being cancelled (see clauses 4.3 and 4.4).
3.4. The price of the product is fixed at the price on the day the purchase started and does not change during the plan. A later change in the product price does not affect an active plan.

4. TERM AND PAYMENT OBLIGATION
4.1. The User is obliged to pay the full price of the product before the end of the total term they selected (the "deadline").
4.2. If the User has not completed payment in full within 3 business days after the deadline, the agreement is cancelled. In that case the cancellation fee specified for the product is deducted from the total amount paid, and the remainder is refunded to the User's account.
4.3. The User is obliged to make instalment payments regularly. If no payment is made for 5 (five) consecutive days, the User receives a warning in the application and by notification.
4.4. If the User makes no payment for 10 (ten) consecutive days, the Company is entitled to cancel that instalment plan. In case of cancellation, the cancellation fee specified for the product is deducted from the total amount paid, and the remainder is refunded to the User's account.

5. HANDOVER OF THE PRODUCT
5.1. The product is handed over only after ALL PAYMENTS HAVE BEEN PAID IN FULL.
5.2. When payment is complete the system generates a 6-digit pickup code. The User collects the product by presenting that code in person, together with their national ID, at the "Ikh Khaadyn Chuluu" main branch.
5.3. The product is not handed over if payment is not complete.

6. CANCELLATION AND REFUND
6.1. The User is entitled to cancel their plan at any time.
6.2. In case of cancellation, the cancellation fee percentage specified for the product is deducted from the total amount paid, and the balance is refunded to the User's account within 7 business days. The amount of the cancellation fee is clearly stated in the product details.

7. OTHER TERMS
7.1. The User may have ONLY ONE active instalment plan at a time. The current plan must be completed in full or cancelled before making a new purchase.
7.2. The User is fully responsible for the accuracy of the information they provide. The Company is entitled to cancel the relevant purchase and to refuse further service if fraud, false information or improper conduct is detected.
7.3. The User's personal and financial information is used solely to provide the service and to process payments, and is kept confidential.
7.4. Quality issues relating to the product are resolved after handover in accordance with the applicable laws of Mongolia.

8. CHANGES TO THE TERMS AND CONSENT
8.1. These terms may change in line with updates to the service, and the amended terms apply to new purchases made on or after the date they take effect. Plans that have already started keep the terms that were in force when they started.
8.2. By selecting "I agree", the User is deemed to have read, understood and fully accepted these terms.
''',
    'zh': '''
分期付款服务条款

本条款规范“大汗之石”有限责任公司（以下称“公司”）通过其应用程序提供分期付款服务时，公司与用户之间的权利、义务与责任。

1. 服务性质
1.1. 用户所选商品的总价，将按 1–12 个月（1 个月 = 30 天）的期限平均分摊到每一天。例如：选择 6 个月，总价将分摊至 180 天，据此确定每日付款金额。
1.2. 每日付款金额按“总价 ÷ 总天数”计算。

2. 合同成立
2.1. 只有在首日付款成功后，购买才在系统中登记，双方的权利与义务方才产生。在此之前不产生任何义务或责任。

3. 付款
3.1. 用户登录应用程序自行付款，并可在应用内查询付款是否成功。
3.2. 无需每日付款。用户可根据自身财务状况随时付款，次数不限。但坚持每日付款可使每次金额较小，减轻财务压力。
3.3. 用户有义务持续付款。连续 10（十）天未付款的，分期付款存在被取消的风险（见第 4.3、4.4 条）。
3.4. 商品价格以购买开始当日的价格确定，在分期期间不变。此后商品价格的变动不影响进行中的分期付款。

4. 期限与付款义务
4.1. 用户有义务在所选总期限（“到期日”）结束前付清商品全款。
4.2. 到期日后 3 个工作日内仍未付清的，合同解除。此时将从已付总额中扣除该商品规定的取消手续费，余额退还至用户账户。
4.3. 用户有义务定期付款。连续 5（五）天未付款的，用户将在应用内并通过通知收到提醒。
4.4. 用户连续 10（十）天未付款的，公司有权取消该分期付款。取消时，将从已付总额中扣除该商品规定的取消手续费，余额退还至用户账户。

5. 商品交付
5.1. 商品在全部款项付清后方可交付。
5.2. 付款完成后，系统将生成 6 位取货码。用户须本人携带身份证并出示该码，前往“大汗之石”总店领取商品。
5.3. 款项未付清的，不予交付商品。

6. 取消与退款
6.1. 用户有权随时取消分期付款。
6.2. 取消时，将从已付总额中扣除该商品规定的取消手续费比例，余额于 7 个工作日内退还至用户账户。取消手续费的比例在商品详情中明确列明。

7. 其他条款
7.1. 用户同一时间只能有一笔进行中的分期付款。进行新的购买前，须先完成或取消当前分期付款。
7.2. 用户对其所提供信息的真实准确性承担全部责任。如发现欺诈、虚假信息或不当行为，公司有权取消相关购买并拒绝继续提供服务。
7.3. 用户的个人及财务信息仅用于提供服务和结算，并予以保密。
7.4. 与商品有关的质量问题，在交付后依照蒙古国相关法律法规处理。

8. 条款变更与同意
8.1. 本条款可能随服务更新而变更，变更后的条款自生效之日起适用于新的购买。已开始的分期付款仍适用其开始时的条款。
8.2. 用户选择“我同意”，即视为已完整阅读、理解并接受本条款。
''',
    'ru': '''
УСЛОВИЯ УСЛУГИ РАССРОЧКИ

Настоящие условия регулируют права, обязанности и ответственность ООО «ИХ ХААДЫН ЧУЛУУ» («Компания») и Пользователя в связи с получением услуги рассрочки, предоставляемой через приложение Компании.

1. СУЩНОСТЬ УСЛУГИ
1.1. Полная стоимость выбранного Пользователем товара делится на равные ежедневные суммы на срок от 1 до 12 месяцев (1 месяц = 30 дней). Например: при выборе 6 месяцев полная стоимость делится на 180 дней, и таким образом определяется сумма ежедневного платежа.
1.2. Сумма ежедневного платежа рассчитывается по формуле «полная стоимость ÷ общее количество дней».

2. ЗАКЛЮЧЕНИЕ ДОГОВОРА
2.1. Покупка регистрируется в системе, а права и обязанности сторон возникают только после успешной оплаты ПЛАТЕЖА ЗА ПЕРВЫЙ ДЕНЬ. До этого никакие обязательства и ответственность не возникают.

3. ПЛАТЕЖИ
3.1. Пользователь производит оплату самостоятельно, войдя в приложение, и может проверить в приложении, прошёл ли платёж успешно.
3.2. Платить каждый день не обязательно. Пользователь может платить в любое удобное время и любое количество раз, исходя из своих финансовых возможностей. Однако регулярная ежедневная оплата делает каждый отдельный платёж небольшим и позволяет избежать финансовой нагрузки.
3.3. Пользователь обязан вносить платежи по рассрочке регулярно. Если в течение 10 (десяти) дней подряд не внесён ни один платёж, рассрочка рискует быть аннулированной (см. пункты 4.3 и 4.4).
3.4. Цена товара фиксируется по цене на день начала покупки и не меняется в течение срока рассрочки. Последующее изменение цены товара не влияет на действующую рассрочку.

4. СРОК И ОБЯЗАННОСТЬ ПО ОПЛАТЕ
4.1. Пользователь обязан полностью оплатить стоимость товара до окончания выбранного им общего срока («срок окончания»).
4.2. Если Пользователь не завершил оплату в полном объёме в течение 3 рабочих дней после окончания срока, договор расторгается. При этом из общей уплаченной суммы удерживается комиссия за отмену, указанная для данного товара, а остаток возвращается на счёт Пользователя.
4.3. Пользователь обязан вносить платежи по рассрочке регулярно. Если в течение 5 (пяти) дней подряд не внесён ни один платёж, Пользователь получает предупреждение в приложении и через уведомление.
4.4. Если Пользователь не вносит ни одного платежа в течение 10 (десяти) дней подряд, Компания вправе аннулировать данную рассрочку. В случае аннулирования из общей уплаченной суммы удерживается комиссия за отмену, указанная для данного товара, а остаток возвращается на счёт Пользователя.

5. ВЫДАЧА ТОВАРА
5.1. Товар выдаётся только после ПОЛНОЙ ОПЛАТЫ ВСЕЙ СУММЫ.
5.2. По завершении оплаты система формирует 6-значный код получения. Пользователь получает товар, лично предъявив этот код вместе с удостоверением личности в центральном филиале «Их хаадын чулуу».
5.3. При неполной оплате товар не выдаётся.

6. АННУЛИРОВАНИЕ И ВОЗВРАТ СРЕДСТВ
6.1. Пользователь вправе аннулировать рассрочку в любое время.
6.2. При аннулировании из общей уплаченной суммы удерживается процент комиссии за отмену, указанный для данного товара, а остаток возвращается на счёт Пользователя в течение 7 рабочих дней. Размер комиссии за отмену чётко указан в описании товара.

7. ПРОЧИЕ УСЛОВИЯ
7.1. Пользователь может иметь ТОЛЬКО ОДНУ действующую рассрочку одновременно. Перед новой покупкой необходимо полностью завершить или аннулировать текущую рассрочку.
7.2. Пользователь несёт полную ответственность за достоверность предоставленных им сведений. В случае выявления мошенничества, ложных сведений или недобросовестных действий Компания вправе аннулировать соответствующую покупку и отказать в дальнейшем предоставлении услуги.
7.3. Личные и финансовые данные Пользователя используются исключительно для оказания услуги и проведения расчётов и сохраняются в тайне.
7.4. Вопросы качества товара разрешаются после его получения в соответствии с применимым законодательством Монголии.

8. ИЗМЕНЕНИЕ УСЛОВИЙ И СОГЛАСИЕ
8.1. Настоящие условия могут изменяться в связи с обновлением услуги, и изменённые условия применяются к новым покупкам, совершённым с даты вступления изменений в силу. К уже начатым рассрочкам применяются условия, действовавшие на момент их начала.
8.2. Выбирая «Согласен», Пользователь считается полностью прочитавшим, понявшим и принявшим настоящие условия.
''',
  },
};
