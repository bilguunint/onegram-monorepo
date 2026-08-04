/// Home screen, news screens and the shared repository/model messages.
/// Keys are prefixed `home.`; anything shared with other features lives in
/// `common.dart` and must be reused from there instead of duplicated here.
const Map<String, Map<String, String>> kHomeMiscTranslations = {
  // ---------------------------------------------------------------- greetings
  'home.greeting_morning': {
    'mn': 'Өглөөний мэнд',
    'en': 'Good morning',
    'zh': '早上好',
    'ru': 'Доброе утро'
  },
  'home.greeting_afternoon': {
    'mn': 'Өдрийн мэнд',
    'en': 'Good afternoon',
    'zh': '下午好',
    'ru': 'Добрый день'
  },
  'home.greeting_evening': {
    'mn': 'Оройн мэнд',
    'en': 'Good evening',
    'zh': '晚上好',
    'ru': 'Добрый вечер'
  },

  // -------------------------------------------------------------- home screen
  'home.no_data': {
    'mn': 'Мэдээлэл олдсонгүй.',
    'en': 'No data found.',
    'zh': '未找到数据。',
    'ru': 'Данные не найдены.'
  },
  'home.my_valuables': {
    'mn': 'Миний үнэт эдлэл',
    'en': 'My valuables',
    'zh': '我的贵金属',
    'ru': 'Мои ценности'
  },
  'home.todays_rate': {
    'mn': 'Өнөөдрийн ханш',
    'en': "Today's rate",
    'zh': '今日价格',
    'ru': 'Курс на сегодня'
  },
  'home.orders': {'mn': 'Захиалга', 'en': 'Orders', 'zh': '订单', 'ru': 'Заказы'},
  'home.see_all': {'mn': 'Бүгд', 'en': 'All', 'zh': '全部', 'ru': 'Все'},

  // Registration-completeness dialog
  'home.registration_incomplete_title': {
    'mn': 'Бүртгэлээ бүрэн бөглөнө үү.',
    'en': 'Please complete your registration.',
    'zh': '请完善您的注册信息。',
    'ru': 'Пожалуйста, заполните регистрацию полностью.'
  },
  'home.registration_incomplete_body': {
    'mn':
        'Та өөрийн бүртгэлийг бүрэн бөглөнө үү. Энэ нь таны нэвтрэх болон алтаа баталгаажуулахад шаардлагатай.',
    'en':
        'Please fill in your profile completely. It is required to sign in and to verify your gold.',
    'zh': '请完整填写您的资料。这是登录和验证您的黄金所必需的。',
    'ru':
        'Пожалуйста, заполните профиль полностью. Это необходимо для входа и подтверждения вашего золота.'
  },
  'home.update_registration': {
    'mn': 'Бүртгэл шинэчлэх',
    'en': 'Update profile',
    'zh': '更新资料',
    'ru': 'Обновить профиль'
  },

  // ------------------------------------------------------------- balance card
  'home.gold_label': {
    'mn': 'Алт:',
    'en': 'Gold:',
    'zh': '黄金：',
    'ru': 'Золото:'
  },
  'home.silver_label': {
    'mn': 'Мөнгө:',
    'en': 'Silver:',
    'zh': '白银：',
    'ru': 'Серебро:'
  },
  'home.grams_short': {
    'mn': '{quantity}гр',
    'en': '{quantity}g',
    'zh': '{quantity}克',
    'ru': '{quantity}г'
  },
  'home.lan_short': {
    'mn': '{quantity}лан',
    'en': '{quantity} lan',
    'zh': '{quantity}两',
    'ru': '{quantity} лан'
  },
  'home.action_order': {
    'mn': 'Захиалах',
    'en': 'Buy',
    'zh': '购买',
    'ru': 'Купить'
  },
  'home.action_gift': {
    'mn': 'Бэлэглэх',
    'en': 'Gift',
    'zh': '赠送',
    'ru': 'Подарить'
  },
  'home.action_withdraw': {
    'mn': 'Биетээр авах',
    'en': 'Withdraw',
    'zh': '实物提取',
    'ru': 'Забрать'
  },
  'home.balance_load_error': {
    'mn': 'Мэдээлэл ачаалахад алдаа гарлаа',
    'en': 'Could not load your data',
    'zh': '加载数据失败',
    'ru': 'Не удалось загрузить данные'
  },

  // ------------------------------------------------------------ orders widget
  'home.no_orders': {
    'mn': 'Захиалга байхгүй байна.',
    'en': 'No orders yet.',
    'zh': '暂无订单。',
    'ru': 'Заказов пока нет.'
  },

  // ----------------------------------------------------------- lottery / promo
  'home.promotion': {
    'mn': 'Урамшуулал',
    'en': 'Promotion',
    'zh': '活动',
    'ru': 'Акция'
  },
  'home.days_left': {
    'mn': '{days} өдөр үлдсэн',
    'en': '{days} days left',
    'zh': '剩余{days}天',
    'ru': 'Осталось {days} дн.'
  },
  'home.total_tickets': {
    'mn': 'Нийт сугалааны эрх: ',
    'en': 'Tickets: ',
    'zh': '抽奖券：',
    'ru': 'Билеты: '
  },

  // ------------------------------------------------------------- installments
  'home.installment_title': {
    'mn': 'Хуваан төлөөд ав',
    'en': 'Buy in instalments',
    'zh': '分期购买',
    'ru': 'Купить в рассрочку'
  },
  'home.no_products': {
    'mn': 'Бүтээгдэхүүн алга',
    'en': 'No products',
    'zh': '暂无商品',
    'ru': 'Нет товаров'
  },
  'home.daily_amount': {
    'mn': 'Өдөр бүр {amount}',
    'en': '{amount} / day',
    'zh': '每日{amount}',
    'ru': '{amount} в день'
  },
  'home.my_installment': {
    'mn': 'Миний хуваан төлөлт',
    'en': 'My instalment',
    'zh': '我的分期',
    'ru': 'Моя рассрочка'
  },
  'home.days_progress': {
    'mn': '{paid}/{total} өдөр',
    'en': '{paid}/{total} days',
    'zh': '{paid}/{total}天',
    'ru': '{paid}/{total} дн.'
  },
  'home.view_details': {
    'mn': 'Дэлгэрэнгүй харах',
    'en': 'View details',
    'zh': '查看详情',
    'ru': 'Подробнее'
  },
  'home.make_next_payment': {
    'mn': 'Дараагийн төлөлт хийх',
    'en': 'Pay next instalment',
    'zh': '支付下一期',
    'ru': 'Оплатить следующий'
  },

  // -------------------------------------------------- Morin khuur campaign card
  'home.support_campaign': {
    'mn': 'Дэмжлэгийн аян',
    'en': 'Support campaign',
    'zh': '支持活动',
    'ru': 'Кампания поддержки'
  },
  'home.morin_khuur_center_name': {
    'mn': 'Дэлхийн морин хуурын төв цогцолбор',
    'en': 'World Morin Khuur Center Complex',
    'zh': '世界马头琴中心综合体',
    'ru': 'Всемирный центр морин хуура'
  },
  'home.trees_label': {'mn': 'мод', 'en': 'trees', 'zh': '棵树', 'ru': 'дер.'},
  'home.supporters_label': {
    'mn': 'дэмжигч',
    'en': 'supporters',
    'zh': '支持者',
    'ru': 'сторонн.'
  },

  // ------------------------------------------------------------- loan service
  'home.loan_service': {
    'mn': 'Зээлийн үйлчилгээ',
    'en': 'Loan service',
    'zh': '贷款服务',
    'ru': 'Кредитные услуги'
  },
  'home.loan_coming_soon_body': {
    'mn':
        'Алтаа барьцаалаад зээл авах боломж тун удахгүй нээгдэнэ. Манай шинэ үйлчилгээг хүлээж байгаарай!',
    'en':
        'Loans against your gold are coming very soon. Stay tuned for our new service!',
    'zh': '黄金抵押贷款即将上线。敬请期待我们的新服务！',
    'ru':
        'Кредиты под залог золота появятся совсем скоро. Следите за нашим новым сервисом!'
  },
  'home.got_it': {
    'mn': 'Ойлголоо',
    'en': 'Got it',
    'zh': '知道了',
    'ru': 'Понятно'
  },
  'home.loan_card_subtitle': {
    'mn': 'Алтаа барьцаалаад зээлээ ав',
    'en': 'Borrow against your gold',
    'zh': '黄金抵押借款',
    'ru': 'Кредит под залог золота'
  },
  'home.gold_backed_loan': {
    'mn': 'Алт барьцаалсан зээл',
    'en': 'Gold-backed loan',
    'zh': '黄金抵押贷款',
    'ru': 'Кредит под залог золота'
  },

  // ----------------------------------------------------------------- safebox
  'home.my_safebox': {
    'mn': 'Миний сейф',
    'en': 'My vault',
    'zh': '我的保险箱',
    'ru': 'Мой сейф'
  },
  'home.date_not_found': {
    'mn': 'Огноо олдсонгүй',
    'en': 'No date',
    'zh': '无日期',
    'ru': 'Нет даты'
  },

  // -------------------------------------------------------------------- news
  'home.news': {'mn': 'Мэдээ', 'en': 'News', 'zh': '新闻', 'ru': 'Новости'},
  'home.no_news': {
    'mn': 'Мэдээ байхгүй байна.',
    'en': 'No news yet.',
    'zh': '暂无新闻。',
    'ru': 'Новостей пока нет.'
  },
  'home.no_news_found': {
    'mn': 'Мэдээ олдсонгүй',
    'en': 'No news found',
    'zh': '未找到新闻',
    'ru': 'Новости не найдены'
  },
  'home.untitled_news': {
    'mn': 'Гарчиггүй мэдээ',
    'en': 'Untitled article',
    'zh': '无标题新闻',
    'ru': 'Без заголовка'
  },
  'home.days_ago': {
    'mn': '{count} өдрийн өмнө',
    'en': '{count} days ago',
    'zh': '{count}天前',
    'ru': '{count} дн. назад'
  },
  'home.hours_ago': {
    'mn': '{count} цагийн өмнө',
    'en': '{count} hours ago',
    'zh': '{count}小时前',
    'ru': '{count} ч. назад'
  },
  'home.minutes_ago': {
    'mn': '{count} минутын өмнө',
    'en': '{count} min ago',
    'zh': '{count}分钟前',
    'ru': '{count} мин. назад'
  },
  'home.just_now': {
    'mn': 'Саяхан',
    'en': 'Just now',
    'zh': '刚刚',
    'ru': 'Только что'
  },
  'home.original_source': {
    'mn': 'Эх мэдээ',
    'en': 'Original',
    'zh': '原文',
    'ru': 'Источник'
  },
  'home.share': {
    'mn': 'Хуваалцах',
    'en': 'Share',
    'zh': '分享',
    'ru': 'Поделиться'
  },
  'home.source_label': {
    'mn': 'Эх сурвалж:',
    'en': 'Source:',
    'zh': '来源：',
    'ru': 'Источник:'
  },
  'home.url_open_failed': {
    'mn': 'URL нээж чадсангүй: {url}',
    'en': 'Could not open the URL: {url}',
    'zh': '无法打开链接：{url}',
    'ru': 'Не удалось открыть ссылку: {url}'
  },

  // ------------------------------------------------------------- app updates
  'home.update_required_title': {
    'mn': 'Шинэчлэлт хийх шаардлагатай',
    'en': 'Update required',
    'zh': '需要更新',
    'ru': 'Требуется обновление'
  },
  'home.update_required_body': {
    'mn':
        'Таны аппын хувилбар хуучирсан байна. Үргэлжлүүлэхийн тулд шинэчлэлт хийнэ үү.',
    'en': 'Your app version is out of date. Please update to continue.',
    'zh': '您的应用版本过旧。请更新后继续使用。',
    'ru': 'Версия вашего приложения устарела. Обновите его, чтобы продолжить.'
  },
  'home.update_action': {
    'mn': 'Шинэчлэх',
    'en': 'Update',
    'zh': '更新',
    'ru': 'Обновить'
  },

  // -------------------------------------------------------------- metal names
  'home.metal_gold': {'mn': 'Алт', 'en': 'Gold', 'zh': '黄金', 'ru': 'Золото'},
  'home.metal_silver': {
    'mn': 'Мөнгө',
    'en': 'Silver',
    'zh': '白银',
    'ru': 'Серебро'
  },

  // ------------------------------------------------- repository / gift errors
  'home.invalid_server_response': {
    'mn': 'Серверээс буруу өгөгдөл ирлээ.',
    'en': 'The server returned invalid data.',
    'zh': '服务器返回的数据无效。',
    'ru': 'Сервер вернул некорректные данные.'
  },
  'home.invalid_phone_format': {
    'mn':
        'Утасны дугаар буруу байна. +976XXXXXXXX эсвэл 8 оронтой дугаар оруулна уу.',
    'en': 'Invalid phone number. Enter +976XXXXXXXX or an 8-digit number.',
    'zh': '电话号码无效。请输入 +976XXXXXXXX 或 8 位号码。',
    'ru': 'Неверный номер телефона. Введите +976XXXXXXXX или 8-значный номер.'
  },
  'home.quantity_must_be_positive': {
    'mn': 'Тоо хэмжээ 0-ээс их байх ёстой.',
    'en': 'Quantity must be greater than 0.',
    'zh': '数量必须大于 0。',
    'ru': 'Количество должно быть больше 0.'
  },
  'home.invalid_metal_type': {
    'mn': 'Металлын төрөл буруу байна. Алт (1) эсвэл Мөнгө (3)-г сонгоно уу.',
    'en': 'Invalid metal type. Choose Gold (1) or Silver (3).',
    'zh': '金属类型无效。请选择黄金（1）或白银（3）。',
    'ru': 'Неверный тип металла. Выберите золото (1) или серебро (3).'
  },
  'home.not_signed_in_user': {
    'mn': 'Хэрэглэгч нэвтрээгүй байна.',
    'en': 'User is not signed in.',
    'zh': '用户未登录。',
    'ru': 'Пользователь не вошёл в систему.'
  },
  'home.invalid_receiver_phone': {
    'mn': 'Хүлээн авагчийн утасны дугаар буруу байна.',
    'en': "The recipient's phone number is invalid.",
    'zh': '收件人电话号码无效。',
    'ru': 'Неверный номер телефона получателя.'
  },
  'home.invalid_pincode': {
    'mn': 'PIN код буруу байна.',
    'en': 'Incorrect PIN code.',
    'zh': 'PIN 码不正确。',
    'ru': 'Неверный PIN-код.'
  },
  'home.insufficient_balance': {
    'mn': 'Үлдэгдэл хүрэлцэхгүй байна.',
    'en': 'Insufficient balance.',
    'zh': '余额不足。',
    'ru': 'Недостаточно средств.'
  },
  'home.unknown_error': {
    'mn': 'Үл мэдэгдэх алдаа гарлаа.',
    'en': 'An unknown error occurred.',
    'zh': '发生未知错误。',
    'ru': 'Произошла неизвестная ошибка.'
  },
  'home.network_error': {
    'mn': 'Сүлжээний алдаа: {error}',
    'en': 'Network error: {error}',
    'zh': '网络错误：{error}',
    'ru': 'Ошибка сети: {error}'
  },

  // ------------------------------------------------- lottery detail / tickets
  'home.lottery_ends_on': {
    'mn': 'Дуусах: {date}',
    'en': 'Ends: {date}',
    'zh': '截止：{date}',
    'ru': 'Окончание: {date}'
  },
  'home.my_tickets': {
    'mn': 'Миний сугалааны эрхүүд',
    'en': 'My tickets',
    'zh': '我的抽奖券',
    'ru': 'Мои билеты'
  },
  'home.no_tickets': {
    'mn': 'Танд одоогоор сугалааны эрх байхгүй байна.',
    'en': 'You do not have any tickets yet.',
    'zh': '您目前还没有抽奖券。',
    'ru': 'У вас пока нет билетов.'
  },

  // ----------------------------------------------------------- notifications
  'home.notifications_title': {
    'mn': 'Мэдэгдлүүд',
    'en': 'Notifications',
    'zh': '通知',
    'ru': 'Уведомления'
  },
  'home.no_notifications': {
    'mn': 'Мэдэгдэл байхгүй байна.',
    'en': 'No notifications.',
    'zh': '暂无通知。',
    'ru': 'Уведомлений нет.'
  },
  'home.savings_reminder_title': {
    'mn': 'Алтан хуримтлал - {title}',
    'en': 'Gold savings - {title}',
    'zh': '黄金储蓄 - {title}',
    'ru': 'Золотые накопления - {title}'
  },
  'home.savings_reminder_body': {
    'mn': 'Та алтан хуримтлалаа нэмэхээ мартаагүй биз?',
    'en': 'Have you remembered to add to your gold savings?',
    'zh': '您还记得进行黄金储蓄吗？',
    'ru': 'Вы не забыли пополнить свои золотые накопления?'
  },

  // ------------------------------------------------------------ rate widgets
  'home.gold_rate_not_found': {
    'mn': 'Алтны ханш олдсонгүй',
    'en': 'Gold rate not found',
    'zh': '未找到黄金价格',
    'ru': 'Курс золота не найден'
  },
  'home.dollar_rate_not_found': {
    'mn': 'Долларын ханш олдсонгүй',
    'en': 'Dollar rate not found',
    'zh': '未找到美元汇率',
    'ru': 'Курс доллара не найден'
  },
  'home.dollar': {'mn': 'Доллар', 'en': 'Dollar', 'zh': '美元', 'ru': 'Доллар'},
};
