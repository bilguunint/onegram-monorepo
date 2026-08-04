/// Strings for the "Дэлхийн морин хуурын төв цогцолбор" (World Morin Khuur
/// Center Complex) campaign: storefront, tree planting, cart, checkout and the
/// supporter wall. Shared sentences live in `common.dart` — reuse those.
const Map<String, Map<String, String>> kCenterTranslations = {
  // ── Campaign detail screen ────────────────────────────────────────────────
  'center.complex_title': {
    'mn': 'Дэлхийн морин хуурын төв цогцолбор',
    'en': 'World Morin Khuur Center Complex',
    'zh': '世界马头琴中心综合体',
    'ru': 'Всемирный центр морин хуура'
  },
  'center.my_planted_trees': {
    'mn': 'Миний тарьсан мод',
    'en': 'My planted trees',
    'zh': '我种的树',
    'ru': 'Мои деревья'
  },
  'center.my_orders': {
    'mn': 'Миний захиалга',
    'en': 'My orders',
    'zh': '我的订单',
    'ru': 'Мои заказы'
  },
  'center.cart': {'mn': 'Сагс', 'en': 'Cart', 'zh': '购物车', 'ru': 'Корзина'},

  // Tabs
  'center.plant_tree': {
    'mn': 'Мод тарих',
    'en': 'Plant a tree',
    'zh': '种树',
    'ru': 'Посадить дерево'
  },
  'center.products': {
    'mn': 'Бүтээгдэхүүн',
    'en': 'Products',
    'zh': '商品',
    'ru': 'Товары'
  },
  'center.about_project': {
    'mn': 'Төслийн тухай',
    'en': 'About the project',
    'zh': '项目介绍',
    'ru': 'О проекте'
  },
  'center.top_n': {
    'mn': 'Шилдэг {count}',
    'en': 'Top {count}',
    'zh': '前{count}名',
    'ru': 'Топ-{count}'
  },

  // Header — fundraising progress
  'center.supporter_count': {
    'mn': '{count} дэмжигч',
    'en': '{count} supporters',
    'zh': '{count} 位支持者',
    'ru': 'Сторонников: {count}'
  },
  'center.purchase_supports_note': {
    'mn': 'Таны худалдан авалт Дэлхийн морин хуурын төв '
        'цогцолборыг бүтээн байгуулах үйл хэрэгт дэмжлэг болно.',
    'en': 'Your purchase supports the building of the World Morin Khuur '
        'Center Complex.',
    'zh': '您的购买将助力世界马头琴中心综合体的建设。',
    'ru': 'Ваша покупка поддерживает строительство Всемирного центра '
        'морин хуура.'
  },

  // Header — tree planting panel
  'center.people_joined_planting': {
    'mn': ' хүн мод тарих аянд нэгдлээ',
    'en': ' people have joined the tree-planting drive',
    'zh': ' 人已加入植树行动',
    'ru': ' человек присоединилось к посадке деревьев'
  },
  'center.trees_planted_total': {
    'mn': 'Нийт {count} мод таригдлаа',
    'en': '{count} trees planted in total',
    'zh': '已种植 {count} 棵树',
    'ru': 'Всего посажено деревьев: {count}'
  },
  'center.plant_legacy_note': {
    'mn': 'Мод тарьж, ногоон өв үлдээгээрэй. Тарьсан мод бүр таны '
        'нэрийн шошготойгоор цогцолборын хотхонд ургана.',
    'en': 'Plant a tree and leave a green legacy. Every tree grows on the '
        'complex grounds with a plaque bearing your name.',
    'zh': '种下一棵树，留下绿色传承。每棵树都将挂上您的名牌，在中心园区中生长。',
    'ru': 'Посадите дерево и оставьте зелёное наследие. Каждое дерево растёт '
        'на территории комплекса с табличкой с вашим именем.'
  },

  // Header — user stat overlay
  'center.your_support_amount': {
    'mn': 'Таны дэмжлэг: {amount}',
    'en': 'Your support: {amount}',
    'zh': '您的支持：{amount}',
    'ru': 'Ваша поддержка: {amount}'
  },
  'center.no_support_yet': {
    'mn': 'Та хараахан дэмжлэг үзүүлээгүй байна',
    'en': 'You have not shown support yet',
    'zh': '您还未提供支持',
    'ru': 'Вы ещё не оказали поддержку'
  },
  'center.your_trees_count': {
    'mn': 'Таны тарьсан мод: {count}',
    'en': 'Your trees: {count}',
    'zh': '您种的树：{count}',
    'ru': 'Ваши деревья: {count}'
  },

  // ── Products tab ──────────────────────────────────────────────────────────
  'center.no_products': {
    'mn': 'Бараа алга.',
    'en': 'No products yet.',
    'zh': '暂无商品。',
    'ru': 'Товаров пока нет.'
  },
  'center.out_of_stock': {
    'mn': 'Дууссан',
    'en': 'Sold out',
    'zh': '已售罄',
    'ru': 'Нет в наличии'
  },
  'center.buy': {
    'mn': 'Худалдан авах',
    'en': 'Buy',
    'zh': '购买',
    'ru': 'Купить'
  },

  // ── About tab ─────────────────────────────────────────────────────────────
  'center.gallery': {
    'mn': 'Зургийн цомог',
    'en': 'Photo gallery',
    'zh': '图片集',
    'ru': 'Фотогалерея'
  },
  'center.info_coming_soon': {
    'mn': 'Мэдээлэл удахгүй нэмэгдэнэ.',
    'en': 'Details coming soon.',
    'zh': '信息即将发布。',
    'ru': 'Информация появится скоро.'
  },

  // ── Supporter wall ────────────────────────────────────────────────────────
  'center.no_supporters_yet': {
    'mn': 'Дэмжигч одоогоор алга.',
    'en': 'No supporters yet.',
    'zh': '暂无支持者。',
    'ru': 'Пока нет сторонников.'
  },
  'center.engrave_note': {
    'mn': 'Та шилдэг {count} дэмжигчийн нэг болбол таны нэрийг алтан '
        'үсгээр сийлэн төв цогцолбортоо мөнхөлнө.',
    'en': 'Become one of the top {count} supporters and your name will be '
        'engraved in gold at the center complex.',
    'zh': '成为前{count}名支持者，您的名字将以金字镌刻于中心综合体。',
    'ru': 'Войдите в топ-{count} сторонников — и ваше имя будет высечено '
        'золотом в центре комплекса.'
  },
  'center.anonymous_donor': {
    'mn': 'Нэрээ нууцалсан',
    'en': 'Anonymous',
    'zh': '匿名',
    'ru': 'Аноним'
  },
  'center.unnamed': {
    'mn': 'Нэргүй',
    'en': 'Unnamed',
    'zh': '未署名',
    'ru': 'Без имени'
  },

  // ── Trees tab ─────────────────────────────────────────────────────────────
  'center.trees_load_failed': {
    'mn': 'Модны жагсаалт ачаалагдсангүй.',
    'en': 'Could not load the tree list.',
    'zh': '树木列表加载失败。',
    'ru': 'Не удалось загрузить список деревьев.'
  },
  'center.trees_coming_soon': {
    'mn': 'Мод удахгүй нэмэгдэнэ.',
    'en': 'Trees coming soon.',
    'zh': '树木即将上架。',
    'ru': 'Деревья появятся скоро.'
  },
  'center.stock_pcs_short': {
    'mn': '{stock} ш',
    'en': '{stock} pcs',
    'zh': '{stock} 棵',
    'ru': '{stock} шт.'
  },

  // ── Tree order screen ─────────────────────────────────────────────────────
  'center.tree_order_title': {
    'mn': 'Мод тарих захиалга',
    'en': 'Tree planting order',
    'zh': '植树订单',
    'ru': 'Заказ на посадку дерева'
  },
  'center.enter_plaque_name': {
    'mn': 'Шошгон дээр хэвлэгдэх нэрээ оруулна уу.',
    'en': 'Enter the name for the plaque.',
    'zh': '请输入牌匾上的名字。',
    'ru': 'Введите имя на табличке.'
  },
  'center.plant_for_amount': {
    'mn': '{amount} — Мод тарих',
    'en': '{amount} — Plant a tree',
    'zh': '{amount} — 种树',
    'ru': '{amount} — Посадить дерево'
  },
  'center.tree_out_of_stock': {
    'mn': 'Энэ мод дууссан байна',
    'en': 'This tree is sold out',
    'zh': '此树已售罄',
    'ru': 'Это дерево закончилось'
  },

  // Botanical specs
  'center.seedling_height': {
    'mn': 'Суулгацын өндөр',
    'en': 'Seedling height',
    'zh': '树苗高度',
    'ru': 'Высота саженца'
  },
  'center.mature_height': {
    'mn': 'Нас биенд хүрсэн өндөр',
    'en': 'Mature height',
    'zh': '成年高度',
    'ru': 'Высота взрослого дерева'
  },
  'center.lifespan': {
    'mn': 'Насжилт',
    'en': 'Lifespan',
    'zh': '寿命',
    'ru': 'Срок жизни'
  },
  'center.features': {
    'mn': 'Онцлог',
    'en': 'Characteristics',
    'zh': '特点',
    'ru': 'Особенности'
  },

  // Plaque
  'center.plaque_name': {
    'mn': 'Шошгон дээр хэвлэгдэх нэр',
    'en': 'Name on the plaque',
    'zh': '牌匾上的名字',
    'ru': 'Имя на табличке'
  },
  'center.plaque_name_hint': {
    'mn': 'Таны модонд энэ нэр бүхий шошго хадагдана.',
    'en': 'A plaque with this name will be attached to your tree.',
    'zh': '将为您的树挂上写有此名字的牌匾。',
    'ru': 'К вашему дереву прикрепят табличку с этим именем.'
  },
  'center.plaque_name_placeholder': {
    'mn': 'Жишээ: Билгүүн гэр бүлийн мод',
    'en': 'Example: The Bilguun family tree',
    'zh': '例如：毕勒贡家族之树',
    'ru': 'Например: дерево семьи Билгуун'
  },

  // Quantity
  'center.tree_qty': {
    'mn': 'Тарих модны тоо',
    'en': 'Number of trees',
    'zh': '种树数量',
    'ru': 'Количество деревьев'
  },
  'center.stock_left': {
    'mn': 'Үлдэгдэл: {stock} ширхэг',
    'en': 'Remaining: {stock} pcs',
    'zh': '剩余：{stock} 棵',
    'ru': 'Осталось: {stock} шт.'
  },
  'center.stock_empty': {
    'mn': 'Нөөц дууссан',
    'en': 'Out of stock',
    'zh': '库存已尽',
    'ru': 'Запас закончился'
  },
  'center.plant_vibe_note': {
    'mn': 'Таны тарьсан мод Дэлхийн морин хуурын төв цогцолборын хотхонд '
        'олон жил ургаж, ирээдүй хойч үед ногоон өв үлдээнэ. Мод бүрт '
        'таны нэрийн шошго хадагдана.',
    'en': 'Your tree will grow for many years on the grounds of the World '
        'Morin Khuur Center Complex, leaving a green legacy for the '
        'generations to come. Every tree carries a plaque with your name.',
    'zh': '您种下的树将在世界马头琴中心综合体园区生长多年，为后代留下绿色传承。'
        '每棵树都会挂上写有您名字的牌匾。',
    'ru': 'Ваше дерево будет расти долгие годы на территории Всемирного '
        'центра морин хуура, оставляя зелёное наследие будущим поколениям. '
        'На каждом дереве — табличка с вашим именем.'
  },

  // ── Cart ──────────────────────────────────────────────────────────────────
  'center.cart_empty': {
    'mn': 'Сагс хоосон байна.',
    'en': 'Your cart is empty.',
    'zh': '购物车是空的。',
    'ru': 'Корзина пуста.'
  },
  'center.total_amount': {
    'mn': 'Нийт дүн',
    'en': 'Total',
    'zh': '总计',
    'ru': 'Итого'
  },

  // ── Donation payment (QPay) ───────────────────────────────────────────────
  'center.support_payment_title': {
    'mn': 'Дэмжлэгийн төлбөр',
    'en': 'Support payment',
    'zh': '支持款项',
    'ru': 'Оплата поддержки'
  },
  'center.payment_auto_refresh_note': {
    'mn': 'Төлбөр амжилттай төлөгдмөгц дэлгэц автоматаар шинэчлэгдэнэ. '
        'QR кодыг QPay эсвэл банкны апп-аар уншуулна уу.',
    'en': 'The screen updates automatically once the payment goes through. '
        'Scan the QR code with QPay or your bank app.',
    'zh': '付款成功后页面将自动刷新。请使用QPay或银行App扫描二维码。',
    'ru': 'Экран обновится автоматически после оплаты. Отсканируйте QR-код '
        'приложением QPay или вашего банка.'
  },
  'center.check_payment': {
    'mn': 'Төлбөр шалгах',
    'en': 'Check payment',
    'zh': '检查付款',
    'ru': 'Проверить оплату'
  },
  'center.thank_you': {
    'mn': 'Танд баярлалаа',
    'en': 'Thank you',
    'zh': '感谢您',
    'ru': 'Благодарим вас'
  },
  'center.support_amount': {
    'mn': '{amount} дэмжлэг',
    'en': '{amount} in support',
    'zh': '支持 {amount}',
    'ru': 'Поддержка {amount}'
  },
  'center.thanks_body_1': {
    'mn': 'Дэлхийн Морин Хуурын Төв Цогцолборыг бүтээн байгуулах эрхэм '
        'үйлсэд дэмжлэг үзүүлсэн Танд гүн талархал илэрхийлье.',
    'en': 'Our deepest thanks for supporting the noble work of building the '
        'World Morin Khuur Center Complex.',
    'zh': '衷心感谢您支持世界马头琴中心综合体的建设伟业。',
    'ru': 'Глубоко благодарим вас за поддержку благородного дела — '
        'строительства Всемирного центра морин хуура.'
  },
  'center.thanks_body_2': {
    'mn': 'Таны сэтгэлийн дэмжлэг Монголын өв соёл, морин хуурын аялгууг '
        'дэлхий дахинд түгээн дэлгэрүүлэх үнэт хувь нэмэр болж байна.',
    'en': 'Your heartfelt support is a valuable contribution to carrying '
        'Mongolian heritage and the melody of the morin khuur to the world.',
    'zh': '您的诚挚支持，是让蒙古文化遗产与马头琴之音传遍世界的珍贵贡献。',
    'ru': 'Ваша сердечная поддержка — ценный вклад в то, чтобы наследие '
        'Монголии и мелодия морин хуура зазвучали по всему миру.'
  },

  // ── My support orders ─────────────────────────────────────────────────────
  'center.my_support_title': {
    'mn': 'Миний дэмжлэг',
    'en': 'My support',
    'zh': '我的支持',
    'ru': 'Моя поддержка'
  },
  'center.no_support_orders': {
    'mn': 'Дэмжлэгийн захиалга алга.',
    'en': 'No support orders yet.',
    'zh': '暂无支持订单。',
    'ru': 'Заказов поддержки пока нет.'
  },
  'center.goods_received': {
    'mn': 'Бараа хүлээн авсан',
    'en': 'Item received',
    'zh': '已领取商品',
    'ru': 'Товар получен'
  },
  'center.view_code': {
    'mn': 'Код харах',
    'en': 'View code',
    'zh': '查看取货码',
    'ru': 'Показать код'
  },
  'center.order_details': {
    'mn': 'Захиалгын дэлгэрэнгүй',
    'en': 'Order details',
    'zh': '订单详情',
    'ru': 'Детали заказа'
  },
  'center.pickup_code': {
    'mn': 'Бараа авах код',
    'en': 'Pickup code',
    'zh': '取货码',
    'ru': 'Код получения'
  },
  'center.pickup_code_hint': {
    'mn': 'Бараагаа авахдаа энэ кодыг ажилтанд үзүүлнэ үү.',
    'en': 'Show this code to the staff when you pick up your item.',
    'zh': '取货时请向工作人员出示此码。',
    'ru': 'Покажите этот код сотруднику при получении товара.'
  },
  'center.received_on': {
    'mn': '{date}-нд хүлээн авсан',
    'en': 'Received on {date}',
    'zh': '{date} 已领取',
    'ru': 'Получено {date}'
  },
  'center.received_note': {
    'mn': 'Та энэ захиалгын барааг амжилттай хүлээн авсан тул код '
        'дахин шаардлагагүй.',
    'en': 'You have already received this order, so the code is no longer '
        'needed.',
    'zh': '此订单商品已领取，无需再使用取货码。',
    'ru': 'Вы уже получили товар по этому заказу, код больше не нужен.'
  },

  // ── Tree payment (QPay) ───────────────────────────────────────────────────
  'center.tree_payment_title': {
    'mn': 'Мод тарих төлбөр',
    'en': 'Tree planting payment',
    'zh': '植树款项',
    'ru': 'Оплата посадки дерева'
  },
  'center.tree_payment_auto_note': {
    'mn': 'Төлбөр амжилттай төлөгдмөгц таны модны захиалга баталгаажиж, '
        'дэлгэц автоматаар шинэчлэгдэнэ.',
    'en': 'Once the payment goes through, your tree order is confirmed and '
        'this screen updates automatically.',
    'zh': '付款成功后，您的植树订单将确认，页面自动刷新。',
    'ru': 'После оплаты заказ на дерево будет подтверждён, а экран '
        'обновится автоматически.'
  },
  'center.tree_will_be_planted': {
    'mn': 'Таны мод таригдана! 🌱',
    'en': 'Your tree will be planted! 🌱',
    'zh': '您的树将被种下！🌱',
    'ru': 'Ваше дерево будет посажено! 🌱'
  },
  'center.tree_planted_body': {
    'mn': 'Дэлхийн Морин Хуурын Төв Цогцолборын хотхонд таны мод '
        'дээрх нэрийн шошготойгоо таригдана. Ногоон ирээдүйг '
        'бүтээлцсэн Танд баярлалаа!',
    'en': 'Your tree will be planted on the grounds of the World Morin Khuur '
        'Center Complex, carrying the plaque above. Thank you for helping '
        'build a greener future!',
    'zh': '您的树将种在世界马头琴中心综合体园区，并挂上以上名牌。'
        '感谢您共建绿色未来！',
    'ru': 'Ваше дерево будет посажено на территории Всемирного центра морин '
        'хуура с табличкой, указанной выше. Спасибо, что создаёте зелёное '
        'будущее!'
  },

  // ── My tree orders ────────────────────────────────────────────────────────
  'center.no_trees_planted_yet': {
    'mn': 'Та одоогоор мод тариагүй байна.',
    'en': 'You have not planted any trees yet.',
    'zh': '您还没有种树。',
    'ru': 'Вы ещё не посадили ни одного дерева.'
  },
  'center.you_planted_prefix': {
    'mn': 'Та нийт ',
    'en': 'You have planted ',
    'zh': '您共种下 ',
    'ru': 'Вы посадили деревьев: '
  },
  'center.trees_count_value': {
    'mn': '{count} мод',
    'en': '{count} trees',
    'zh': '{count} 棵树',
    'ru': '{count}'
  },
  'center.you_planted_suffix': {
    'mn': ' тарьсан байна 🌱',
    'en': ' 🌱',
    'zh': ' 🌱',
    'ru': ' 🌱'
  },
  'center.planted': {
    'mn': 'Таригдсан',
    'en': 'Planted',
    'zh': '已种植',
    'ru': 'Посажено'
  },
  'center.awaiting_planting': {
    'mn': 'Тарихаар хүлээгдэж буй',
    'en': 'Awaiting planting',
    'zh': '待种植',
    'ru': 'Ожидает посадки'
  },

  // ── Repository / errors ───────────────────────────────────────────────────
  'center.user_fallback_name': {
    'mn': 'Хэрэглэгч',
    'en': 'User',
    'zh': '用户',
    'ru': 'Пользователь'
  },
  'center.order_create_failed': {
    'mn': 'Захиалга үүсгэхэд алдаа гарлаа.',
    'en': 'Could not create the order.',
    'zh': '创建订单失败。',
    'ru': 'Не удалось создать заказ.'
  },
  'center.payment_create_failed': {
    'mn': 'Төлбөр үүсгэхэд алдаа гарлаа.',
    'en': 'Could not create the payment.',
    'zh': '创建支付失败。',
    'ru': 'Не удалось создать платёж.'
  },
};
