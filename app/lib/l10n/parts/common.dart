/// Strings shared across several screens. Feature parts must reuse these keys
/// instead of re-declaring their own copy of the same sentence.
const Map<String, Map<String, String>> kCommonTranslations = {
  'common.ok': {'mn': 'За', 'en': 'OK', 'zh': '确定', 'ru': 'OK'},
  'common.cancel': {'mn': 'Болих', 'en': 'Cancel', 'zh': '取消', 'ru': 'Отмена'},
  'common.close': {'mn': 'Хаах', 'en': 'Close', 'zh': '关闭', 'ru': 'Закрыть'},
  'common.confirm': {
    'mn': 'Баталгаажуулах',
    'en': 'Confirm',
    'zh': '确认',
    'ru': 'Подтвердить'
  },
  'common.continue': {
    'mn': 'Үргэлжлүүлэх',
    'en': 'Continue',
    'zh': '继续',
    'ru': 'Продолжить'
  },
  'common.save': {
    'mn': 'Хадгалах',
    'en': 'Save',
    'zh': '保存',
    'ru': 'Сохранить'
  },
  'common.back': {'mn': 'Буцах', 'en': 'Back', 'zh': '返回', 'ru': 'Назад'},
  'common.retry': {
    'mn': 'Дахин оролдох',
    'en': 'Retry',
    'zh': '重试',
    'ru': 'Повторить'
  },
  'common.details': {
    'mn': 'Дэлгэрэнгүй',
    'en': 'Details',
    'zh': '详情',
    'ru': 'Подробнее'
  },
  'common.loading': {
    'mn': 'Ачаалж байна…',
    'en': 'Loading…',
    'zh': '加载中…',
    'ru': 'Загрузка…'
  },

  // Statuses
  'common.pending': {
    'mn': 'Хүлээгдэж байна',
    'en': 'Pending',
    'zh': '待处理',
    'ru': 'В ожидании'
  },
  'common.cancelled': {
    'mn': 'Цуцлагдсан',
    'en': 'Cancelled',
    'zh': '已取消',
    'ru': 'Отменено'
  },
  'common.completed': {
    'mn': 'Дууссан',
    'en': 'Completed',
    'zh': '已完成',
    'ru': 'Завершено'
  },
  'common.received': {
    'mn': 'Хүлээн авсан',
    'en': 'Received',
    'zh': '已接收',
    'ru': 'Получено'
  },
  'common.approved': {
    'mn': 'Баталгаажсан',
    'en': 'Approved',
    'zh': '已确认',
    'ru': 'Подтверждено'
  },
  'common.rejected': {
    'mn': 'Татгалзагдсан',
    'en': 'Rejected',
    'zh': '已拒绝',
    'ru': 'Отклонено'
  },
  'common.failed': {
    'mn': 'Амжилтгүй',
    'en': 'Failed',
    'zh': '失败',
    'ru': 'Неуспешно'
  },
  'common.success': {
    'mn': 'Амжилттай',
    'en': 'Success',
    'zh': '成功',
    'ru': 'Успешно'
  },

  // Errors
  'common.error': {
    'mn': 'Алдаа гарлаа',
    'en': 'Something went wrong',
    'zh': '出错了',
    'ru': 'Произошла ошибка'
  },
  'common.error_with': {
    'mn': 'Алдаа гарлаа: {error}',
    'en': 'Something went wrong: {error}',
    'zh': '出错了：{error}',
    'ru': 'Произошла ошибка: {error}'
  },
  'common.not_signed_in': {
    'mn': 'Нэвтрээгүй байна.',
    'en': 'You are not signed in.',
    'zh': '您尚未登录。',
    'ru': 'Вы не вошли в систему.'
  },
  'common.sign_in_required': {
    'mn': 'Нэвтрэх шаардлагатай.',
    'en': 'Sign-in required.',
    'zh': '需要登录。',
    'ru': 'Требуется вход.'
  },
  'common.unexpected_response': {
    'mn': 'Серверээс хүлээгдээгүй хариу ирлээ ({code}).',
    'en': 'Unexpected response from the server ({code}).',
    'zh': '服务器返回了意外响应（{code}）。',
    'ru': 'Неожиданный ответ сервера ({code}).'
  },
  'common.no_connection': {
    'mn': 'Интернэт холболтоо шалгана уу.',
    'en': 'Check your internet connection.',
    'zh': '请检查您的网络连接。',
    'ru': 'Проверьте интернет-соединение.'
  },

  // Payment (QPay) — reused by every checkout screen
  'common.amount_due': {
    'mn': 'Төлөх дүн',
    'en': 'Amount due',
    'zh': '应付金额',
    'ru': 'К оплате'
  },
  'common.bank_app': {
    'mn': 'Банкны апп',
    'en': 'Bank app',
    'zh': '银行App',
    'ru': 'Банковское приложение'
  },
  'common.scan_qr_hint': {
    'mn': 'QR кодыг QPay апп-аар уншуулна уу.',
    'en': 'Scan the QR code with the QPay app.',
    'zh': '请使用QPay应用扫描二维码。',
    'ru': 'Отсканируйте QR-код приложением QPay.'
  },

  // Units
  'common.gram_gold': {
    'mn': 'гр алт',
    'en': 'g gold',
    'zh': '克黄金',
    'ru': 'г золота'
  },
  'common.lan_silver': {
    'mn': 'лан мөнгө',
    'en': 'lan silver',
    'zh': '两白银',
    'ru': 'лан серебра'
  },

  // Language switcher
  'language.title': {'mn': 'Хэл', 'en': 'Language', 'zh': '语言', 'ru': 'Язык'},
  'language.choose': {
    'mn': 'Хэл сонгох',
    'en': 'Choose language',
    'zh': '选择语言',
    'ru': 'Выбрать язык'
  },

  // Үйлчилгээний нөхцөл зөвшөөрөх, гарын үсэг (terms_accept_checkbox.dart)
  'terms.sign_title': {
    'mn': 'Гарын үсэг зурах',
    'en': 'Sign to accept',
    'zh': '签名确认',
    'ru': 'Подпись'
  },
  'terms.sign_hint': {
    'mn': 'Хуруугаараа гарын үсгээ энд зурна уу',
    'en': 'Draw your signature here with your finger',
    'zh': '请用手指在此签名',
    'ru': 'Нарисуйте подпись пальцем здесь'
  },
  'terms.sign_agree_note': {
    'mn': 'Гарын үсэг зурснаар "{title}" (хувилбар {version})-ийг бүрэн уншиж танилцан, хүлээн зөвшөөрсөнд тооцно.',
    'en': 'By signing you confirm that you have read and accept "{title}" (version {version}).',
    'zh': '签名即表示您已阅读并接受"{title}"（版本 {version}）。',
    'ru': 'Подписывая, вы подтверждаете, что прочитали и принимаете «{title}» (версия {version}).'
  },
  'terms.sign_clear': {
    'mn': 'Арилгах',
    'en': 'Clear',
    'zh': '清除',
    'ru': 'Очистить'
  },
  'terms.sign_save': {
    'mn': 'Баталгаажуулах',
    'en': 'Confirm',
    'zh': '确认',
    'ru': 'Подтвердить'
  },
  'terms.sign_empty': {
    'mn': 'Гарын үсэг зураагүй байна.',
    'en': 'Please draw your signature first.',
    'zh': '请先签名。',
    'ru': 'Сначала нарисуйте подпись.'
  },
  'terms.sign_saved': {
    'mn': 'Гарын үсэг хадгалагдлаа.',
    'en': 'Signature saved.',
    'zh': '签名已保存。',
    'ru': 'Подпись сохранена.'
  },
  'terms.sign_failed': {
    'mn': 'Гарын үсэг хадгалахад алдаа гарлаа. Дахин оролдоно уу.',
    'en': 'Could not save the signature. Please try again.',
    'zh': '保存签名失败，请重试。',
    'ru': 'Не удалось сохранить подпись. Попробуйте ещё раз.'
  },
  'terms.status_signed': {
    'mn': 'Гарын үсэг зурсан: {date} (хувилбар {version})',
    'en': 'Signed on {date} (version {version})',
    'zh': '已于 {date} 签名（版本 {version}）',
    'ru': 'Подписано {date} (версия {version})'
  },
  'terms.status_updated': {
    'mn': 'Нөхцөл {date}-нд шинэчлэгдсэн (хувилбар {version}). Үргэлжлүүлэхийн тулд дахин гарын үсэг зурна уу.',
    'en': 'The terms were updated on {date} (version {version}). Please sign again to continue.',
    'zh': '条款已于 {date} 更新（版本 {version}），请重新签名以继续。',
    'ru': 'Условия обновлены {date} (версия {version}). Подпишите снова, чтобы продолжить.'
  },
  'terms.status_sign_required': {
    'mn': 'Зөвшөөрөхөд гарын үсэг зурна.',
    'en': 'A signature is required to accept.',
    'zh': '接受需要签名。',
    'ru': 'Для принятия требуется подпись.'
  },

  // Алтан хуримтлалын зорилт (gold_goal_selector.dart)
  'order.goal_title': {
    'mn': 'Алтан хуримтлалын зорилт',
    'en': 'Gold savings goal',
    'zh': '黄金积累目标',
    'ru': 'Цель накопления золота'
  },
  'order.goal_hint': {
    'mn': 'Та хэдэн грамм алт хуримтлуулахаар зорьж байна вэ?',
    'en': 'How many grams of gold do you aim to accumulate?',
    'zh': '您计划积累多少克黄金？',
    'ru': 'Сколько граммов золота вы планируете накопить?'
  },
  'order.goal_grams': {
    'mn': '{grams} гр',
    'en': '{grams} g',
    'zh': '{grams} 克',
    'ru': '{grams} г'
  },
  'order.goal_required': {
    'mn': 'Алтан хуримтлалын зорилтоо сонгоно уу.',
    'en': 'Please choose your gold savings goal.',
    'zh': '请选择您的黄金积累目标。',
    'ru': 'Выберите цель накопления золота.'
  },
  'order.goal_save_failed': {
    'mn': 'Зорилт хадгалахад алдаа гарлаа. Дахин оролдоно уу.',
    'en': 'Could not save your goal. Please try again.',
    'zh': '保存目标失败，请重试。',
    'ru': 'Не удалось сохранить цель. Попробуйте ещё раз.'
  },
};
