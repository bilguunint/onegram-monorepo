/// Registration / KYC / profile screens.
///
/// Covers the sign-up wizard (name, age, national ID), OTP verification,
/// the category picker shown during onboarding, the profile screen and the
/// two "update my details" forms.
const Map<String, Map<String, String>> kRegisterProfileTranslations = {
  // ---------------------------------------------------------------------
  // Screen titles
  // ---------------------------------------------------------------------
  'reg.sign_up': {
    'mn': 'Бүртгүүлэх',
    'en': 'Sign up',
    'zh': '注册',
    'ru': 'Регистрация'
  },
  'reg.user_registration': {
    'mn': 'Хэрэглэгчийн бүртгэл',
    'en': 'User registration',
    'zh': '用户注册',
    'ru': 'Регистрация пользователя'
  },
  'reg.update_national_id': {
    'mn': 'Регистрийн дугаар шинэчлэх',
    'en': 'Update national ID number',
    'zh': '更新身份证号码',
    'ru': 'Обновить регистрационный номер'
  },
  'reg.edit_profile': {
    'mn': 'Бүртгэл засах',
    'en': 'Edit profile',
    'zh': '编辑资料',
    'ru': 'Редактировать профиль'
  },

  // ---------------------------------------------------------------------
  // Field labels & placeholders
  // ---------------------------------------------------------------------
  'reg.last_name': {
    'mn': 'Овог',
    'en': 'Last name',
    'zh': '姓',
    'ru': 'Фамилия'
  },
  'reg.first_name': {'mn': 'Нэр', 'en': 'First name', 'zh': '名', 'ru': 'Имя'},
  'reg.national_id': {
    'mn': 'Регистрийн дугаар',
    'en': 'National ID number',
    'zh': '身份证号码',
    'ru': 'Регистрационный номер'
  },
  'reg.last_name_hint': {
    'mn': 'Овогоо оруулна уу',
    'en': 'Enter your last name',
    'zh': '请输入姓',
    'ru': 'Введите фамилию'
  },
  'reg.first_name_hint': {
    'mn': 'Нэрээ оруулна уу',
    'en': 'Enter your first name',
    'zh': '请输入名',
    'ru': 'Введите имя'
  },
  'reg.last_name_placeholder': {
    'mn': 'Овог оруулна уу',
    'en': 'Enter last name',
    'zh': '请输入姓',
    'ru': 'Введите фамилию'
  },
  'reg.first_name_placeholder': {
    'mn': 'Нэр оруулна уу',
    'en': 'Enter first name',
    'zh': '请输入名',
    'ru': 'Введите имя'
  },

  // ---------------------------------------------------------------------
  // Wizard steps
  // ---------------------------------------------------------------------
  'reg.age_question': {
    'mn': 'Та хэдэн настай вэ?',
    'en': 'How old are you?',
    'zh': '您的年龄是？',
    'ru': 'Сколько вам лет?'
  },
  'reg.age_hint': {
    'mn':
        'Таны насанд тохирох мэдээллийг хүргэх учир та өөрийн насыг үнэн зөв оруулна уу.',
    'en': 'We tailor content to your age, so please enter it accurately.',
    'zh': '我们会根据您的年龄推荐内容，请如实填写。',
    'ru': 'Мы подбираем материалы по возрасту, поэтому укажите его точно.'
  },
  'reg.enter_national_id_title': {
    'mn': 'Та регистрийн дугаараа оруулна уу.',
    'en': 'Enter your national ID number.',
    'zh': '请输入您的身份证号码。',
    'ru': 'Введите ваш регистрационный номер.'
  },
  'reg.national_id_hint': {
    'mn':
        'Таны регистрийн дугаараар таныг баталгаажуулах тул та өөрийн регистрийн дугаарыг үнэн зөв оруулна уу.',
    'en':
        'Your identity is verified by your national ID number, so please enter it accurately.',
    'zh': '我们将通过您的身份证号码核实身份，请如实填写。',
    'ru':
        'Ваша личность подтверждается по регистрационному номеру, поэтому укажите его точно.'
  },
  'reg.enter_your_info': {
    'mn': 'Та мэдээллээ оруулна уу.',
    'en': 'Enter your details.',
    'zh': '请填写您的信息。',
    'ru': 'Введите ваши данные.'
  },
  'reg.verify_info_hint': {
    'mn':
        'Таны нэр, овог, регистрийн дугаараар таныг баталгаажуулах тул үнэн зөв мэдээлэл оруулна уу.',
    'en':
        'Your identity is verified by your name and national ID number, so please enter accurate details.',
    'zh': '我们将通过您的姓名和身份证号码核实身份，请如实填写。',
    'ru':
        'Ваша личность подтверждается по имени, фамилии и регистрационному номеру, поэтому вводите точные данные.'
  },
  'reg.edit_profile_hint': {
    'mn': 'Та өөрийн нэр, овгийг шинэчлэх боломжтой.',
    'en': 'You can update your first and last name.',
    'zh': '您可以修改姓名。',
    'ru': 'Вы можете изменить имя и фамилию.'
  },
  'reg.finish': {
    'mn': 'Дуусгах',
    'en': 'Finish',
    'zh': '完成',
    'ru': 'Завершить'
  },

  // ---------------------------------------------------------------------
  // Validation messages
  // ---------------------------------------------------------------------
  'reg.fill_all_fields': {
    'mn': 'Бүх талбарыг бөглөнө үү.',
    'en': 'Please fill in all fields.',
    'zh': '请填写所有字段。',
    'ru': 'Пожалуйста, заполните все поля.'
  },
  'reg.invalid_first_name': {
    'mn': 'Нэр зөвхөн үсэг агуулж, хамгийн багадаа 2 тэмдэгт байх ёстой.',
    'en': 'First name must contain letters only and be at least 2 characters.',
    'zh': '名只能包含字母，且至少 2 个字符。',
    'ru': 'Имя должно содержать только буквы и быть не короче 2 символов.'
  },
  'reg.invalid_last_name': {
    'mn': 'Овог зөвхөн үсэг агуулж, хамгийн багадаа 2 тэмдэгт байх ёстой.',
    'en': 'Last name must contain letters only and be at least 2 characters.',
    'zh': '姓只能包含字母，且至少 2 个字符。',
    'ru': 'Фамилия должна содержать только буквы и быть не короче 2 символов.'
  },
  'reg.invalid_first_name_format': {
    'mn': 'Нэрээ зөв оруулна уу.',
    'en': 'Please enter a valid first name.',
    'zh': '请输入有效的名。',
    'ru': 'Введите корректное имя.'
  },
  'reg.invalid_last_name_format': {
    'mn': 'Овгоо зөв оруулна уу.',
    'en': 'Please enter a valid last name.',
    'zh': '请输入有效的姓。',
    'ru': 'Введите корректную фамилию.'
  },
  'reg.age_range_error': {
    'mn': 'Бүртгүүлэхэд 18-80 насны хооронд байх ёстой.',
    'en': 'You must be between 18 and 80 years old to register.',
    'zh': '注册年龄需在 18 至 80 岁之间。',
    'ru': 'Для регистрации возраст должен быть от 18 до 80 лет.'
  },
  'reg.national_id_8_digits': {
    'mn': 'Регистрийн дугаар 8 оронтой тоо байх ёстой.',
    'en': 'The national ID number must be 8 digits.',
    'zh': '身份证号码必须为 8 位数字。',
    'ru': 'Регистрационный номер должен состоять из 8 цифр.'
  },
  'reg.select_national_id_letters': {
    'mn': 'Регистрийн дугаарын үсгүүдийг сонгоно уу.',
    'en': 'Please select the letters of your national ID number.',
    'zh': '请选择身份证号码的字母。',
    'ru': 'Выберите буквы регистрационного номера.'
  },
  'reg.check_all_fields': {
    'mn': 'Бүх мэдээлэл зөв бөглөгдөөгүй байна. Дахин шалгана уу.',
    'en': 'Some details are incorrect. Please check again.',
    'zh': '部分信息填写有误，请重新检查。',
    'ru': 'Некоторые данные заполнены неверно. Проверьте ещё раз.'
  },
  'reg.enter_first_name_error': {
    'mn': 'Нэрээ оруулна уу.',
    'en': 'Please enter your first name.',
    'zh': '请输入您的名。',
    'ru': 'Введите ваше имя.'
  },
  'reg.enter_last_name_error': {
    'mn': 'Овогоо оруулна уу.',
    'en': 'Please enter your last name.',
    'zh': '请输入您的姓。',
    'ru': 'Введите вашу фамилию.'
  },

  // ---------------------------------------------------------------------
  // Dialogs & feedback
  // ---------------------------------------------------------------------
  'reg.error_title': {'mn': 'Алдаа', 'en': 'Error', 'zh': '错误', 'ru': 'Ошибка'},
  'reg.got_it': {
    'mn': 'Ойлголоо',
    'en': 'Got it',
    'zh': '知道了',
    'ru': 'Понятно'
  },
  'reg.info_updated': {
    'mn': 'Мэдээлэл амжилттай шинэчлэгдлээ',
    'en': 'Your details were updated',
    'zh': '信息已更新',
    'ru': 'Данные успешно обновлены'
  },
  'reg.profile_updated': {
    'mn': 'Бүртгэл амжилттай шинэчлэгдлээ',
    'en': 'Your profile was updated',
    'zh': '资料已更新',
    'ru': 'Профиль успешно обновлён'
  },

  // ---------------------------------------------------------------------
  // OTP verification
  // ---------------------------------------------------------------------
  'reg.verification_code': {
    'mn': 'Баталгаажуулах код',
    'en': 'Verification code',
    'zh': '验证码',
    'ru': 'Код подтверждения'
  },
  'reg.verification_code_sent': {
    'mn':
        'Бид таны {phone} дугаарт баталгаажуулах код мессежээр илгээлээ. Кодоо оруулан нэвтрэх эрхээ баталгаажуулна уу.',
    'en':
        'We sent a verification code by SMS to {phone}. Enter the code to confirm your sign-in.',
    'zh': '我们已向 {phone} 发送短信验证码。请输入验证码以确认登录。',
    'ru':
        'Мы отправили код подтверждения по SMS на номер {phone}. Введите код, чтобы подтвердить вход.'
  },
  'reg.otp_not_received': {
    'mn': 'OTP код ирээгүй юу?',
    'en': "Didn't get the code?",
    'zh': '没有收到验证码？',
    'ru': 'Код не пришёл?'
  },
  'reg.resend_code': {
    'mn': 'Код дахин авах',
    'en': 'Resend code',
    'zh': '重新发送验证码',
    'ru': 'Отправить код повторно'
  },
  'reg.sign_in_error': {
    'mn': 'Нэвтрэхэд алдаа гарлаа: {error}',
    'en': 'Sign-in failed: {error}',
    'zh': '登录失败：{error}',
    'ru': 'Не удалось войти: {error}'
  },

  // ---------------------------------------------------------------------
  // Category picker
  // ---------------------------------------------------------------------
  'reg.max_three_categories': {
    'mn': '3 хүртэлх ангилал сонгож болно',
    'en': 'You can choose up to 3 categories',
    'zh': '最多可选择 3 个分类',
    'ru': 'Можно выбрать не более 3 категорий'
  },
  'reg.news_count': {
    'mn': '{count} мэдээ',
    'en': '{count} news',
    'zh': '{count} 条新闻',
    'ru': '{count} новостей'
  },
  'reg.subscriber_count': {
    'mn': '{count} захиалагч',
    'en': '{count} subscribers',
    'zh': '{count} 位订阅者',
    'ru': '{count} подписчиков'
  },
  'reg.selected': {
    'mn': 'Сонгосон',
    'en': 'Selected',
    'zh': '已选择',
    'ru': 'Выбрано'
  },
  'reg.select': {'mn': 'Сонгох', 'en': 'Select', 'zh': '选择', 'ru': 'Выбрать'},

  // ---------------------------------------------------------------------
  // Profile screen
  // ---------------------------------------------------------------------
  'reg.settings': {
    'mn': 'Тохиргоо',
    'en': 'Settings',
    'zh': '设置',
    'ru': 'Настройки'
  },
  'reg.change_pincode': {
    'mn': 'PIN код солих',
    'en': 'Change PIN code',
    'zh': '修改 PIN 码',
    'ru': 'Изменить PIN-код'
  },
  'reg.user_info_not_loaded': {
    'mn': 'Хэрэглэгчийн мэдээлэл ачаалагдаагүй',
    'en': 'User details could not be loaded',
    'zh': '无法加载用户信息',
    'ru': 'Не удалось загрузить данные пользователя'
  },
  'reg.sign_out_title': {
    'mn': 'Системээс гарах',
    'en': 'Sign out',
    'zh': '退出登录',
    'ru': 'Выход из системы'
  },
  'reg.sign_out_confirm': {
    'mn': 'Та системээс гарахдаа итгэлтэй байна уу?',
    'en': 'Are you sure you want to sign out?',
    'zh': '确定要退出登录吗？',
    'ru': 'Вы уверены, что хотите выйти?'
  },
  'reg.sign_out': {'mn': 'Гарах', 'en': 'Sign out', 'zh': '退出', 'ru': 'Выйти'},
  'reg.yes': {'mn': 'Тийм', 'en': 'Yes', 'zh': '是', 'ru': 'Да'},
  'reg.no': {'mn': 'Үгүй', 'en': 'No', 'zh': '否', 'ru': 'Нет'},

  // ---------------------------------------------------------------------------
  // Help screen / onboarding success
  // ---------------------------------------------------------------------------
  'reg.help_title': {'mn': 'Тусламж', 'en': 'Help', 'zh': '帮助', 'ru': 'Помощь'},
  'reg.help_about': {
    'mn': 'Тухай',
    'en': 'About',
    'zh': '关于',
    'ru': 'О приложении'
  },
  'reg.help_project_intro': {
    'mn': 'Төслийн танилцуулга',
    'en': 'Project overview',
    'zh': '项目介绍',
    'ru': 'О проекте'
  },
  'reg.help_privacy_policy': {
    'mn': 'Нууцлалын бодлого',
    'en': 'Privacy policy',
    'zh': '隐私政策',
    'ru': 'Политика конфиденциальности'
  },
  'reg.help_contact': {
    'mn': 'Холбоо барих',
    'en': 'Contact us',
    'zh': '联系我们',
    'ru': 'Связаться с нами'
  },
  'reg.help_call': {
    'mn': 'Залгах',
    'en': 'Call',
    'zh': '拨打电话',
    'ru': 'Позвонить'
  },
  'reg.help_email': {
    'mn': 'И-Мэйл бичих',
    'en': 'Send an email',
    'zh': '发送邮件',
    'ru': 'Написать письмо'
  },
  'reg.help_social': {
    'mn': 'Сошиал хаяг',
    'en': 'Social media',
    'zh': '社交媒体',
    'ru': 'Социальные сети'
  },
  'reg.start': {'mn': 'Эхлэх', 'en': 'Get started', 'zh': '开始', 'ru': 'Начать'},
};
