/// "Шүтээн хуур" хэсэгчилсэн эзэмшлийн хөтөлбөр — нүүрний карт ба танилцуулга.
/// Урт тайлбарууд mn/en; бусад хэл mn руу fallback хийнэ.
const Map<String, Map<String, String>> kShuteenTranslations = {
  // ---- Нүүрний карт ----
  'shuteen.card_badge': {
    'mn': 'Хэсэгчилсэн эзэмшил',
    'en': 'Fractional ownership',
    'zh': '份额所有权',
    'ru': 'Долевое владение'
  },
  'shuteen.card_unit_price': {
    'mn': 'Нэгжийн үнэ',
    'en': 'Unit price',
    'zh': '单位价格',
    'ru': 'Цена доли'
  },
  'shuteen.card_growth': {
    'mn': 'Жилийн өсөлт',
    'en': 'Annual growth',
    'zh': '年增长',
    'ru': 'Рост в год'
  },
  'shuteen.card_buyback': {
    'mn': '{months} сарын дараа',
    'en': 'After {months} months',
    'zh': '{months} 个月后',
    'ru': 'Через {months} мес.'
  },
  'shuteen.card_cta': {
    'mn': 'Дэлгэрэнгүй',
    'en': 'Learn more',
    'zh': '了解详情',
    'ru': 'Подробнее'
  },

  // ---- Танилцуулга дэлгэц ----
  'shuteen.company': {
    'mn': '“ИХ ХААДЫН ЧУЛУУ” ХХК',
    'en': '“IKH KHAADIIN CHULUU” LLC',
  },
  'shuteen.stat_valuation': {
    'mn': 'Нийт үнэлгээ',
    'en': 'Total valuation',
    'zh': '总估值',
    'ru': 'Общая оценка'
  },
  'shuteen.stat_units': {
    'mn': 'Нийт нэгж хувь',
    'en': 'Total units',
    'zh': '总份数',
    'ru': 'Всего долей'
  },
  'shuteen.stat_units_unit': {
    'mn': 'ширхэг',
    'en': 'units',
    'zh': '份',
    'ru': 'шт.'
  },
  'shuteen.stat_unit_price_sub': {
    'mn': 'нэг нэгж',
    'en': 'per unit',
    'zh': '每份',
    'ru': 'за долю'
  },
  'shuteen.stat_hold': {
    'mn': 'Эзэмших хугацаа',
    'en': 'Holding period',
    'zh': '持有期限',
    'ru': 'Срок владения'
  },
  'shuteen.stat_hold_value': {
    'mn': '{months} сар',
    'en': '{months} months',
    'zh': '{months} 个月',
    'ru': '{months} мес.'
  },
  'shuteen.stat_hold_sub': {
    'mn': 'буцаан худалдан авах хүртэл',
    'en': 'until buyback',
    'zh': '直至回购',
    'ru': 'до выкупа'
  },
  'shuteen.stat_growth_sub': {
    'mn': 'анхны үнээс тооцно',
    'en': 'of the initial price',
    'zh': '按初始价格计算',
    'ru': 'от начальной цены'
  },
  'shuteen.stat_buyback': {
    'mn': 'Буцаан худалдан авах үнэ',
    'en': 'Buyback price',
    'zh': '回购价格',
    'ru': 'Цена выкупа'
  },
  'shuteen.stat_buyback_sub': {
    'mn': '{months} сарын дараа, нэгж тутамд',
    'en': 'after {months} months, per unit',
    'zh': '{months} 个月后，每份',
    'ru': 'через {months} мес., за долю'
  },
  'shuteen.billion': {
    'mn': '{n} тэрбум₮',
    'en': '{n}B ₮',
    'zh': '{n} 十亿₮',
    'ru': '{n} млрд ₮'
  },

  'shuteen.section_principles': {
    'mn': 'Хөтөлбөрийн долоон гол зарчим',
    'en': 'Seven core principles',
    'zh': '七大核心原则',
    'ru': 'Семь ключевых принципов'
  },
  'shuteen.p1_title': {
    'mn': 'Бодит хөрөнгөөр баталгаажсан',
    'en': 'Backed by a real asset'
  },
  'shuteen.p1_body': {
    'mn':
        'Хөтөлбөрийн үндэс нь байгалийн цул улаан шүр (1,751 г), шижир алт (24К, 1,200 г), Монгол уламжлалт шороон будаг, Монголын хамаг хурдан азаргын гөхлөөр бүтээсэн, дэлхийд ганц “Шүтээн хуур” юм.',
    'en':
        'The program is anchored by the one-of-a-kind “Shuteen Khuur”, crafted from solid natural red coral (1,751 g), pure 24K gold (1,200 g), traditional Mongolian mineral paint and the mane of Mongolia’s fastest stallion.'
  },
  'shuteen.p2_title': {
    'mn': 'Хүртээмжтэй, тэнцүү хувь',
    'en': 'Accessible, equal units'
  },
  'shuteen.p2_body': {
    'mn':
        'Бүтээлийн {valuation}₮-ийн үнэлгээг {units} тэнцүү нэгжид хуваана. Нэг нэгжийн үнэ {price}₮ бөгөөд хэрэглэгч өөрийн боломжид тохируулан нэгжийн тоогоо сонгоно.',
    'en':
        'The {valuation}₮ valuation is split into {units} equal units. One unit costs {price}₮ and you choose how many units fit your budget.'
  },
  'shuteen.p3_title': {
    'mn': 'Цахим гэрчилгээгээр баталгаажсан эзэмшил',
    'en': 'Ownership certified digitally'
  },
  'shuteen.p3_body': {
    'mn':
        'Худалдан авалт бүрт давтагдашгүй дугаар, QR код бүхий цахим гэрчилгээ олгож, эзэмшлийг аппаар хэдийд ч шалгах боломжтой болгоно.',
    'en':
        'Every purchase receives a digital certificate with a unique number and QR code, so ownership can be verified in the app at any time.'
  },
  'shuteen.p4_title': {
    'mn': 'Тодорхой хугацаа, тодорхой нөхцөл',
    'en': 'Clear term, clear conditions'
  },
  'shuteen.p4_body': {
    'mn':
        '“Дэлхийн Морин Хуурын Төв Цогцолбор” ХХК {months} сарын дараа нэгж хувийг буцаан худалдан авна. Нэгжийн үнэлгээ жил бүр анхны үнийн {growth}%-тай тэнцэх хэмжээгээр нэмэгдэж, {months} сарын дараа {buyback}₮ болно.',
    'en':
        '“World Morin Khuur Center Complex” LLC buys the units back after {months} months. The unit value grows by {growth}% of the initial price each year, reaching {buyback}₮ after {months} months.'
  },
  'shuteen.p5_title': {
    'mn': 'Соёлын өвд зориулагдсан хөрөнгө',
    'en': 'Funds dedicated to cultural heritage'
  },
  'shuteen.p5_body': {
    'mn':
        'Хөтөлбөрийн орлого “Дэлхийн морин хуурын төв цогцолбор”-ын бүтээн байгуулалтад зарцуулагдана.',
    'en':
        'Program proceeds fund the construction of the World Morin Khuur Center Complex.'
  },
  'shuteen.p6_title': {
    'mn': 'Эзэмшлийн хэмжээгээр урамшуулах',
    'en': 'Rewards by ownership size'
  },
  'shuteen.p6_body': {
    'mn':
        'Үндэсний соёлын өвийг дэмжигчдийг эзэмших нэгжийн тоогоор нь гурван түвшинд ангилж, Их Хаадын Чулуу дэлгүүрийн хөнгөлөлт болон цогцолборт тасалбаргүй үйлчлүүлэх эрхээр урамшуулна.',
    'en':
        'Supporters are grouped into three tiers by unit count and rewarded with Ikh Khaadiin Chuluu store discounts and ticket-free access to the complex.'
  },
  'shuteen.p7_title': {
    'mn': 'Ил тод байдал ба хууль ёс',
    'en': 'Transparency and compliance'
  },
  'shuteen.p7_body': {
    'mn':
        'Бүтээлийн үнэлгээ, даатгал, хадгалалт, хөрөнгийн зарцуулалтыг эзэмшигчдэд тогтмол мэдээлж, хөтөлбөрийг холбогдох хууль тогтоомж болон зохицуулах байгууллагын шаардлагад нийцүүлэн хэрэгжүүлнэ.',
    'en':
        'Valuation, insurance, custody and use of funds are reported to owners regularly, and the program is run in line with applicable law and regulator requirements.'
  },

  'shuteen.section_finance': {
    'mn': 'Санхүүгийн нөхцөл',
    'en': 'Financial terms',
    'zh': '财务条款',
    'ru': 'Финансовые условия'
  },
  'shuteen.finance_note': {
    'mn': 'Нэгжийн үнэлгээ анхны үнийн {growth}%-тай тэнцэх хэмжээгээр жил бүр нэмэгдэнэ.',
    'en': 'The unit value grows by {growth}% of the initial price every year.'
  },
  'shuteen.at_purchase': {
    'mn': 'Худалдан авах үед',
    'en': 'At purchase',
    'zh': '购买时',
    'ru': 'При покупке'
  },
  'shuteen.after_months': {
    'mn': '{months} сарын дараа',
    'en': 'After {months} months',
    'zh': '{months} 个月后',
    'ru': 'Через {months} мес.'
  },
  'shuteen.section_examples': {
    'mn': 'Худалдан авалтын жишээ',
    'en': 'Purchase examples',
    'zh': '购买示例',
    'ru': 'Примеры покупки'
  },
  'shuteen.col_units': {
    'mn': 'Нэгж',
    'en': 'Units',
    'zh': '份数',
    'ru': 'Доли'
  },
  'shuteen.col_pay': {
    'mn': 'Төлөх дүн',
    'en': 'You pay',
    'zh': '支付金额',
    'ru': 'К оплате'
  },
  'shuteen.col_after': {
    'mn': '{months} сарын дараа',
    'en': 'After {months} mo',
    'zh': '{months} 个月后',
    'ru': 'Через {months} мес.'
  },
  'shuteen.col_tier': {
    'mn': 'Түвшин',
    'en': 'Tier',
    'zh': '等级',
    'ru': 'Уровень'
  },
  'shuteen.tax_note': {
    'mn': 'Дүн нь татвар суутгахаас өмнөх байдлаар тооцогдсон.',
    'en': 'Amounts are shown before tax withholding.'
  },

  'shuteen.section_tiers': {
    'mn': 'Урамшууллын түвшин',
    'en': 'Reward tiers',
    'zh': '奖励等级',
    'ru': 'Уровни вознаграждения'
  },
  'shuteen.tier_n': {
    'mn': 'Түвшин {n}',
    'en': 'Tier {n}',
    'zh': '等级 {n}',
    'ru': 'Уровень {n}'
  },
  'shuteen.tier_range': {
    'mn': '{from}–{to} нэгж',
    'en': '{from}–{to} units',
    'zh': '{from}–{to} 份',
    'ru': '{from}–{to} долей'
  },
  'shuteen.tier_range_plus': {
    'mn': '{from} ба түүнээс дээш нэгж',
    'en': '{from}+ units',
    'zh': '{from} 份及以上',
    'ru': 'от {from} долей'
  },
  'shuteen.tier1_benefit': {
    'mn': 'Их Хаадын Чулуу дэлгүүрийн бүх чулуун эдлэлээс 5% хөнгөлөлт',
    'en': '5% off all stone products at the Ikh Khaadiin Chuluu store'
  },
  'shuteen.tier2_benefit': {
    'mn': 'Дэлхийн морин хуурын төв цогцолборт 2 жилийн хугацаанд тасалбаргүй үйлчлүүлэх эрх',
    'en': 'Ticket-free access to the World Morin Khuur Center Complex for 2 years'
  },
  'shuteen.tier3_benefit': {
    'mn': 'Бүх төрлийн чулуун эдлэлээс 10% хөнгөлөлт ба цогцолборт 2 жилийн хугацаанд тасалбаргүй үйлчлүүлэх эрх',
    'en': '10% off all stone products plus ticket-free access to the complex for 2 years'
  },

  'shuteen.section_steps': {
    'mn': 'Хөтөлбөрт оролцох дараалал',
    'en': 'How to participate',
    'zh': '参与步骤',
    'ru': 'Как участвовать'
  },
  'shuteen.s1_title': {'mn': 'Бүртгүүлэх', 'en': 'Register'},
  'shuteen.s1_body': {
    'mn': 'Утасны дугаар OTP авч өөрийгөө баталгаажуулна',
    'en': 'Verify yourself with a phone OTP'
  },
  'shuteen.s2_title': {'mn': 'Нэгж сонгох', 'en': 'Choose units'},
  'shuteen.s2_body': {
    'mn': 'Худалдан авах нэгжийн тоогоо сонгоно',
    'en': 'Pick how many units to buy'
  },
  'shuteen.s3_title': {'mn': 'Гэрээ ба төлбөр', 'en': 'Agreement and payment'},
  'shuteen.s3_body': {
    'mn': 'Нөхцөлтэй танилцаж, төлбөрөө төлнө',
    'en': 'Review the terms and pay'
  },
  'shuteen.s4_title': {'mn': 'Гэрчилгээ', 'en': 'Certificate'},
  'shuteen.s4_body': {
    'mn': 'Цахим гэрчилгээ, урамшууллын эрх идэвхжинэ',
    'en': 'Your digital certificate and rewards activate'
  },
  'shuteen.s5_title': {'mn': 'Буцаан худалдах', 'en': 'Buyback'},
  'shuteen.s5_body': {
    'mn': '{months} сарын дараа {buyback}₮-өөр буцаан худалдана',
    'en': 'Sold back after {months} months at {buyback}₮'
  },

  'shuteen.cta_buy': {
    'mn': 'Нэгж худалдан авах',
    'en': 'Buy units',
    'zh': '购买份额',
    'ru': 'Купить доли'
  },

  // ---- Нэгж худалдан авах ----
  'shuteen.buy_title': {
    'mn': 'Нэгж худалдан авах',
    'en': 'Buy units',
    'zh': '购买份额',
    'ru': 'Купить доли'
  },
  'shuteen.units_label': {
    'mn': 'Нэгжийн тоо',
    'en': 'Number of units',
    'zh': '份数',
    'ru': 'Количество долей'
  },
  'shuteen.units_value': {
    'mn': '{n} нэгж',
    'en': '{n} units',
    'zh': '{n} 份',
    'ru': '{n} долей'
  },
  'shuteen.remaining_units': {
    'mn': '{sold} / {total} нэгж зарагдсан',
    'en': '{sold} / {total} units sold',
    'zh': '已售 {sold} / {total} 份',
    'ru': 'Продано {sold} / {total} долей'
  },
  'shuteen.calc_title': {
    'mn': 'Тооцоолол',
    'en': 'Calculation',
    'zh': '计算',
    'ru': 'Расчёт'
  },
  'shuteen.calc_pay': {
    'mn': 'Төлөх дүн',
    'en': 'You pay',
    'zh': '支付金额',
    'ru': 'К оплате'
  },
  'shuteen.calc_after': {
    'mn': '{months} сарын дараах үнэлгээ',
    'en': 'Value after {months} months',
    'zh': '{months} 个月后估值',
    'ru': 'Стоимость через {months} мес.'
  },
  'shuteen.calc_gain': {
    'mn': 'Өсөлт',
    'en': 'Gain',
    'zh': '增值',
    'ru': 'Прирост'
  },
  'shuteen.calc_tier': {
    'mn': 'Урамшууллын түвшин',
    'en': 'Reward tier',
    'zh': '奖励等级',
    'ru': 'Уровень вознаграждения'
  },
  'shuteen.tier_none': {
    'mn': 'Түвшингүй (100 нэгжээс эхэлнэ)',
    'en': 'No tier (starts at 100 units)',
    'zh': '无等级（100 份起）',
    'ru': 'Без уровня (от 100 долей)'
  },
  'shuteen.agree_terms': {
    'mn': 'Хөтөлбөрийн нөхцөлтэй танилцаж, {months} сарын дараа {buyback}₮-өөр буцаан худалдан авах нөхцөлийг зөвшөөрч байна.',
    'en': 'I have read the program terms and accept the buyback at {buyback}₮ per unit after {months} months.'
  },
  'shuteen.continue_pay': {
    'mn': 'Төлбөр төлөх',
    'en': 'Proceed to payment',
    'zh': '去支付',
    'ru': 'Перейти к оплате'
  },
  'shuteen.order_create_failed': {
    'mn': 'Захиалга үүсгэхэд алдаа гарлаа.',
    'en': 'Failed to create the order.',
    'zh': '创建订单失败。',
    'ru': 'Не удалось создать заказ.'
  },
  'shuteen.payment_title': {
    'mn': 'Нэгжийн төлбөр',
    'en': 'Unit payment',
    'zh': '份额付款',
    'ru': 'Оплата долей'
  },
  'shuteen.payment_auto_note': {
    'mn': 'Төлбөр төлөгдмөгц гэрчилгээ автоматаар үүснэ. Энэ дэлгэцээс гарах шаардлагагүй.',
    'en': 'Your certificate is issued automatically once the payment lands. No need to leave this screen.'
  },
  'shuteen.paid_title': {
    'mn': 'Та эзэмшигч боллоо!',
    'en': 'You are now an owner!',
    'zh': '您已成为持有人！',
    'ru': 'Вы стали владельцем!'
  },
  'shuteen.paid_body': {
    'mn': 'Цахим гэрчилгээ таны нэр дээр үүслээ. Гэрчилгээг Шүтээн хуурын дэлгэцээс хэдийд ч харах, QR кодоор шалгах боломжтой.',
    'en': 'A digital certificate has been issued in your name. You can view it any time from the Shuteen Khuur screen and verify it by QR code.'
  },
  'shuteen.view_certificate': {
    'mn': 'Гэрчилгээ харах',
    'en': 'View certificate',
    'zh': '查看证书',
    'ru': 'Открыть сертификат'
  },

  // ---- Миний эзэмшил ----
  'shuteen.my_ownership': {
    'mn': 'Миний эзэмшил',
    'en': 'My ownership',
    'zh': '我的持有',
    'ru': 'Моё владение'
  },
  'shuteen.my_units': {
    'mn': 'Эзэмшиж буй нэгж',
    'en': 'Units owned',
    'zh': '持有份数',
    'ru': 'Долей во владении'
  },
  'shuteen.my_invested': {
    'mn': 'Худалдан авсан дүн',
    'en': 'Amount invested',
    'zh': '购买金额',
    'ru': 'Сумма покупки'
  },
  'shuteen.my_current': {
    'mn': 'Өнөөдрийн үнэлгээ',
    'en': 'Value today',
    'zh': '今日估值',
    'ru': 'Стоимость сегодня'
  },
  'shuteen.my_buyback': {
    'mn': 'Буцаан худалдан авах дүн',
    'en': 'Buyback amount',
    'zh': '回购金额',
    'ru': 'Сумма выкупа'
  },
  'shuteen.certificates_n': {
    'mn': '{n} гэрчилгээ',
    'en': '{n} certificates',
    'zh': '{n} 份证书',
    'ru': 'Сертификатов: {n}'
  },
  'shuteen.my_certificates': {
    'mn': 'Миний гэрчилгээнүүд',
    'en': 'My certificates',
    'zh': '我的证书',
    'ru': 'Мои сертификаты'
  },
  'shuteen.no_certificates': {
    'mn': 'Гэрчилгээ байхгүй байна',
    'en': 'No certificates yet',
    'zh': '暂无证书',
    'ru': 'Сертификатов пока нет'
  },
  'shuteen.no_certificates_sub': {
    'mn': 'Нэгж худалдан авсны дараа гэрчилгээ энд харагдана.',
    'en': 'Your certificates appear here after you buy units.'
  },
  'shuteen.buy_more': {
    'mn': 'Нэмж авах',
    'en': 'Buy more',
    'zh': '追加购买',
    'ru': 'Купить ещё'
  },

  // ---- Гэрчилгээ ----
  'shuteen.certificate': {
    'mn': 'Цахим гэрчилгээ',
    'en': 'Digital certificate',
    'zh': '电子证书',
    'ru': 'Цифровой сертификат'
  },
  'shuteen.certificate_no': {
    'mn': 'Гэрчилгээний дугаар',
    'en': 'Certificate number',
    'zh': '证书编号',
    'ru': 'Номер сертификата'
  },
  'shuteen.owner': {
    'mn': 'Эзэмшигч',
    'en': 'Owner',
    'zh': '持有人',
    'ru': 'Владелец'
  },
  'shuteen.purchased_at': {
    'mn': 'Худалдан авсан огноо',
    'en': 'Purchase date',
    'zh': '购买日期',
    'ru': 'Дата покупки'
  },
  'shuteen.buyback_at': {
    'mn': 'Буцаан худалдан авах огноо',
    'en': 'Buyback date',
    'zh': '回购日期',
    'ru': 'Дата выкупа'
  },
  'shuteen.status_active': {
    'mn': 'Хүчинтэй',
    'en': 'Active',
    'zh': '有效',
    'ru': 'Действует'
  },
  'shuteen.status_bought_back': {
    'mn': 'Буцаан худалдсан',
    'en': 'Bought back',
    'zh': '已回购',
    'ru': 'Выкуплен'
  },
  'shuteen.status_cancelled': {
    'mn': 'Цуцлагдсан',
    'en': 'Cancelled',
    'zh': '已取消',
    'ru': 'Отменён'
  },
  'shuteen.qr_hint': {
    'mn': 'Энэ QR кодоор гэрчилгээний хүчинтэй эсэхийг шалгана.',
    'en': 'Scan this QR code to verify the certificate.',
    'zh': '扫描此二维码验证证书。',
    'ru': 'Отсканируйте QR-код для проверки сертификата.'
  },
  'shuteen.share_certificate': {
    'mn': 'Хуваалцах',
    'en': 'Share',
    'zh': '分享',
    'ru': 'Поделиться'
  },
  'shuteen.share_text': {
    'mn': 'Би “Шүтээн хуур” хөтөлбөрийн {units} нэгжийн эзэмшигч боллоо. Гэрчилгээ: {no}. Их Хаадын Чулуу апп.',
    'en': 'I now own {units} units of the “Shuteen Khuur” program. Certificate {no}. Ikh Khaadiin Chuluu app.'
  },
  'shuteen.days_left': {
    'mn': '{n} хоног үлдсэн',
    'en': '{n} days left',
    'zh': '剩余 {n} 天',
    'ru': 'Осталось {n} дн.'
  },
  'shuteen.due_now': {
    'mn': 'Буцаан худалдан авах хугацаа болсон',
    'en': 'Buyback is due',
    'zh': '回购期已到',
    'ru': 'Срок выкупа наступил'
  },

  // ---- Гэрчилгээ шалгах ----
  'shuteen.verify_title': {
    'mn': 'Гэрчилгээ шалгах',
    'en': 'Verify certificate',
    'zh': '验证证书',
    'ru': 'Проверить сертификат'
  },
  'shuteen.verify_hint': {
    'mn': 'Гэрчилгээний QR кодыг хүрээнд оруулна уу',
    'en': 'Point the camera at the certificate QR code',
    'zh': '将证书二维码对准取景框',
    'ru': 'Наведите камеру на QR-код сертификата'
  },
  'shuteen.verify_checking': {
    'mn': 'Шалгаж байна…',
    'en': 'Checking…',
    'zh': '正在验证…',
    'ru': 'Проверка…'
  },
  'shuteen.verify_valid': {
    'mn': 'Хүчинтэй гэрчилгээ',
    'en': 'Valid certificate',
    'zh': '证书有效',
    'ru': 'Сертификат действителен'
  },
  'shuteen.verify_invalid': {
    'mn': 'Хүчингүй гэрчилгээ',
    'en': 'Invalid certificate',
    'zh': '证书无效',
    'ru': 'Сертификат недействителен'
  },
  'shuteen.verify_reason_invalid_signature': {
    'mn': 'QR код танигдсангүй эсвэл хуурамч байна.',
    'en': 'The QR code is not recognised or has been tampered with.',
    'zh': '二维码无法识别或已被篡改。',
    'ru': 'QR-код не распознан или подделан.'
  },
  'shuteen.verify_reason_not_found': {
    'mn': 'Ийм гэрчилгээ бүртгэлд байхгүй.',
    'en': 'No such certificate on record.',
    'zh': '记录中没有此证书。',
    'ru': 'Такой сертификат не найден.'
  },
  'shuteen.verify_reason_status': {
    'mn': 'Гэрчилгээ идэвхгүй болсон ({status}).',
    'en': 'The certificate is no longer active ({status}).',
    'zh': '证书已失效（{status}）。',
    'ru': 'Сертификат больше не действует ({status}).'
  },
  'shuteen.verify_reason_error': {
    'mn': 'Шалгах үед алдаа гарлаа. Дахин оролдоно уу.',
    'en': 'Verification failed. Please try again.',
    'zh': '验证时出错，请重试。',
    'ru': 'Ошибка проверки. Попробуйте ещё раз.'
  },
  'shuteen.verify_not_shuteen': {
    'mn': 'Энэ QR код Шүтээн хуурын гэрчилгээ биш байна.',
    'en': 'This QR code is not a Shuteen Khuur certificate.',
    'zh': '此二维码不是 Shuteen Khuur 证书。',
    'ru': 'Этот QR-код не является сертификатом Shuteen Khuur.'
  },
  'shuteen.verify_issued': {
    'mn': 'Олгосон огноо',
    'en': 'Issued on',
    'zh': '签发日期',
    'ru': 'Дата выдачи'
  },
  'shuteen.verify_scan_again': {
    'mn': 'Дахин уншуулах',
    'en': 'Scan again',
    'zh': '重新扫描',
    'ru': 'Сканировать снова'
  },
  'shuteen.camera_denied': {
    'mn': 'Камерын зөвшөөрөл олгогдоогүй байна. Тохиргооноос нээнэ үү.',
    'en': 'Camera permission was not granted. Enable it in Settings.',
    'zh': '未授予相机权限，请在设置中开启。',
    'ru': 'Нет доступа к камере. Разрешите в настройках.'
  },
  'shuteen.verify_menu_sub': {
    'mn': 'QR кодоор хүчинтэй эсэхийг шалгах',
    'en': 'Check validity by QR code',
    'zh': '通过二维码检查有效性',
    'ru': 'Проверка подлинности по QR-коду'
  },
  'shuteen.verify_status': {
    'mn': 'Төлөв',
    'en': 'Status',
    'zh': '状态',
    'ru': 'Статус'
  },
};
