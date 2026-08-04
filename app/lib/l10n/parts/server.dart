/// Backend (Cloud Functions) response messages.
///
/// The server always answers in Mongolian; `trServer()` in `app_locale.dart`
/// looks a raw response string up by its `mn` value here and re-emits it in
/// the active language. Because the `mn` value doubles as the runtime lookup
/// key, it must stay BYTE-IDENTICAL to the exact string the backend sends
/// (including trailing periods) — do not "fix" wording here without changing
/// the backend first.
///
/// Interpolated backend messages use `{p0}`-style placeholders; the same
/// placeholders must appear in every language.
const Map<String, Map<String, String>> kServerTranslations = {
  // ---- payment/createTreeOrder.js ----
  'server.tree_label_name_length': {
    'mn': 'Шошгон дээр хэвлэгдэх нэр 2-40 тэмдэгт байна.',
    'en': 'The name printed on the plaque must be 2-40 characters.',
    'zh': '标签上印制的名字须为2-40个字符。',
    'ru': 'Имя на табличке должно содержать от 2 до 40 символов.',
  },
  'server.tree_campaign_inactive': {
    'mn': 'Дэмжлэгийн аян идэвхгүй байна.',
    'en': 'The support campaign is not active.',
    'zh': '支持活动尚未开启。',
    'ru': 'Кампания поддержки неактивна.',
  },
  'server.tree_not_found': {
    'mn': 'Мод олдсонгүй.',
    'en': 'Tree not found.',
    'zh': '未找到该树木。',
    'ru': 'Дерево не найдено.',
  },
  'server.tree_inactive': {
    'mn': 'Энэ мод идэвхгүй байна.',
    'en': 'This tree is not active.',
    'zh': '该树木未开放。',
    'ru': 'Это дерево неактивно.',
  },
  'server.tree_out_of_stock': {
    'mn': 'Модны нөөц хүрэлцэхгүй байна.',
    'en': 'Not enough trees in stock.',
    'zh': '树木库存不足。',
    'ru': 'Недостаточно саженцев в наличии.',
  },
  'server.tree_invalid_price': {
    'mn': 'Модны үнэ буруу байна.',
    'en': 'Invalid tree price.',
    'zh': '树木价格有误。',
    'ru': 'Неверная цена дерева.',
  },
  'server.tree_order_failed': {
    'mn': 'Мод тарих захиалга үүсгэхэд алдаа гарлаа.',
    'en': 'Failed to create the tree-planting order.',
    'zh': '创建植树订单时出错。',
    'ru': 'Не удалось создать заказ на посадку дерева.',
  },
  // ---- payment/createCenterDonation.js ----
  'server.donation_campaign_inactive': {
    'mn': 'Хандивын аян идэвхгүй байна.',
    'en': 'The donation campaign is not active.',
    'zh': '捐赠活动尚未开启。',
    'ru': 'Благотворительная кампания неактивна.',
  },
  'server.donation_product_not_found': {
    'mn': 'Бараа олдсонгүй: {p0}',
    'en': 'Product not found: {p0}',
    'zh': '未找到商品：{p0}',
    'ru': 'Товар не найден: {p0}',
  },
  'server.donation_product_inactive': {
    'mn': 'Бараа идэвхгүй: {p0}',
    'en': 'Product is not active: {p0}',
    'zh': '商品未上架：{p0}',
    'ru': 'Товар неактивен: {p0}',
  },
  'server.donation_out_of_stock': {
    'mn': 'Нөөц хүрэлцэхгүй: {p0}',
    'en': 'Not enough stock: {p0}',
    'zh': '库存不足：{p0}',
    'ru': 'Недостаточно на складе: {p0}',
  },
  'server.donation_invalid_price': {
    'mn': 'Үнэ буруу: {p0}',
    'en': 'Invalid price: {p0}',
    'zh': '价格有误：{p0}',
    'ru': 'Неверная цена: {p0}',
  },
  // ---- payment/createInstallmentInit.js ----
  'server.installment_already_active': {
    'mn': 'Танд аль хэдийн идэвхтэй хуваан төлөлт байна. '
        'Үүнийгээ дуусгасны дараа шинээр эхлүүлнэ үү.',
    'en': 'You already have an active installment plan. '
        'Finish it before starting a new one.',
    'zh': '您已有一个进行中的分期付款。请先完成后再开始新的分期。',
    'ru': 'У вас уже есть активная рассрочка. '
        'Завершите её, прежде чем начинать новую.',
  },
  // ---- payment/createInstallmentPayment.js ----
  'server.installment_cancel_pending': {
    'mn': 'Цуцлах хүсэлт хүлээгдэж байгаа тул төлбөр хийх боломжгүй.',
    'en': 'A cancellation request is pending, so payments cannot be made.',
    'zh': '取消申请正在等待处理，暂时无法付款。',
    'ru':
        'Запрос на отмену находится на рассмотрении, поэтому оплата невозможна.',
  },
  // ---- payment/requestInstallmentCancel.js ----
  'server.cancel_select_bank': {
    'mn': 'Банк сонгоно уу.',
    'en': 'Please select a bank.',
    'zh': '请选择银行。',
    'ru': 'Пожалуйста, выберите банк.',
  },
  'server.cancel_invalid_account_number': {
    'mn': 'Дансны дугаар буруу байна (зөвхөн тоо, 5-20 орон).',
    'en': 'Invalid account number (digits only, 5-20 digits).',
    'zh': '账号有误（仅限数字，5-20位）。',
    'ru': 'Неверный номер счёта (только цифры, от 5 до 20 знаков).',
  },
  'server.cancel_enter_recipient_name': {
    'mn': 'Хүлээн авагчийн нэрээ оруулна уу.',
    'en': "Please enter the recipient's name.",
    'zh': '请输入收款人姓名。',
    'ru': 'Пожалуйста, укажите имя получателя.',
  },
  'server.purchase_not_found': {
    'mn': 'Худалдан авалт олдсонгүй.',
    'en': 'Purchase not found.',
    'zh': '未找到该购买记录。',
    'ru': 'Покупка не найдена.',
  },
  'server.purchase_not_yours': {
    'mn': 'Энэ худалдан авалт таных биш байна.',
    'en': 'This purchase does not belong to you.',
    'zh': '该购买记录不属于您。',
    'ru': 'Эта покупка вам не принадлежит.',
  },
  'server.cancel_only_installment': {
    'mn': 'Зөвхөн хуваан төлөлтийг цуцлах хүсэлт гаргана.',
    'en': 'Cancellation requests apply only to installment plans.',
    'zh': '仅可对分期付款提交取消申请。',
    'ru': 'Запрос на отмену возможен только для рассрочки.',
  },
  'server.cancel_only_active': {
    'mn': 'Зөвхөн идэвхтэй хуваан төлөлтийг цуцална.',
    'en': 'Only an active installment plan can be cancelled.',
    'zh': '仅可取消进行中的分期付款。',
    'ru': 'Отменить можно только активную рассрочку.',
  },
  'server.cancel_already_pending': {
    'mn': 'Цуцлах хүсэлт аль хэдийн илгээгдсэн байна.',
    'en': 'A cancellation request has already been submitted.',
    'zh': '取消申请已提交。',
    'ru': 'Запрос на отмену уже отправлен.',
  },
  'server.cancel_request_failed': {
    'mn': 'Цуцлах хүсэлт үүсгэхэд алдаа гарлаа.',
    'en': 'Failed to create the cancellation request.',
    'zh': '创建取消申请时出错。',
    'ru': 'Не удалось создать запрос на отмену.',
  },
  // ---- payment/createGift.js ----
  'server.gift_daily_gold_limit': {
    'mn': 'Өдөрт зөвхөн 1гр алтыг бэлэг болгон илгээх боломжтой.',
    'en': 'You can gift at most 1g of gold per day.',
    'zh': '每天最多只能赠送1克黄金。',
    'ru': 'В день можно подарить не более 1 г золота.',
  },
  'server.gift_daily_limit': {
    'mn': 'Та өдөрт 1 удаа бэлгийн хүсэлт илгээх боломжтой',
    'en': 'You can send only one gift request per day',
    'zh': '每天只能发送一次赠送请求',
    'ru': 'Вы можете отправить только один подарок в день',
  },
  // Shared by createGift.js, withdrawRequest.js, setPin.js, verifyPin.js and
  // userResetPin.js — all use this exact wording.
  'server.pin_must_be_6_digit_number': {
    'mn': 'PIN код 6 оронтой тоо байх ёстой',
    'en': 'PIN must be a 6-digit number',
    'zh': 'PIN 码必须为6位数字',
    'ru': 'PIN должен состоять из 6 цифр',
  },
  // ---- payment/withdrawRequest.js ----
  'server.withdraw_request_sent': {
    'mn': 'Биетээр авах хүсэлт амжилттай илгээлээ. '
        'Таны бүртгэлтэй утас эсвэл имэйл хаяг руу баталгаажуулах код илгээлээ.',
    'en': 'Your physical withdrawal request has been submitted. '
        'A verification code has been sent to your registered phone or email.',
    'zh': '实物提取申请已成功提交。验证码已发送至您注册的手机号或邮箱。',
    'ru': 'Запрос на физическое получение успешно отправлен. '
        'Код подтверждения отправлен на ваш зарегистрированный телефон или email.',
  },
  // ---- auth/changePin.js ----
  'server.pin_must_be_6_chars': {
    'mn': 'PIN код 6 оронтой байх ёстой',
    'en': 'PIN must be 6 digits long',
    'zh': 'PIN 码必须为6位',
    'ru': 'PIN должен состоять из 6 знаков',
  },
  'server.pin_must_be_digits_only': {
    'mn': 'PIN код зөвхөн 6 оронтой тоо байх ёстой',
    'en': 'PIN must contain only 6 digits',
    'zh': 'PIN 码只能是6位数字',
    'ru': 'PIN должен содержать только 6 цифр',
  },
  'server.pin_new_must_differ': {
    'mn': 'Шинэ PIN код одоогийнхоос өөр байх ёстой',
    'en': 'The new PIN must be different from the current one',
    'zh': '新 PIN 码必须与当前 PIN 码不同',
    'ru': 'Новый PIN должен отличаться от текущего',
  },
  'server.token_expired': {
    'mn': 'Token хугацаа дууссан',
    'en': 'Token has expired',
    'zh': 'Token 已过期',
    'ru': 'Срок действия Token истёк',
  },
  'server.token_wrong': {
    'mn': 'Буруу token',
    'en': 'Invalid token',
    'zh': '无效的 token',
    'ru': 'Неверный token',
  },
  // Shared by changePin.js and userResetPin.js.
  'server.user_not_found': {
    'mn': 'Хэрэглэгч олдсонгүй',
    'en': 'User not found',
    'zh': '未找到用户',
    'ru': 'Пользователь не найден',
  },
  'server.pin_not_set': {
    'mn': 'PIN код тохируулагдаагүй байна',
    'en': 'PIN has not been set',
    'zh': '尚未设置 PIN 码',
    'ru': 'PIN не установлен',
  },
  'server.pin_check_failed': {
    'mn': 'PIN шалгахад алдаа гарлаа',
    'en': 'Failed to verify PIN',
    'zh': '校验 PIN 时出错',
    'ru': 'Ошибка при проверке PIN',
  },
  'server.pin_current_wrong': {
    'mn': 'Одоогийн PIN код буруу байна',
    'en': 'The current PIN is incorrect',
    'zh': '当前 PIN 码不正确',
    'ru': 'Текущий PIN неверен',
  },
  'server.pin_save_new_failed': {
    'mn': 'Шинэ PIN кодыг хадгалахад алдаа гарлаа',
    'en': 'Failed to save the new PIN',
    'zh': '保存新 PIN 码时出错',
    'ru': 'Не удалось сохранить новый PIN',
  },
  'server.pin_update_failed': {
    'mn': 'PIN код шинэчлэхэд алдаа гарлаа',
    'en': 'Failed to update PIN',
    'zh': '更新 PIN 码时出错',
    'ru': 'Не удалось обновить PIN',
  },
  'server.pin_changed_success': {
    'mn': 'PIN код амжилттай солигдлоо',
    'en': 'PIN changed successfully',
    'zh': 'PIN 码修改成功',
    'ru': 'PIN успешно изменён',
  },
  'server.server_error': {
    'mn': 'Серверийн алдаа гарлаа',
    'en': 'A server error occurred',
    'zh': '服务器发生错误',
    'ru': 'Произошла ошибка сервера',
  },
  // ---- auth/setPin.js, auth/verifyPin.js ----
  'server.success': {
    'mn': 'Амжилттай',
    'en': 'Success',
    'zh': '成功',
    'ru': 'Успешно',
  },
  'server.pin_wrong': {
    'mn': 'Пин буруу',
    'en': 'Incorrect PIN',
    'zh': 'PIN 码错误',
    'ru': 'Неверный PIN',
  },
  // ---- auth/userResetPin.js ----
  'server.auth_header_required': {
    'mn': 'Authorization header шаардлагатай (Bearer token)',
    'en': 'Authorization header required (Bearer token)',
    'zh': '需要 Authorization 请求头（Bearer token）',
    'ru': 'Требуется заголовок Authorization (Bearer token)',
  },
  'server.reset_fields_required': {
    'mn': 'registerNum, newPin, otpCode, input талбарууд шаардлагатай',
    'en': 'The registerNum, newPin, otpCode and input fields are required',
    'zh': 'registerNum、newPin、otpCode、input 为必填字段',
    'ru': 'Поля registerNum, newPin, otpCode и input обязательны',
  },
  'server.token_invalid': {
    'mn': 'Token хүчингүй байна',
    'en': 'Token is invalid',
    'zh': 'Token 无效',
    'ru': 'Token недействителен',
  },
  'server.register_number_wrong': {
    'mn': 'Хэрэглэгчийн регистерийн дугаар буруу байна',
    'en': "The user's registration number is incorrect",
    'zh': '用户的注册号有误',
    'ru': 'Регистрационный номер пользователя неверен',
  },
  'server.reset_input_invalid': {
    'mn': 'input утга буруу байна (утас эсвэл и-мэйл байх ёстой)',
    'en': 'Invalid input value (must be a phone number or email)',
    'zh': 'input 值有误（须为手机号或邮箱）',
    'ru': 'Неверное значение input (нужен телефон или адрес эл. почты)',
  },
  'server.reset_only_own_pin': {
    'mn': 'Зөвхөн өөрийнхөө бүртгэлийн pincode-г солих боломжтой',
    'en': 'You can only change the pincode of your own account',
    'zh': '只能修改本人账户的 pincode',
    'ru': 'Можно изменить pincode только своей учётной записи',
  },
  'server.otp_request_not_found': {
    'mn': 'OTP хүсэлт олдсонгүй. Эхлээд requestOtp ашиглан OTP авна уу',
    'en': 'OTP request not found. Please request an OTP first via requestOtp',
    'zh': '未找到 OTP 请求。请先通过 requestOtp 获取 OTP',
    'ru': 'Запрос OTP не найден. Сначала получите OTP через requestOtp',
  },
  'server.otp_invalid': {
    'mn': 'OTP хүчингүй байна',
    'en': 'OTP is invalid',
    'zh': 'OTP 无效',
    'ru': 'OTP недействителен',
  },
  'server.otp_expired': {
    'mn': 'OTP кодын хугацаа дууссан',
    'en': 'The OTP code has expired',
    'zh': 'OTP 验证码已过期',
    'ru': 'Срок действия кода OTP истёк',
  },
  'server.otp_wrong': {
    'mn': 'OTP код буруу байна',
    'en': 'The OTP code is incorrect',
    'zh': 'OTP 验证码不正确',
    'ru': 'Код OTP неверен',
  },
  'server.pin_reset_success': {
    'mn': 'PIN амжилттай шинэчлэгдлээ',
    'en': 'PIN updated successfully',
    'zh': 'PIN 更新成功',
    'ru': 'PIN успешно обновлён',
  },
};
