/// PIN code screens: set / enter / change PIN, and the "forgot PIN" reset flow.
const Map<String, Map<String, String>> kAuthPinTranslations = {
  // ---- Titles & headings ----
  'auth.user_pin_title': {
    'mn': 'Хэрэглэгчийн PIN код',
    'en': 'User PIN code',
    'zh': '用户PIN码',
    'ru': 'PIN-код пользователя'
  },
  'auth.verification_code': {
    'mn': 'Баталгаажуулах код',
    'en': 'Verification code',
    'zh': '验证码',
    'ru': 'Код подтверждения'
  },
  'auth.register_number': {
    'mn': 'Регистрийн дугаар',
    'en': 'Registration number',
    'zh': '身份证号',
    'ru': 'Регистрационный номер'
  },
  'auth.current_pin': {
    'mn': 'Одоогийн PIN код',
    'en': 'Current PIN code',
    'zh': '当前PIN码',
    'ru': 'Текущий PIN-код'
  },
  'auth.new_pin': {
    'mn': 'Шинэ PIN код',
    'en': 'New PIN code',
    'zh': '新PIN码',
    'ru': 'Новый PIN-код'
  },
  'auth.confirm_pin_title': {
    'mn': 'PIN код баталгаажуулах',
    'en': 'Confirm PIN code',
    'zh': '确认PIN码',
    'ru': 'Подтверждение PIN-кода'
  },

  // ---- Prompts & descriptions ----
  'auth.greeting': {
    'mn': 'Сайн байна уу? {name}',
    'en': 'Hello, {name}',
    'zh': '您好，{name}',
    'ru': 'Здравствуйте, {name}'
  },
  'auth.enter_your_pin': {
    'mn': 'Та PIN кодоо оруулна уу',
    'en': 'Please enter your PIN code',
    'zh': '请输入您的PIN码',
    'ru': 'Введите свой PIN-код'
  },
  'auth.reenter_your_pin_confirm': {
    'mn': 'Та PIN кодоо дахин оруулж баталгаажуулна уу',
    'en': 'Please re-enter your PIN code to confirm',
    'zh': '请再次输入PIN码以确认',
    'ru': 'Введите PIN-код ещё раз для подтверждения'
  },
  'auth.confirm_pin_again': {
    'mn': 'PIN кодоо дахин оруулж баталгаажуулна уу',
    'en': 'Re-enter your PIN code to confirm',
    'zh': '请再次输入PIN码以确认',
    'ru': 'Введите PIN-код ещё раз для подтверждения'
  },
  'auth.enter_new_pin': {
    'mn': 'Шинэ PIN кодоо оруулна уу',
    'en': 'Enter your new PIN code',
    'zh': '请输入新的PIN码',
    'ru': 'Введите новый PIN-код'
  },
  'auth.enter_current_pin': {
    'mn': 'Одоогийн PIN кодоо оруулна уу',
    'en': 'Enter your current PIN code',
    'zh': '请输入当前PIN码',
    'ru': 'Введите текущий PIN-код'
  },
  'auth.enter_new_pin_code': {
    'mn': 'Шинэ PIN кодоо оруулна уу',
    'en': 'Enter your new PIN code',
    'zh': '请输入新的PIN码',
    'ru': 'Введите новый PIN-код'
  },
  'auth.reenter_new_pin': {
    'mn': 'Шинэ PIN кодоо дахин оруулна уу',
    'en': 'Re-enter your new PIN code',
    'zh': '请再次输入新的PIN码',
    'ru': 'Введите новый PIN-код ещё раз'
  },
  'auth.set_pin_intro': {
    'mn':
        'Та PIN кодоо тохируулна уу. Уг 6 оронтой тоо нь таны дансны аюулгүй байдлыг хангана.',
    'en':
        'Please set your PIN code. This 6-digit number keeps your account secure.',
    'zh': '请设置您的PIN码。此6位数字用于保护您的账户安全。',
    'ru':
        'Задайте свой PIN-код. Эти 6 цифр обеспечивают безопасность вашего счёта.'
  },
  'auth.otp_sent_to': {
    'mn': 'Бид {input} руу баталгаажуулах код илгээлээ. Кодоо оруулна уу.',
    'en': 'We sent a verification code to {input}. Please enter the code.',
    'zh': '我们已向 {input} 发送验证码。请输入验证码。',
    'ru': 'Мы отправили код подтверждения на {input}. Введите код.'
  },
  'auth.otp_not_received': {
    'mn': 'OTP код ирээгүй юу? Код дахин авах',
    'en': "Didn't get the OTP code? Resend code",
    'zh': '未收到OTP验证码？重新发送',
    'ru': 'Не получили OTP-код? Отправить повторно'
  },
  'auth.register_number_hint': {
    'mn':
        'Таны регистрийн дугаараар таныг баталгаажуулах тул үнэн зөв оруулна уу.',
    'en':
        'Your registration number is used to verify your identity, so enter it correctly.',
    'zh': '我们将通过您的身份证号验证身份，请准确填写。',
    'ru':
        'Ваш регистрационный номер используется для проверки личности, введите его верно.'
  },

  // ---- Actions ----
  'auth.change_pin': {
    'mn': 'PIN код солих',
    'en': 'Change PIN',
    'zh': '修改PIN码',
    'ru': 'Сменить PIN-код'
  },
  'auth.forgot_pin': {
    'mn': 'PIN кодоо мартсан уу?',
    'en': 'Forgot your PIN code?',
    'zh': '忘记PIN码？',
    'ru': 'Забыли PIN-код?'
  },
  'auth.sign_in_other_user': {
    'mn': 'Өөр хэрэглэгчээр нэвтрэх',
    'en': 'Sign in as another user',
    'zh': '使用其他账户登录',
    'ru': 'Войти под другим пользователем'
  },

  // ---- Validation & errors ----
  'auth.otp_must_be_4': {
    'mn': 'OTP код 4 оронтой байх ёстой',
    'en': 'The OTP code must be 4 digits',
    'zh': 'OTP验证码必须为4位数字',
    'ru': 'OTP-код должен состоять из 4 цифр'
  },
  'auth.register_must_be_8': {
    'mn': 'Регистрийн дугаар 8 оронтой байх ёстой',
    'en': 'The registration number must be 8 digits',
    'zh': '身份证号必须为8位数字',
    'ru': 'Регистрационный номер должен состоять из 8 цифр'
  },
  'auth.pin_must_be_6': {
    'mn': 'PIN код 6 оронтой байх ёстой',
    'en': 'The PIN code must be 6 digits',
    'zh': 'PIN码必须为6位数字',
    'ru': 'PIN-код должен состоять из 6 цифр'
  },
  'auth.set_pin_must_be_6': {
    'mn': 'PIN код 6 оронтой байх ёстой',
    'en': 'The PIN code must be 6 digits',
    'zh': 'PIN码必须为6位数字',
    'ru': 'PIN-код должен состоять из 6 цифр'
  },
  'auth.change_pin_must_be_6': {
    'mn': 'PIN код 6 оронтой байх ёстой',
    'en': 'The PIN code must be 6 digits',
    'zh': 'PIN码必须为6位数字',
    'ru': 'PIN-код должен состоять из 6 цифр'
  },
  'auth.pin_mismatch': {
    'mn': 'PIN кодууд таарахгүй байна',
    'en': 'The PIN codes do not match',
    'zh': 'PIN码不一致',
    'ru': 'PIN-коды не совпадают'
  },
  'auth.pin_codes_mismatch': {
    'mn': 'PIN кодууд таарахгүй байна',
    'en': 'The PIN codes do not match',
    'zh': 'PIN码不一致',
    'ru': 'PIN-коды не совпадают'
  },
  'auth.pin_incorrect': {
    'mn': 'PIN код буруу байна',
    'en': 'Incorrect PIN code',
    'zh': 'PIN码错误',
    'ru': 'Неверный PIN-код'
  },
  'auth.current_pin_incorrect': {
    'mn': 'Одоогийн PIN код буруу байна',
    'en': 'The current PIN code is incorrect',
    'zh': '当前PIN码错误',
    'ru': 'Текущий PIN-код неверен'
  },
  'auth.pin_save_failed': {
    'mn': 'PIN код хадгалах үед алдаа гарлаа',
    'en': 'Failed to save the PIN code',
    'zh': '保存PIN码时出错',
    'ru': 'Не удалось сохранить PIN-код'
  },
  'auth.pin_change_failed': {
    'mn': 'PIN код солихад алдаа гарлаа',
    'en': 'Failed to change the PIN code',
    'zh': '修改PIN码时出错',
    'ru': 'Не удалось сменить PIN-код'
  },

  // ---- Success ----
  'auth.pin_changed_success': {
    'mn': 'PIN код амжилттай солигдлоо',
    'en': 'PIN code changed successfully',
    'zh': 'PIN码修改成功',
    'ru': 'PIN-код успешно изменён'
  },
  'auth.pin_updated_success': {
    'mn': 'PIN код амжилттай шинэчлэгдлээ',
    'en': 'PIN updated successfully',
    'zh': 'PIN码更新成功',
    'ru': 'PIN-код успешно обновлён'
  },
  'auth.pin_changed_sign_in': {
    'mn': 'PIN код амжилттай солигдлоо. Шинэ PIN кодоороо нэвтэрнэ үү.',
    'en': 'PIN code changed successfully. Sign in with your new PIN code.',
    'zh': 'PIN码修改成功。请使用新的PIN码登录。',
    'ru': 'PIN-код успешно изменён. Войдите с новым PIN-кодом.'
  },

  // ---------------------------------------------------------------------------
  // Sign-in / OTP / PIN reset entry points
  // ---------------------------------------------------------------------------
  'auth.sign_in': {'mn': 'Нэвтрэх', 'en': 'Sign in', 'zh': '登录', 'ru': 'Войти'},
  'auth.reset_pin_title': {
    'mn': 'PIN код сэргээх',
    'en': 'Reset PIN code',
    'zh': '重置PIN码',
    'ru': 'Восстановление PIN-кода'
  },
  'auth.reset_pin_input_label': {
    'mn': 'PIN код сэргээхэд ашиглах утасны дугаар эсвэл и-мэйл хаяг',
    'en': 'Phone number or email address for the PIN reset',
    'zh': '用于重置PIN码的手机号或电子邮箱',
    'ru': 'Номер телефона или эл. почта для восстановления PIN-кода'
  },
  'auth.send_verification_code': {
    'mn': 'Баталгаажуулах код илгээх',
    'en': 'Send verification code',
    'zh': '发送验证码',
    'ru': 'Отправить код подтверждения'
  },
  'auth.phone_or_email_label': {
    'mn': 'Утасны дугаар эсвэл и-мэйл хаяг',
    'en': 'Phone number or email address',
    'zh': '手机号或电子邮箱',
    'ru': 'Номер телефона или эл. почта'
  },
  'auth.phone_or_email_invalid': {
    'mn': 'Утасны дугаар эсвэл и-мэйлээ зөв оруулна уу',
    'en': 'Please enter a valid phone number or email address',
    'zh': '请正确输入手机号或电子邮箱',
    'ru': 'Введите корректный номер телефона или эл. почту'
  },
  'auth.otp_send_failed_code': {
    'mn': 'OTP код илгээхэд алдаа гарлаа. Код: {code}',
    'en': 'Failed to send the OTP code. Code: {code}',
    'zh': '发送OTP验证码失败。代码：{code}',
    'ru': 'Не удалось отправить OTP-код. Код: {code}'
  },
  'auth.verify_failed': {
    'mn': 'Баталгаажуулахад алдаа гарлаа!',
    'en': 'Verification failed!',
    'zh': '验证失败！',
    'ru': 'Ошибка подтверждения!'
  },
  'auth.network_error': {
    'mn': 'Сүлжээний алдаа',
    'en': 'Network error',
    'zh': '网络错误',
    'ru': 'Ошибка сети'
  },
};
