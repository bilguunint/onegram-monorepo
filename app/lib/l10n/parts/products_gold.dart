/// Алтан эдлэлийн (грамм дээр суурилсан) хуваан төлөлтийн дэлгэцүүд.
const Map<String, Map<String, String>> kProductsGoldTranslations = {
  'gold.gram_unit': {'mn': 'гр', 'en': 'g', 'zh': '克', 'ru': 'г'},
  'gold.jewelry_badge': {
    'mn': 'Алтан эдлэл',
    'en': 'Gold jewelry',
    'zh': '黄金首饰',
    'ru': 'Золотое изделие',
  },
  'gold.total_grams': {
    'mn': 'Нийт жин',
    'en': 'Total weight',
    'zh': '总重量',
    'ru': 'Общий вес',
  },
  'gold.at_today_rate': {
    'mn': 'өнөөдрийн ханшаар ~{amount}',
    'en': "at today's rate ~{amount}",
    'zh': '按今日金价约 {amount}',
    'ru': 'по курсу дня ~{amount}',
  },
  'gold.card_hint': {
    'mn': 'Өдөр бүр {grams}',
    'en': 'Daily {grams}',
    'zh': '每天 {grams}',
    'ru': 'Ежедневно {grams}',
  },
  'gold.plan_title': {
    'mn': 'Хэрхэн цуглуулах вэ',
    'en': 'How collecting works',
    'zh': '如何积攒',
    'ru': 'Как это работает',
  },
  'gold.min_step': {
    'mn': 'Хамгийн бага алхам',
    'en': 'Minimum step',
    'zh': '最小步长',
    'ru': 'Минимальный шаг',
  },
  'gold.options_title': {
    'mn': 'Өдрийн граммаар тооцвол',
    'en': 'By daily grams',
    'zh': '按每日克数计算',
    'ru': 'По граммам в день',
  },
  'gold.option_row': {
    'mn': '{grams}/өдөр · {amount} · ~{days} өдөр',
    'en': '{grams}/day · {amount} · ~{days} days',
    'zh': '{grams}/天 · {amount} · 约 {days} 天',
    'ru': '{grams}/день · {amount} · ~{days} дн.',
  },
  'gold.rate_note': {
    'mn':
        'Төлбөр бүр тухайн өдрийн ханшаар бодогдох тул нийт дүн ханшийн '
        'өөрчлөлтөөр өөрчлөгдөнө. Хугацааны хатуу хязгаар байхгүй, та өөрийн '
        'хурдаар цуглуулна.',
    'en':
        'Each payment uses that day\'s rate, so the total moves with the '
        'rate. There is no hard deadline; collect at your own pace.',
    'zh': '每笔付款按当日金价计算，总额随金价变动。没有硬性期限，可按自己的节奏积攒。',
    'ru':
        'Каждый платёж по курсу дня, итог меняется вместе с курсом. '
        'Жёсткого срока нет — копите в своём темпе.',
  },
  'gold.price_per_gram': {
    'mn': '1 гр үнэ (ханш + татвар {tax}% + ажлын хөлс {labor})',
    'en': 'Price per gram (rate + {tax}% tax + {labor} labor)',
    'zh': '每克价格（金价 + {tax}% 税 + 工费 {labor}）',
    'ru': 'Цена за грамм (курс + налог {tax}% + работа {labor})',
  },
  'gold.price_per_gram_short': {
    'mn': '1 гр үнэ өнөөдөр',
    'en': 'Price per gram today',
    'zh': '今日每克价格',
    'ru': 'Цена за грамм сегодня',
  },
  'gold.price_formula_hint': {
    'mn': 'Ханш {rate} + татвар {tax}% + ажлын хөлс {labor}/гр',
    'en': 'Rate {rate} + {tax}% tax + {labor}/g labor',
    'zh': '金价 {rate} + {tax}% 税 + 工费 {labor}/克',
    'ru': 'Курс {rate} + налог {tax}% + работа {labor}/г',
  },
  'gold.days_short': {'mn': 'өдөр', 'en': 'days', 'zh': '天', 'ru': 'дн.'},
  'gold.today_rate': {
    'mn': 'Өнөөдрийн алтны ханш',
    'en': "Today's gold rate",
    'zh': '今日金价',
    'ru': 'Курс золота сегодня',
  },
  'gold.how_it_works': {
    'mn':
        'Та өдөр бүр хэдэн грамм цуглуулахаа сонгоно. Төлбөр бүр тухайн '
        'өдрийн ханшаар бодогдоно; нийт {grams}-д хүрмэгц эдлэлээ авна. '
        'Хамгийн бага {step}.',
    'en':
        'Choose how many grams to collect per day. Each payment is priced '
        "at that day's rate; once you reach {grams} the item is yours. "
        'Minimum {step}.',
    'zh': '选择每天积攒的克数。每笔付款按当日金价计算；累计达到 {grams} 即可领取。最低 {step}。',
    'ru':
        'Выберите, сколько граммов копить в день. Каждый платёж по курсу '
        'дня; набрав {grams}, вы получаете изделие. Минимум {step}.',
  },
  'gold.daily_grams': {
    'mn': 'Өдөрт цуглуулах грамм',
    'en': 'Grams per day',
    'zh': '每天克数',
    'ru': 'Граммов в день',
  },
  'gold.today_payment': {
    'mn': 'Өнөөдрийн төлбөр',
    'en': "Today's payment",
    'zh': '今日付款',
    'ru': 'Платёж сегодня',
  },
  'gold.estimated_days': {
    'mn': 'Ойролцоогоор {days} өдөрт дуусна',
    'en': 'About {days} days to complete',
    'zh': '约 {days} 天完成',
    'ru': 'Примерно {days} дней',
  },
  'gold.start_title': {
    'mn': 'Алтан эдлэл цуглуулах',
    'en': 'Collect gold jewelry',
    'zh': '积攒黄金首饰',
    'ru': 'Копить на изделие',
  },
  'gold.first_payment_title': {
    'mn': 'Эхний төлбөр',
    'en': 'First payment',
    'zh': '首次付款',
    'ru': 'Первый платёж',
  },
  'gold.started': {
    'mn': 'Цуглуулалт эхэллээ',
    'en': 'Collection started',
    'zh': '已开始积攒',
    'ru': 'Накопление начато',
  },
  'gold.started_message': {
    'mn':
        '{grams} бүртгэгдлээ. Та өөрт тохирох үедээ дараагийн граммаа '
        'нэмээрэй.',
    'en': '{grams} recorded. Add more grams whenever it suits you.',
    'zh': '已记录 {grams}。随时可以继续积攒。',
    'ru': '{grams} учтено. Добавляйте граммы, когда удобно.',
  },
  'gold.pay_grams_title': {
    'mn': 'Хэдэн грамм төлөх вэ?',
    'en': 'How many grams?',
    'zh': '支付多少克？',
    'ru': 'Сколько граммов?',
  },
  'gold.remaining_grams': {
    'mn': 'Үлдсэн: {grams}',
    'en': 'Remaining: {grams}',
    'zh': '剩余：{grams}',
    'ru': 'Осталось: {grams}',
  },
  'gold.remaining_label': {
    'mn': 'Үлдсэн',
    'en': 'Remaining',
    'zh': '剩余',
    'ru': 'Осталось',
  },
  'gold.all_remaining': {
    'mn': 'Бүгд ({grams})',
    'en': 'All ({grams})',
    'zh': '全部（{grams}）',
    'ru': 'Всё ({grams})',
  },
  'gold.pay_next': {
    'mn': 'Грамм нэмэх',
    'en': 'Add grams',
    'zh': '继续积攒',
    'ru': 'Добавить граммы',
  },
  'gold.grams_paid_of': {
    'mn': '{paid} / {total} цугласан',
    'en': '{paid} / {total} collected',
    'zh': '已积攒 {paid} / {total}',
    'ru': 'Накоплено {paid} / {total}',
  },
  'gold.paid_total_amount': {
    'mn': 'Нийт төлсөн',
    'en': 'Total paid',
    'zh': '已付总额',
    'ru': 'Всего оплачено',
  },
  'gold.summary': {
    'mn': 'Алтан эдлэл · {total} · өдөрт {daily}',
    'en': 'Gold jewelry · {total} · {daily} per day',
    'zh': '黄金首饰 · {total} · 每天 {daily}',
    'ru': 'Изделие · {total} · {daily} в день',
  },
  'gold.history_hint': {
    'mn': 'Төлбөр бүр тухайн өдрийн ханшаар бодогдсон.',
    'en': "Each payment was priced at that day's rate.",
    'zh': '每笔付款按当日金价计算。',
    'ru': 'Каждый платёж — по курсу того дня.',
  },
  'gold.payment_row': {
    'mn': '{grams} · ханш {rate}',
    'en': '{grams} · rate {rate}',
    'zh': '{grams} · 金价 {rate}',
    'ru': '{grams} · курс {rate}',
  },
  'gold.quote_loading': {
    'mn': 'Ханш ачааллаж байна...',
    'en': 'Loading rate...',
    'zh': '正在加载金价...',
    'ru': 'Загрузка курса...',
  },
  'gold.quote_error': {
    'mn': 'Ханш авч чадсангүй. Дахин оролдоно уу.',
    'en': "Couldn't load the rate. Try again.",
    'zh': '无法获取金价，请重试。',
    'ru': 'Не удалось получить курс. Попробуйте снова.',
  },

  // ---------------- Мөнгөн эдлэл (лан) ----------------
  // wtr() нь unit == 'lan' үед доорх `silver.` түлхүүрийг `gold.`-ын оронд
  // ашиглана. Энд байхгүй түлхүүрт `gold.` хувилбар нь хэвээр хэрэглэгдэнэ.
  'silver.lan_unit': {'mn': 'лан', 'en': 'lan', 'zh': '两', 'ru': 'лан'},
  'silver.jewelry_badge': {
    'mn': 'Мөнгөн эдлэл',
    'en': 'Silverware',
    'zh': '银器',
    'ru': 'Серебро',
  },
  'silver.at_today_rate': {
    'mn': 'өнөөдрийн үнээр {amount}',
    'en': "at today's price {amount}",
    'zh': '按今日价格 {amount}',
    'ru': 'по сегодняшней цене {amount}',
  },
  'silver.price_per_gram_short': {
    'mn': '1 лангийн үнэ өнөөдөр',
    'en': 'Price per lan today',
    'zh': '今日每两价格',
    'ru': 'Цена за лан сегодня',
  },
  'silver.today_rate': {
    'mn': '1 лангийн үнэ',
    'en': 'Price per lan',
    'zh': '每两价格',
    'ru': 'Цена за лан',
  },
  'silver.options_title': {
    'mn': 'Өдрийн лангаар тооцвол',
    'en': 'By lan per day',
    'zh': '按每日两数计算',
    'ru': 'По ланам в день',
  },
  'silver.rate_note': {
    'mn':
        'Төлбөр бүр тухайн үеийн 1 лангийн үнээр бодогдоно. Үнэ өөрчлөгдвөл '
        'үлдсэн лангийн төлбөр шинэ үнээр тооцогдоно; аль хэдийн төлсөн лан '
        'хэвээр үлдэнэ. Хатуу хугацаа байхгүй, та өөрийн хурдаар төлнө.',
    'en':
        'Each payment uses the price per lan at that time. If the price '
        'changes, the remaining lan are charged at the new price; lan already '
        'paid stay yours. No hard deadline — pay at your own pace.',
    'zh': '每笔付款按当时的每两价格计算。价格变动时，剩余两数按新价格计算；已付的两数不变。没有硬性期限。',
    'ru':
        'Каждый платёж — по цене за лан на тот момент. При изменении цены '
        'оставшиеся ланы считаются по новой цене; оплаченные остаются за вами. '
        'Жёсткого срока нет.',
  },
  'silver.daily_grams': {
    'mn': 'Өдөрт төлөх лан',
    'en': 'Lan per day',
    'zh': '每天两数',
    'ru': 'Ланов в день',
  },
  'silver.start_title': {
    'mn': 'Лангаар хуваан төлөх',
    'en': 'Pay by lan',
    'zh': '按两分期付款',
    'ru': 'Рассрочка по ланам',
  },
  'silver.started': {
    'mn': 'Хуваан төлөлт эхэллээ',
    'en': 'Installment started',
    'zh': '分期已开始',
    'ru': 'Рассрочка начата',
  },
  'silver.started_message': {
    'mn':
        '{grams} бүртгэгдлээ. Та өөрт тохирох үедээ дараагийн лангаа '
        'төлөөрэй.',
    'en': '{grams} recorded. Pay more lan whenever it suits you.',
    'zh': '已记录 {grams}。随时可以继续支付。',
    'ru': '{grams} учтено. Оплачивайте следующие ланы, когда удобно.',
  },
  'silver.pay_grams_title': {
    'mn': 'Хэдэн лан төлөх вэ?',
    'en': 'How many lan?',
    'zh': '支付多少两？',
    'ru': 'Сколько ланов?',
  },
  'silver.pay_next': {
    'mn': 'Лан төлөх',
    'en': 'Pay lan',
    'zh': '继续支付',
    'ru': 'Оплатить ланы',
  },
  'silver.grams_paid_of': {
    'mn': '{paid} / {total} төлсөн',
    'en': '{paid} / {total} paid',
    'zh': '已付 {paid} / {total}',
    'ru': 'Оплачено {paid} / {total}',
  },
  'silver.summary': {
    'mn': 'Мөнгөн эдлэл · {total} · өдөрт {daily}',
    'en': 'Silverware · {total} · {daily} per day',
    'zh': '银器 · {total} · 每天 {daily}',
    'ru': 'Серебро · {total} · {daily} в день',
  },
  'silver.history_hint': {
    'mn': 'Төлбөр бүр тухайн үеийн 1 лангийн үнээр бодогдсон.',
    'en': 'Each payment used the price per lan at that time.',
    'zh': '每笔付款按当时的每两价格计算。',
    'ru': 'Каждый платёж — по цене за лан на тот момент.',
  },
  'silver.payment_row': {
    'mn': '{grams} · 1 лан {rate}',
    'en': '{grams} · {rate} per lan',
    'zh': '{grams} · 每两 {rate}',
    'ru': '{grams} · {rate} за лан',
  },
  'silver.quote_loading': {
    'mn': 'Үнэ ачааллаж байна...',
    'en': 'Loading price...',
    'zh': '正在加载价格...',
    'ru': 'Загрузка цены...',
  },
  'silver.quote_error': {
    'mn': 'Үнэ авч чадсангүй. Дахин оролдоно уу.',
    'en': "Couldn't load the price. Try again.",
    'zh': '无法获取价格，请重试。',
    'ru': 'Не удалось получить цену. Попробуйте снова.',
  },
};
