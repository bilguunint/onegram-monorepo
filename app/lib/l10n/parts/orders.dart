/// Strings for ordering, payment, physical withdrawal, gifting and exchange
/// rate screens. Shared wording lives in `common.dart` — reuse it from there.
const Map<String, Map<String, String>> kOrdersTranslations = {
  // ---------------------------------------------------------------------------
  // General terms of service (order_agreement_screen.dart)
  // ---------------------------------------------------------------------------
  'order.terms_title': {
    'mn': 'АППЛИКЕЙШНИЙ ЕРӨНХИЙ ҮЙЛЧИЛГЭЭНИЙ НӨХЦӨЛ',
    'en': 'GENERAL TERMS OF SERVICE OF THE APPLICATION',
    'zh': '应用程序通用服务条款',
    'ru': 'ОБЩИЕ УСЛОВИЯ ОБСЛУЖИВАНИЯ ПРИЛОЖЕНИЯ'
  },
  'order.terms_s1_title': {
    'mn': '1. Нийтлэг үндэслэл',
    'en': '1. General provisions',
    'zh': '1. 总则',
    'ru': '1. Общие положения'
  },
  'order.terms_1_1': {
    'mn':
        '1.1. Энэхүү нөхцөл нь “ИХ ХААДЫН ЧУЛУУ” ХХК-ийн (“Компани”) гар утасны аппликейшн (“Аппликейшн”)-ы үйлчилгээг авахтай (“Үйлчилгээ”-д үнэт эдлэл захиалах, үнэт эдлэл биетээр авах, үнэт эдлэлээ бусдад бэлэглэх зэрэг хамаарна) холбоотой хэрэглэгч (“Хэрэглэгч”)-ийн эрх, үүрэг, хариуцлагыг зохицуулна.',
    'en':
        '1.1. These terms govern the rights, obligations and liability of the user (the “User”) in connection with using the services of the mobile application (the “Application”) of “IKH KHAADYN CHULUU” LLC (the “Company”). The “Services” include ordering jewellery, taking physical delivery of jewellery and gifting jewellery to others.',
    'zh':
        '1.1. 本条款规范用户（“用户”）在使用“伊赫哈丹楚鲁”有限责任公司（“公司”）手机应用程序（“应用程序”）服务时的权利、义务和责任。“服务”包括订购贵金属首饰、实物提取首饰以及将首饰赠送他人等。',
    'ru':
        '1.1. Настоящие условия регулируют права, обязанности и ответственность пользователя («Пользователь») в связи с получением услуг мобильного приложения («Приложение») ООО «ИХ ХААДЫН ЧУЛУУ» («Компания»). К «Услугам» относятся заказ ювелирных изделий, получение изделий в физическом виде и дарение изделий другим лицам.'
  },
  'order.terms_1_2': {
    'mn':
        '1.2. Хэрэглэгч Аппликейшний үйлчилгээний нөхцөлийг зөвшөөрснөөр Монгол Улсын Иргэний хууль, Хувь хүний нууцын тухай хууль болон бусад холбогдох хууль тогтоомжийг дагаж мөрдөх үүрэгтэй.',
    'en':
        '1.2. By accepting the terms of service of the Application, the User undertakes to comply with the Civil Code of Mongolia, the Law on Personal Privacy and other applicable legislation.',
    'zh': '1.2. 用户接受应用程序服务条款后，有义务遵守《蒙古国民法典》《个人隐私法》及其他相关法律法规。',
    'ru':
        '1.2. Принимая условия обслуживания Приложения, Пользователь обязуется соблюдать Гражданский кодекс Монголии, Закон о тайне личности и иное применимое законодательство.'
  },
  'order.terms_1_3': {
    'mn':
        '1.3. Үнэт эдлэлийн түүхий эд буюу үнэт металлын ханш нь Компанийн хяналтаас гадуур хүчин зүйл тул ханшийн хэлбэлзлийг “Эрсдэл” гэж авч үзэх бөгөөд Компани үүнд хариуцлага хүлээхгүй болно.',
    'en':
        '1.3. The price of the raw material of the jewellery, i.e. the precious metal rate, is a factor beyond the control of the Company. Rate fluctuation is therefore treated as a “Risk” for which the Company bears no liability.',
    'zh': '1.3. 首饰原材料即贵金属的汇价属于公司无法控制的因素，因此汇价波动视为“风险”，公司对此不承担责任。',
    'ru':
        '1.3. Цена сырья для ювелирных изделий, то есть курс драгоценного металла, является фактором вне контроля Компании, поэтому колебание курса рассматривается как «Риск», за который Компания ответственности не несёт.'
  },
  'order.terms_s2_title': {
    'mn': '2. Бүртгэл, мэдээлэл',
    'en': '2. Registration and information',
    'zh': '2. 注册与信息',
    'ru': '2. Регистрация и информация'
  },
  'order.terms_2_1': {
    'mn':
        '2.1. Хэрэглэгч Аппликейшнээр үйлчилгээг ашиглахын тулд өөрийн нэр, регистрийн дугаар, гар утасны дугаар, имэйл зэрэг хувийн мэдээллээ үнэн зөв оруулах үүрэгтэй.',
    'en':
        '2.1. To use the services through the Application, the User is obliged to enter personal data such as name, national registration number, mobile phone number and email address truthfully and accurately.',
    'zh': '2.1. 用户通过应用程序使用服务时，有义务如实准确填写姓名、身份登记号、手机号码、电子邮箱等个人信息。',
    'ru':
        '2.1. Для использования услуг через Приложение Пользователь обязан достоверно указать свои персональные данные: имя, регистрационный номер, номер мобильного телефона, адрес электронной почты и т. п.'
  },
  'order.terms_2_2': {
    'mn':
        '2.2. Хэрэглэгчийн Компанид гаргаж өгсөн мэдээлэл худал, хуурамч байх тохиолдолд Компани үйлчилгээ үзүүлэхээс татгалзах, захиалгыг цуцлах, зохих эрх бүхий байгууллагад мэдээлэх эрхтэй.',
    'en':
        '2.2. If the information provided by the User to the Company is false or falsified, the Company has the right to refuse to provide services, to cancel the order and to report the matter to the competent authorities.',
    'zh': '2.2. 如用户向公司提供的信息虚假或伪造，公司有权拒绝提供服务、取消订单，并向有关主管机关报告。',
    'ru':
        '2.2. Если сведения, предоставленные Пользователем Компании, окажутся ложными или поддельными, Компания вправе отказать в оказании услуг, отменить заказ и сообщить об этом в компетентные органы.'
  },
  'order.terms_2_3': {
    'mn':
        '2.3. Компани Аппликейшний зайлшгүй шаардлагатай шинэчлэл, сайжруулалтын талаар Хэрэглэгчид урьдчилан мэдээлнэ. Энэ хугацаанд Аппликейшнээр дамжуулан үзүүлэх Үйлчилгээ түр саатвал Хэрэглэгч хэрэглээгээ урьдчилан зохицуулна.',
    'en':
        '2.3. The Company will notify Users in advance of necessary updates and improvements to the Application. If the Services provided through the Application are temporarily interrupted during that period, the User shall plan their usage accordingly in advance.',
    'zh': '2.3. 公司在对应用程序进行必要的更新和改进时将提前通知用户；在此期间如通过应用程序提供的服务暂时中断，用户应提前安排好自身使用。',
    'ru':
        '2.3. О необходимых обновлениях и улучшениях Приложения Компания уведомляет Пользователей заранее. Если в этот период предоставление Услуг через Приложение временно приостанавливается, Пользователь заранее планирует своё пользование.'
  },
  'order.terms_s3_title': {
    'mn': '3. Нууцлал ба мэдээллийн хамгаалалт',
    'en': '3. Confidentiality and data protection',
    'zh': '3. 保密与信息保护',
    'ru': '3. Конфиденциальность и защита данных'
  },
  'order.terms_3_1': {
    'mn':
        '3.1. Компани нь Хэрэглэгчийн хувийн болон санхүүгийн мэдээллийг зөвхөн үйлчилгээг хүргэх зорилгоор ашиглана.',
    'en':
        '3.1. The Company uses the personal and financial data of the User solely for the purpose of delivering the services.',
    'zh': '3.1. 公司仅为提供服务之目的使用用户的个人信息和财务信息。',
    'ru':
        '3.1. Компания использует персональные и финансовые данные Пользователя исключительно в целях оказания услуг.'
  },
  'order.terms_3_2': {
    'mn':
        '3.2. Хэрэглэгчийн зөвшөөрөлгүйгээр мэдээллийг гуравдагч этгээдэд дамжуулахгүй, Монгол Улсын “Хувь хүний мэдээлэл хамгаалах тухай хууль”-д нийцүүлнэ.',
    'en':
        '3.2. Data will not be transferred to third parties without the consent of the User, in compliance with the Law of Mongolia on Protection of Personal Data.',
    'zh': '3.2. 未经用户同意不会向第三方传输信息，并遵守《蒙古国个人信息保护法》。',
    'ru':
        '3.2. Данные не передаются третьим лицам без согласия Пользователя, в соответствии с Законом Монголии «О защите персональных данных».'
  },
  'order.terms_3_3': {
    'mn':
        '3.3. Нууц үг, баталгаажуулах кодыг Хэрэглэгч өөрөө хамгаалах үүрэгтэй бөгөөд санаатай болон болгоомжгүйгээр гуравдагч этгээдэд задруулснаас үүдэн гарсан аливаа хохирлыг Хэрэглэгч хариуцна.',
    'en':
        '3.3. The User is responsible for safeguarding their password and verification code, and bears any loss arising from disclosing them to third parties, whether intentionally or negligently.',
    'zh': '3.3. 用户有义务自行保管密码和验证码，因故意或疏忽向第三方泄露而造成的任何损失由用户承担。',
    'ru':
        '3.3. Пользователь обязан сам обеспечивать сохранность пароля и кода подтверждения и несёт ответственность за любой ущерб, вызванный их умышленным или неосторожным раскрытием третьим лицам.'
  },
  'order.terms_s4_title': {
    'mn': '4. Хэрэглэгчийн үүрэг',
    'en': '4. Obligations of the User',
    'zh': '4. 用户的义务',
    'ru': '4. Обязанности Пользователя'
  },
  'order.terms_4_1': {
    'mn':
        '4.1. Аппликейшнийг Мөнгө угаах, терроризмыг санхүүжүүлэхтэй тэмцэх тухай хуульд заасны дагуу хууль бус зорилгоор ашиглахгүй байх.',
    'en':
        '4.1. Not to use the Application for unlawful purposes, as set out in the Law on Combating Money Laundering and Terrorism Financing.',
    'zh': '4.1. 不得按《反洗钱和反恐怖主义融资法》所禁止的非法目的使用应用程序。',
    'ru':
        '4.1. Не использовать Приложение в незаконных целях, как это установлено Законом о противодействии отмыванию денег и финансированию терроризма.'
  },
  'order.terms_4_2': {
    'mn': '4.2. Бусдын мэдээллийг зөвшөөрөлгүй ашиглахгүй байх.',
    'en': '4.2. Not to use other people\'s data without their consent.',
    'zh': '4.2. 不得未经许可使用他人信息。',
    'ru': '4.2. Не использовать данные других лиц без их согласия.'
  },
  'order.terms_4_3': {
    'mn': '4.3. Хуурамч, залилангийн шинжтэй үйлдэл хийхгүй байх.',
    'en': '4.3. Not to engage in falsification or fraudulent conduct.',
    'zh': '4.3. 不得实施伪造或具有欺诈性质的行为。',
    'ru': '4.3. Не совершать подложных или мошеннических действий.'
  },
  'order.terms_s5_company_title': {
    'mn': '5. Компанийн эрх, үүрэг',
    'en': '5. Rights and obligations of the Company',
    'zh': '5. 公司的权利与义务',
    'ru': '5. Права и обязанности Компании'
  },
  'order.terms_5_1': {
    'mn':
        '5.1. Хэрэглэгч нөхцөлийг удаа дараа зөрчсөн тохиолдолд үйлчилгээг түр зогсоох, шаардлагатай бол хууль хяналтын байгууллагад мэдэгдэх эрхтэй.',
    'en':
        '5.1. If the User repeatedly breaches the terms, the Company has the right to suspend the services and, where necessary, to notify law enforcement authorities.',
    'zh': '5.1. 用户屡次违反条款的，公司有权暂停服务，必要时向执法机关报告。',
    'ru':
        '5.1. При неоднократном нарушении Пользователем условий Компания вправе приостановить обслуживание и при необходимости уведомить правоохранительные органы.'
  },
  'order.terms_5_2': {
    'mn':
        '5.2. Үйлчилгээний нөхцөлд өөрчлөлт оруулах ба энэ талаар Хэрэглэгчид аппликейшнээр дамжуулан мэдэгдэнэ.',
    'en':
        '5.2. The Company may amend the terms of service and will notify Users of such amendments through the application.',
    'zh': '5.2. 公司可对服务条款进行修改，并通过应用程序通知用户。',
    'ru':
        '5.2. Компания вправе вносить изменения в условия обслуживания и уведомляет об этом Пользователей через приложение.'
  },
  'order.terms_s6_title': {
    'mn': '6. Бусад нөхцөл',
    'en': '6. Other provisions',
    'zh': '6. 其他条款',
    'ru': '6. Прочие условия'
  },
  'order.terms_6_1': {
    'mn':
        '6.1. Өв залгамжлуулах бол Монгол Улсын Иргэний Хуулийн 56-р бүлэгт заасны дагуу өвлөгч нь нотариатаас “Өв залгамжлах эрхийн гэрчилгээ”-г авч өөрийн биеэр Компанид ирж өвийг шилжүүлэн авна.',
    'en':
        '6.1. In the case of inheritance, pursuant to Chapter 56 of the Civil Code of Mongolia, the heir shall obtain a “Certificate of the Right of Inheritance” from a notary and come to the Company in person to have the inheritance transferred.',
    'zh': '6.1. 涉及继承的，依据《蒙古国民法典》第56章，继承人应向公证机关取得《继承权证书》，并亲自到公司办理遗产转移。',
    'ru':
        '6.1. При наследовании в соответствии с главой 56 Гражданского кодекса Монголии наследник получает у нотариуса «Свидетельство о праве на наследство» и лично является в Компанию для переоформления наследства.'
  },
  'order.terms_6_2': {
    'mn':
        '6.2. Компани хуулиар хүлээсэн үүргийн дагуу Хэрэглэгчийн мэдээллийг тогтмол шинэчлэх шаардлагатай байдаг тул Овог, Нэр, Регистрийн дугаар, Цахим шуудангийн хаяг, Гар утасны дугаар болон холбогдох бусад мэдээлэл тань өөрчлөгдөх эсвэл Компанийн зүгээс шаардсан тухай бүр мэдээллийг шинэчлэх ёстой.',
    'en':
        '6.2. Because the Company is required by law to keep User data up to date, you must update your surname, given name, national registration number, email address, mobile phone number and other relevant data whenever they change or whenever the Company requests it.',
    'zh':
        '6.2. 由于公司依法负有定期更新用户信息的义务，当您的姓氏、名字、身份登记号、电子邮箱、手机号码及其他相关信息发生变更，或公司提出要求时，您均须及时更新信息。',
    'ru':
        '6.2. Поскольку по закону Компания обязана регулярно обновлять данные Пользователя, вы должны обновлять фамилию, имя, регистрационный номер, адрес электронной почты, номер мобильного телефона и иные соответствующие данные каждый раз при их изменении или по запросу Компании.'
  },

  // ---------------------------------------------------------------------------
  // Gift terms of service (send_gift_agreement.dart)
  // ---------------------------------------------------------------------------
  'order.gift_terms_title': {
    'mn': '2. ҮНЭТ ЭДЛЭЛ БЭЛЭГЛЭХ ҮЙЛЧИЛГЭЭНИЙ НӨХЦӨЛ',
    'en': '2. TERMS OF THE JEWELLERY GIFTING SERVICE',
    'zh': '2. 首饰赠送服务条款',
    'ru': '2. УСЛОВИЯ УСЛУГИ ДАРЕНИЯ ЮВЕЛИРНЫХ ИЗДЕЛИЙ'
  },
  'order.gift_terms_s1_title': {
    'mn': '1. Үндсэн ойлголт',
    'en': '1. Basic concepts',
    'zh': '1. 基本概念',
    'ru': '1. Основные понятия'
  },
  'order.gift_terms_1_1': {
    'mn':
        '1.1. “Үнэт эдлэл бэлэглэх үйлчилгээ” нь Хэрэглэгч өөрийн захиалсан үнэт эдлэлийн тодорхой хэмжээг бусад бүртгэлтэй хэрэглэгчид шилжүүлэх боломжийг олгоно.',
    'en':
        '1.1. The “jewellery gifting service” allows a User to transfer a certain amount of the jewellery they have ordered to another registered user.',
    'zh': '1.1. “首饰赠送服务”允许用户将其所订购首饰的一定数量转移给其他已注册用户。',
    'ru':
        '1.1. «Услуга дарения ювелирных изделий» позволяет Пользователю передать определённое количество заказанного им изделия другому зарегистрированному пользователю.'
  },
  'order.gift_terms_1_2': {
    'mn':
        '1.2. Энэ үйлчилгээ нь Монгол Улсын Иргэний хуульд заасан “бэлэглэх гэрээ”-ний зарчмыг дагана.',
    'en':
        '1.2. This service follows the principles of a “deed of gift” as set out in the Civil Code of Mongolia.',
    'zh': '1.2. 本服务遵循《蒙古国民法典》规定的“赠与合同”原则。',
    'ru':
        '1.2. Данная услуга следует принципам «договора дарения», предусмотренного Гражданским кодексом Монголии.'
  },
  'order.gift_terms_s2_title': {
    'mn': '2. Үйлчилгээний журам',
    'en': '2. Service rules',
    'zh': '2. 服务规程',
    'ru': '2. Порядок оказания услуги'
  },
  'order.gift_terms_2_1': {
    'mn':
        '2.1. Үнэт эдлэл бэлэглэх үйлчилгээ нь зөвхөн Аппликейшнд бүртгэлтэй хэрэглэгчийн бүртгэл хооронд хийгдэнэ.',
    'en':
        '2.1. The jewellery gifting service is performed only between accounts of users registered in the Application.',
    'zh': '2.1. 首饰赠送服务仅在应用程序已注册用户的账户之间进行。',
    'ru':
        '2.1. Услуга дарения ювелирных изделий осуществляется только между учётными записями пользователей, зарегистрированных в Приложении.'
  },
  'order.gift_terms_2_2': {
    'mn': '2.2. Хэрэглэгч өдөрт 1 удаа 1 гр үнэт эдлэл бэлэглэх эрхтэй.',
    'en': '2.2. A User may gift jewellery once per day, in the amount of 1 g.',
    'zh': '2.2. 用户赠送首饰的权限为每日1次、每次1克。',
    'ru':
        '2.2. Право Пользователя на дарение изделия составляет 1 раз в день в количестве 1 г.'
  },
  'order.gift_terms_2_3': {
    'mn': '2.3. Үнэт эдлэл бэлэглэх үйлчилгээг баталгаажуулахдаа код ашиглана.',
    'en': '2.3. A code is used to confirm the jewellery gifting service.',
    'zh': '2.3. 确认首饰赠送服务时须使用验证码。',
    'ru': '2.3. Для подтверждения услуги дарения изделия используется код.'
  },
  'order.gift_terms_s3_title': {
    'mn': '3. Хэрэглэгчийн хариуцлага',
    'en': '3. Liability of the User',
    'zh': '3. 用户的责任',
    'ru': '3. Ответственность Пользователя'
  },
  'order.gift_terms_3_1': {
    'mn':
        '3.1. Бэлэг хүлээн авагч бэлэглэсэн үнэт эдлэлийг хүлээн авсан тохиолдолд буцаах боломжгүй.',
    'en':
        '3.1. Once the recipient has accepted the gifted jewellery, the gift cannot be reversed.',
    'zh': '3.1. 受赠人已接收所赠首饰的，不能撤回。',
    'ru':
        '3.1. Если получатель принял подаренное изделие, вернуть подарок невозможно.'
  },
  'order.gift_terms_3_2': {
    'mn':
        '3.2. Бусдад санаатайгаар эсвэл болгоомжгүй байдлаар буруу бэлэглэсэн тохиолдолд Хэрэглэгч бүрэн хариуцна.',
    'en':
        '3.2. The User bears full responsibility for gifting to the wrong person, whether intentionally or by negligence.',
    'zh': '3.2. 因故意或疏忽误赠他人的，由用户承担全部责任。',
    'ru':
        '3.2. За дарение не тому лицу, совершённое умышленно или по неосторожности, Пользователь несёт полную ответственность.'
  },
  'order.gift_terms_3_3': {
    'mn':
        '3.3. Хуурамч, хууль бус зорилгоор үнэт эдлэл бэлэглэсэн нь тогтоогдвол Компани Хэрэглэгчид үйлчилгээ үзүүлэхээ зогсоох эрхтэй.',
    'en':
        '3.3. If it is established that jewellery was gifted for fraudulent or unlawful purposes, the Company has the right to stop providing services to the User.',
    'zh': '3.3. 如经查实以欺诈或非法目的赠送首饰，公司有权停止向该用户提供服务。',
    'ru':
        '3.3. Если установлено, что изделие подарено в подложных или незаконных целях, Компания вправе прекратить оказание услуг Пользователю.'
  },
  'order.terms_s4_company_title': {
    'mn': '4. Компанийн эрх, үүрэг',
    'en': '4. Rights and obligations of the Company',
    'zh': '4. 公司的权利与义务',
    'ru': '4. Права и обязанности Компании'
  },
  'order.gift_terms_4_1': {
    'mn':
        '4.1. Монгол Улсын татварын болон санхүүгийн хууль тогтоомжид нийцүүлэн бүртгэж, тайлагнана.',
    'en':
        '4.1. To record and report in compliance with the tax and financial legislation of Mongolia.',
    'zh': '4.1. 按照蒙古国税务和财务法律法规进行登记和申报。',
    'ru':
        '4.1. Вести учёт и отчётность в соответствии с налоговым и финансовым законодательством Монголии.'
  },
  'order.gift_terms_4_2': {
    'mn': '4.2. Мэдээллийн аюулгүй байдлыг хангах техникийн арга хэмжээ авна.',
    'en': '4.2. To take technical measures to ensure information security.',
    'zh': '4.2. 采取技术措施保障信息安全。',
    'ru':
        '4.2. Принимать технические меры для обеспечения информационной безопасности.'
  },

  // ---------------------------------------------------------------------------
  // Physical withdrawal terms (make_withdraw_agreement.dart)
  // ---------------------------------------------------------------------------
  'order.withdraw_terms_title': {
    'mn': '3. ҮНЭТ ЭДЛЭЛ БИЕТЭЭР АВАХ ҮЙЛЧИЛГЭЭНИЙ НӨХЦӨЛ',
    'en': '3. TERMS OF THE PHYSICAL JEWELLERY COLLECTION SERVICE',
    'zh': '3. 首饰实物提取服务条款',
    'ru': '3. УСЛОВИЯ УСЛУГИ ПОЛУЧЕНИЯ ИЗДЕЛИЙ В ФИЗИЧЕСКОМ ВИДЕ'
  },
  'order.withdraw_terms_1_1': {
    'mn':
        '1.1. Хэрэглэгч захиалсан үнэт эдлэлээ биет хэлбэрээр (“үнэт эдлэл”) авах хүсэлт гаргана.',
    'en':
        '1.1. The User submits a request to receive the jewellery they ordered in physical form (the “jewellery”).',
    'zh': '1.1. 用户提交申请，以实物形式领取其所订购的首饰（“首饰”）。',
    'ru':
        '1.1. Пользователь подаёт заявку на получение заказанного изделия в физическом виде («изделие»).'
  },
  'order.withdraw_terms_1_2': {
    'mn':
        '1.2. Энэ үйлчилгээг Монгол Улсын “Үнэт металл, үнэт чулууны тухай хууль”-д нийцүүлэн хэрэгжүүлнэ.',
    'en':
        '1.2. This service is carried out in compliance with the Law of Mongolia on Precious Metals and Precious Stones.',
    'zh': '1.2. 本服务依照《蒙古国贵金属和宝石法》实施。',
    'ru':
        '1.2. Данная услуга осуществляется в соответствии с Законом Монголии «О драгоценных металлах и драгоценных камнях».'
  },
  'order.withdraw_terms_s2_title': {
    'mn': '2. Захиалга өгөх журам',
    'en': '2. Ordering procedure',
    'zh': '2. 下单规程',
    'ru': '2. Порядок оформления заказа'
  },
  'order.withdraw_terms_2_1': {
    'mn':
        '2.1. Биет хэлбэрээр үнэт эдлэл авах хүсэлтийг Аппликейшнээр дамжуулан гаргана.',
    'en':
        '2.1. A request to receive jewellery in physical form is submitted through the Application.',
    'zh': '2.1. 实物领取首饰的申请通过应用程序提交。',
    'ru':
        '2.1. Заявка на получение изделия в физическом виде подаётся через Приложение.'
  },
  'order.withdraw_terms_2_2': {
    'mn': '2.2. Захиалгын доод хэмжээ 1 грамм байна.',
    'en': '2.2. The minimum order size is 1 gram.',
    'zh': '2.2. 最低订购量为1克。',
    'ru': '2.2. Минимальный размер заказа — 1 грамм.'
  },
  'order.withdraw_terms_2_3': {
    'mn':
        '2.3. Үнэт эдлэлийн хийцлэл, хэлбэр, хэмжээ, сав баглаа боодол нь компанийн санал болгосон стандартын дагуу хийгдэнэ.',
    'en':
        '2.3. The workmanship, shape, size and packaging of the jewellery follow the standard offered by the company.',
    'zh': '2.3. 首饰的工艺、形状、尺寸和包装均按公司提供的标准执行。',
    'ru':
        '2.3. Исполнение, форма, размер и упаковка изделия выполняются согласно стандарту, предложенному компанией.'
  },
  'order.withdraw_terms_s3_title': {
    'mn': '3. Үнэт эдлэл хүлээлгэн өгөх',
    'en': '3. Handover of the jewellery',
    'zh': '3. 首饰的交付',
    'ru': '3. Передача изделия'
  },
  'order.withdraw_terms_3_1': {
    'mn':
        '3.1. Хэрэглэгч үнэт эдлэлээ компанийн албан ёсны төв дэлгүүрээс болон салбараас биечлэн авна.',
    'en':
        '3.1. The User collects the jewellery in person from the official flagship store or a branch of the company.',
    'zh': '3.1. 用户须亲自到公司官方总店或分店领取首饰。',
    'ru':
        '3.1. Пользователь получает изделие лично в официальном центральном магазине или филиале компании.'
  },
  'order.withdraw_branches_label': {
    'mn': '“Их Хаадын Чулуу” ХХК-ийн салбар:',
    'en': 'Branches of “Ikh Khaadyn Chuluu” LLC:',
    'zh': '“伊赫哈丹楚鲁”有限责任公司分店：',
    'ru': 'Филиалы ООО «Их Хаадын Чулуу»:'
  },
  'order.withdraw_branch_main': {
    'mn':
        'a. Төв дэлгүүр – ХУД, 15-р хороо, Махатма Гандийн гудамж, One Center 10 тоот',
    'en':
        'a. Flagship store – Khan-Uul district, 15th khoroo, Mahatma Gandhi street, One Center, suite 10',
    'zh': 'a. 总店 – 汗乌拉区15区、圣雄甘地街、One Center 10号',
    'ru':
        'a. Центральный магазин – район Хан-Уул, 15-й хороо, улица Махатмы Ганди, One Center, помещение 10'
  },
  'order.withdraw_branch_erdenet': {
    'mn': 'b. Эрдэнэт салбар – Орхон аймаг, Эрдэнэт хот, Гок гарден хотхон',
    'en':
        'b. Erdenet branch – Orkhon province, Erdenet city, Gok Garden residential complex',
    'zh': 'b. 额尔登特分店 – 鄂尔浑省额尔登特市 Gok Garden 小区',
    'ru':
        'b. Филиал в Эрдэнэте – аймак Орхон, город Эрдэнэт, жилой комплекс «Гок гарден»'
  },
  'order.withdraw_terms_3_2': {
    'mn':
        '3.2. Үнэт эдлэл хүлээж авахдаа иргэний үнэмлэхээрээ Хэрэглэгч өөрийгөө баталгаажуулна.',
    'en':
        '3.2. When receiving the jewellery, the User identifies themselves with their national ID card.',
    'zh': '3.2. 领取首饰时，用户须凭本人身份证进行身份验证。',
    'ru':
        '3.2. При получении изделия Пользователь удостоверяет свою личность гражданским удостоверением.'
  },
  'order.withdraw_terms_3_3': {
    'mn':
        '3.3. Хэрэглэгч өөрийн биеэр үнэт эдлэлээ биетээр авах боломжгүй тохиолдолд нотариатаар баталгаажуулсан итгэмжлэлийг үндэслэн олгоно.',
    'en':
        '3.3. If the User is unable to collect the jewellery in person, it is released on the basis of a notarised power of attorney.',
    'zh': '3.3. 用户无法亲自领取实物首饰的，凭公证委托书发放。',
    'ru':
        '3.3. Если Пользователь не может получить изделие лично, выдача производится на основании нотариально заверенной доверенности.'
  },
  'order.withdraw_terms_3_4': {
    'mn':
        '3.4. Компани үнэт эдлэлийг Хэрэглэгчид биетээр олгохдоо НӨАТ-ын баримт олгоно.',
    'en':
        '3.4. The Company issues a VAT receipt only when the jewellery is released to the User in physical form.',
    'zh': '3.4. 公司仅在向用户实物交付首饰时开具增值税发票。',
    'ru':
        '3.4. Компания выдаёт чек НДС только при выдаче изделия Пользователю в физическом виде.'
  },
  'order.withdraw_terms_3_5': {
    'mn':
        '3.5. Үнэт эдлэлийг Хэрэглэгчид зөвхөн ажлын өдөр, ажлын цагаар олгоно.',
    'en':
        '3.5. Jewellery is released to Users only on business days during business hours.',
    'zh': '3.5. 首饰仅在工作日的营业时间内向用户发放。',
    'ru':
        '3.5. Изделие выдаётся Пользователю только в рабочие дни в рабочее время.'
  },
  'order.withdraw_terms_4_1': {
    'mn':
        '4.1. Үнэт эдлэлийг сорьцын улсын баталгаажуулалттайгаар олгох үүрэгтэй.',
    'en':
        '4.1. To release jewellery with state hallmark certification of its fineness.',
    'zh': '4.1. 有义务交付带有国家成色认证的首饰。',
    'ru':
        '4.1. Обязуется выдавать изделие с государственным подтверждением пробы.'
  },
  'order.withdraw_terms_4_2': {
    'mn': '4.2. Хэрэглэгчийн захиалгыг 24-48 цагийн дотор биелүүлэх үүрэгтэй.',
    'en': '4.2. To fulfil the order of the User within 24-48 hours.',
    'zh': '4.2. 有义务在24-48小时内完成用户的订单。',
    'ru': '4.2. Обязуется выполнить заказ Пользователя в течение 24-48 часов.'
  },
  'order.withdraw_terms_4_3': {
    'mn':
        '4.3. Байгалийн гамшиг, давагдашгүй хүчин зүйлээс үүдэн хойшилсон тохиолдолд Хэрэглэгчид урьдчилан мэдэгдэнэ.',
    'en':
        '4.3. To notify the user in advance if there is a delay caused by a natural disaster or force majeure.',
    'zh': '4.3. 因自然灾害或突发情况延期的，应提前通知用户。',
    'ru':
        '4.3. В случае отсрочки из-за стихийного бедствия или непредвиденных обстоятельств заранее уведомлять пользователя.'
  },

  // ---------------------------------------------------------------------------
  // Payment screen
  // ---------------------------------------------------------------------------
  'order.payment_title': {
    'mn': 'Төлбөр төлөх',
    'en': 'Make a payment',
    'zh': '支付',
    'ru': 'Оплата'
  },
  'order.transfer_tab': {
    'mn': 'Шилжүүлэг',
    'en': 'Bank transfer',
    'zh': '银行转账',
    'ru': 'Перевод'
  },
  'order.amount_due_label': {
    'mn': 'Төлөх дүн:',
    'en': 'Amount due:',
    'zh': '应付金额：',
    'ru': 'К оплате:'
  },
  'order.bank_label': {
    'mn': 'Банк:',
    'en': 'Bank:',
    'zh': '银行：',
    'ru': 'Банк:'
  },
  'order.khan_bank': {
    'mn': 'Хаан банк',
    'en': 'Khan Bank',
    'zh': '汗银行 (Khan Bank)',
    'ru': 'Хаан Банк'
  },
  'order.account_holder_label': {
    'mn': 'Данс эзэмшигч:',
    'en': 'Account holder:',
    'zh': '账户持有人：',
    'ru': 'Владелец счёта:'
  },
  'order.account_number_label': {
    'mn': 'Дансны дугаар:',
    'en': 'Account number:',
    'zh': '账号：',
    'ru': 'Номер счёта:'
  },
  'order.transaction_note_label': {
    'mn': 'Гүйлгээний утга:',
    'en': 'Payment reference:',
    'zh': '转账备注：',
    'ru': 'Назначение платежа:'
  },
  'order.total_amount_label': {
    'mn': 'Нийт дүн:',
    'en': 'Total:',
    'zh': '总金额：',
    'ru': 'Итого:'
  },
  'order.copy': {'mn': 'Хуулах', 'en': 'Copy', 'zh': '复制', 'ru': 'Копировать'},
  'order.copied': {
    'mn': '"{value}" хуулагдлаа',
    'en': '"{value}" copied',
    'zh': '已复制“{value}”',
    'ru': '«{value}» скопировано'
  },

  // ---------------------------------------------------------------------------
  // Metal price breakdown (metal_price_view.dart)
  // ---------------------------------------------------------------------------
  'order.detail_load_error': {
    'mn': 'Захиалгын дэлгэрэнгүйг харахад алдаа гарлаа!',
    'en': 'Could not load the order details.',
    'zh': '加载订单详情时出错！',
    'ru': 'Не удалось загрузить детали заказа!'
  },
  'order.todays_rate_label': {
    'mn': 'Өнөөдрийн ханш:',
    'en': 'Today\'s rate:',
    'zh': '今日汇价：',
    'ru': 'Курс на сегодня:'
  },
  'order.tax_and_fee_label': {
    'mn': 'Татвар + Шимтгэл:',
    'en': 'Tax + fee:',
    'zh': '税费 + 手续费：',
    'ru': 'Налог + комиссия:'
  },
  'order.rate_per_lan': {
    'mn': '{amount}₮ / 1 лан',
    'en': '{amount}₮ / 1 lan',
    'zh': '{amount}₮ / 1两',
    'ru': '{amount}₮ / 1 лан'
  },
  'order.rate_per_gram': {
    'mn': '{amount}₮ / 1 гр',
    'en': '{amount}₮ / 1 g',
    'zh': '{amount}₮ / 1克',
    'ru': '{amount}₮ / 1 г'
  },

  // ---------------------------------------------------------------------------
  // Units and metal names
  // ---------------------------------------------------------------------------
  'order.metal_gold': {'mn': 'алт', 'en': 'gold', 'zh': '黄金', 'ru': 'золото'},
  'order.metal_silver': {
    'mn': 'мөнгө',
    'en': 'silver',
    'zh': '白银',
    'ru': 'серебро'
  },
  'order.metal_gold_genitive': {
    'mn': 'алтны',
    'en': 'gold',
    'zh': '黄金',
    'ru': 'золота'
  },
  'order.metal_silver_genitive': {
    'mn': 'мөнгөний',
    'en': 'silver',
    'zh': '白银',
    'ru': 'серебра'
  },
  'order.gold': {'mn': 'Алт', 'en': 'Gold', 'zh': '黄金', 'ru': 'Золото'},
  'order.silver': {'mn': 'Мөнгө', 'en': 'Silver', 'zh': '白银', 'ru': 'Серебро'},

  // ---------------------------------------------------------------------------
  // Shared order / gift / withdrawal flow
  // ---------------------------------------------------------------------------
  'order.accept_terms_checkbox': {
    'mn': 'Үйлчилгээний нөхцөлийг хүлээн зөвшөөрч байна.',
    'en': 'I accept the terms of service.',
    'zh': '我接受服务条款。',
    'ru': 'Я принимаю условия обслуживания.'
  },
  'order.accept_gift_terms_checkbox': {
    'mn': 'Бэлэг илгээх нөхцөлтэй танилцаж, зөвшөөрч байна.',
    'en': 'I have read and accept the gifting terms.',
    'zh': '我已阅读并接受赠送条款。',
    'ru': 'Я ознакомился и согласен с условиями дарения.'
  },
  'order.must_accept_terms': {
    'mn': 'Үйлчилгээний нөхцөлтэй танилцаж зөвшөөрнө үү.',
    'en': 'Please read and accept the terms of service.',
    'zh': '请阅读并接受服务条款。',
    'ru': 'Пожалуйста, ознакомьтесь и примите условия обслуживания.'
  },
  'order.quantity_gram': {
    'mn': '{qty} гр',
    'en': '{qty} g',
    'zh': '{qty}克',
    'ru': '{qty} г'
  },
  'order.quantity_lan': {
    'mn': '{qty} лан',
    'en': '{qty} lan',
    'zh': '{qty}两',
    'ru': '{qty} лан'
  },
  'order.quantity_must_be_positive': {
    'mn': 'Тоо хэмжээ 0-ээс их байх ёстой.',
    'en': 'The amount must be greater than 0.',
    'zh': '数量必须大于0。',
    'ru': 'Количество должно быть больше 0.'
  },
  'order.pin_confirm_prompt': {
    'mn': 'Та PIN кодоо оруулж баталгаажуулна уу.',
    'en': 'Enter your PIN code to confirm.',
    'zh': '请输入PIN码以确认。',
    'ru': 'Введите PIN-код для подтверждения.'
  },
  'order.pin_enter_hint': {
    'mn': 'Та PIN кодоо оруулна уу',
    'en': 'Enter your PIN code',
    'zh': '请输入PIN码',
    'ru': 'Введите PIN-код'
  },
  'order.pin_incomplete': {
    'mn': 'PIN кодоо бүрэн оруулна уу (6 орон).',
    'en': 'Enter the full PIN code (6 digits).',
    'zh': '请输入完整的PIN码（6位）。',
    'ru': 'Введите PIN-код полностью (6 цифр).'
  },
  'order.status_label': {
    'mn': 'Төлөв:',
    'en': 'Status:',
    'zh': '状态：',
    'ru': 'Статус:'
  },
  'order.date_label': {
    'mn': 'Огноо:',
    'en': 'Date:',
    'zh': '日期：',
    'ru': 'Дата:'
  },
  'order.please_sign_in': {
    'mn': 'Нэвтэрч орно уу',
    'en': 'Please sign in',
    'zh': '请登录',
    'ru': 'Пожалуйста, войдите'
  },
  'order.not_signed_in': {
    'mn': 'Нэвтрээгүй байна',
    'en': 'You are not signed in',
    'zh': '您尚未登录',
    'ru': 'Вы не вошли в систему'
  },
  'order.token_not_found': {
    'mn': 'Нэвтрэх токен олдсонгүй',
    'en': 'Authentication token not found',
    'zh': '未找到登录令牌',
    'ru': 'Токен входа не найден'
  },
  'order.token_error': {
    'mn': 'Токен авахад алдаа гарлаа: {error}',
    'en': 'Failed to get the authentication token: {error}',
    'zh': '获取令牌时出错：{error}',
    'ru': 'Ошибка при получении токена: {error}'
  },
  'order.yes': {'mn': 'Тийм', 'en': 'Yes', 'zh': '是', 'ru': 'Да'},
  'order.no': {'mn': 'Үгүй', 'en': 'No', 'zh': '否', 'ru': 'Нет'},
  'order.cancel_action': {
    'mn': 'Цуцлах',
    'en': 'Cancel',
    'zh': '取消',
    'ru': 'Отменить'
  },
  'order.finish': {
    'mn': 'Дуусгах',
    'en': 'Done',
    'zh': '完成',
    'ru': 'Завершить'
  },
  'order.understood': {
    'mn': 'Ойлголоо',
    'en': 'Got it',
    'zh': '知道了',
    'ru': 'Понятно'
  },
  'order.status_pending_short': {
    'mn': 'Хүлээгдэж буй',
    'en': 'Pending',
    'zh': '待处理',
    'ru': 'В ожидании'
  },

  // ---------------------------------------------------------------------------
  // Physical withdrawal flow
  // ---------------------------------------------------------------------------
  'order.withdraw_request_title': {
    'mn': 'Биетээр авах хүсэлт',
    'en': 'Physical collection request',
    'zh': '实物提取申请',
    'ru': 'Заявка на получение в физическом виде'
  },
  'order.withdraw_enter_amount': {
    'mn': 'Та биетээр авах алтны хэмжээгээ оруулна уу.',
    'en': 'Enter the amount of gold you want to collect physically.',
    'zh': '请输入您要实物提取的黄金数量。',
    'ru':
        'Введите количество золота, которое хотите получить в физическом виде.'
  },
  'order.withdraw_large_amount_note': {
    'mn':
        '100 гр-аас дээш хэмжээг биетээр авах хүсэлтийг ажлын 5 хоногт багтаан шийдвэрлэнэ гэдгийг анхаарна уу.',
    'en':
        'Please note that requests for more than 100 g of physical collection are processed within 5 business days.',
    'zh': '请注意，超过100克的实物提取申请将在5个工作日内处理。',
    'ru':
        'Обратите внимание: заявки на получение свыше 100 г в физическом виде обрабатываются в течение 5 рабочих дней.'
  },
  'order.insufficient_balance': {
    'mn': 'Таны {metal} үлдэгдэл хүрэлцэхгүй байна.',
    'en': 'Your {metal} balance is not sufficient.',
    'zh': '您的{metal}余额不足。',
    'ru': 'Недостаточно {metal} на вашем балансе.'
  },
  'order.withdraw_success_title': {
    'mn': 'Хүсэлт илгээгдлээ',
    'en': 'Request submitted',
    'zh': '申请成功',
    'ru': 'Заявка отправлена'
  },
  'order.withdraw_success_message': {
    'mn':
        'Таны хүсэлт хянагдаж байна. Баталгаажуулсны дараа таны дансанд орж ирнэ.',
    'en':
        'Your request is under review. It will be credited to your account once it is approved.',
    'zh': '您的申请正在审核中。确认后将入账到您的账户。',
    'ru':
        'Ваша заявка на рассмотрении. После подтверждения средства поступят на ваш счёт.'
  },
  'order.quantity_label': {
    'mn': 'Хэмжээ:',
    'en': 'Amount:',
    'zh': '数量：',
    'ru': 'Количество:'
  },
  'order.quantity_gram_metal': {
    'mn': '{qty} гр {metal}',
    'en': '{qty} g {metal}',
    'zh': '{qty} 克 {metal}',
    'ru': '{qty} г {metal}'
  },
  'order.withdraw_confirm_code_note': {
    'mn':
        'Та баталгаажуулах кодыг бидэнд мэдэгдэн биетээр авах хүсэлтээ баталгаажуулна уу.',
    'en':
        'Please give us the confirmation code to confirm your physical collection request.',
    'zh': '请向我们提供确认码，以确认您的实物提取申请。',
    'ru':
        'Сообщите нам код подтверждения, чтобы подтвердить заявку на получение в физическом виде.'
  },

  // ---------------------------------------------------------------------------
  // Sending a gift
  // ---------------------------------------------------------------------------
  'order.send_gift_title': {
    'mn': 'Бэлэг илгээх',
    'en': 'Send a gift',
    'zh': '赠送礼物',
    'ru': 'Отправить подарок'
  },
  'order.send_gift_request_title': {
    'mn': 'Бэлэг илгээх хүсэлт',
    'en': 'Gift request',
    'zh': '赠送礼物申请',
    'ru': 'Заявка на отправку подарка'
  },
  'order.gift_enter_amount': {
    'mn': 'Та бэлэглэх алтны граммын хэмжээгээ оруулна уу.',
    'en': 'Enter how many grams of gold you want to gift.',
    'zh': '请输入您要赠送的黄金克数。',
    'ru': 'Введите количество золота в граммах, которое хотите подарить.'
  },
  'order.insufficient_gold_for_gift': {
    'mn':
        'Таны алтны үлдэгдэл хүрэлцэхгүй байна. Та эхлээд Захиалах цэснээс {qty} гр захиалга үүсгэнэ үү.',
    'en':
        'Your gold balance is not sufficient. Please first create an order for {qty} g from the Order menu.',
    'zh': '您的黄金余额不足。请先在“订购”菜单中创建{qty}克的订单。',
    'ru':
        'Недостаточно золота на вашем балансе. Сначала создайте заказ на {qty} г в меню «Заказать».'
  },
  'order.recipient_info_title': {
    'mn': 'Бэлэг хүлээн авагчийн мэдээлэл',
    'en': 'Gift recipient details',
    'zh': '礼物接收人信息',
    'ru': 'Данные получателя подарка'
  },
  'order.recipient_phone_field': {
    'mn': 'Хүлээн авагчийн утасны дугаар',
    'en': 'Recipient phone number',
    'zh': '接收人手机号码',
    'ru': 'Номер телефона получателя'
  },
  'order.recipient_phone_hint': {
    'mn': 'Хүлээн авагчийн утасны дугаар оруулна уу.',
    'en': 'Enter the recipient phone number.',
    'zh': '请输入接收人的手机号码。',
    'ru': 'Введите номер телефона получателя.'
  },
  'order.recipient_phone_invalid': {
    'mn': 'Хүлээн авагчийн утасны дугаарыг зөв оруулна уу (8 орон)',
    'en': 'Enter a valid recipient phone number (8 digits)',
    'zh': '请正确输入接收人手机号码（8位）',
    'ru': 'Введите корректный номер телефона получателя (8 цифр)'
  },
  'order.greeting_field': {
    'mn': 'Мэндчилгээний үг (заавал биш)',
    'en': 'Greeting message (optional)',
    'zh': '祝福语（选填）',
    'ru': 'Поздравление (необязательно)'
  },
  'order.greeting_hint': {
    'mn': 'Мэндчилгээний үгээ бичнэ үү...',
    'en': 'Write your greeting…',
    'zh': '请写下您的祝福语…',
    'ru': 'Напишите поздравление…'
  },
  'order.gift_loading': {
    'mn': 'Бэлгийн мэдээлэл уншиж байна...',
    'en': 'Loading gift details…',
    'zh': '正在加载礼物信息…',
    'ru': 'Загрузка данных подарка…'
  },
  'order.gift_load_error': {
    'mn': 'Бэлгийн мэдээлэл уншихад алдаа гарлаа',
    'en': 'Could not load the gift details',
    'zh': '加载礼物信息时出错',
    'ru': 'Не удалось загрузить данные подарка'
  },
  'order.gift_waiting_create': {
    'mn': 'Бэлгийн мэдээлэл үүсэхийг хүлээж байна...',
    'en': 'Waiting for the gift to be created…',
    'zh': '正在等待礼物信息生成…',
    'ru': 'Ожидание создания подарка…'
  },
  'order.gift_may_take_seconds': {
    'mn': 'Энэ нь хэдэн секунд үргэлжилж болно',
    'en': 'This may take a few seconds',
    'zh': '这可能需要几秒钟',
    'ru': 'Это может занять несколько секунд'
  },
  'order.gift_sent_success': {
    'mn': 'Бэлэг амжилттай илгээлээ',
    'en': 'Gift sent successfully',
    'zh': '礼物赠送成功',
    'ru': 'Подарок успешно отправлен'
  },
  'order.gift_sent_success_desc': {
    'mn':
        '{phone} дугаартай хэрэглэгч рүү {qty} гр {metal}-ыг амжилттай бэлэг болгон илгээлээ. Хүлээн авагч таны бэлгийг хүлээн авснаар бэлгийн захиалга амжилттай дуусна.',
    'en':
        '{qty} g of {metal} was successfully sent as a gift to the user with phone number {phone}. The gift order completes once the recipient accepts your gift.',
    'zh': '已成功将{qty}克{metal}作为礼物赠送给手机号为{phone}的用户。接收人接受您的礼物后，该赠送订单即完成。',
    'ru':
        '{qty} г {metal} успешно отправлено в подарок пользователю с номером {phone}. Заказ подарка завершится, когда получатель примет ваш подарок.'
  },
  'order.gift_id_label': {
    'mn': 'Бэлгийн ID:',
    'en': 'Gift ID:',
    'zh': '礼物ID：',
    'ru': 'ID подарка:'
  },
  'order.recipient_label': {
    'mn': 'Хүлээн авагч:',
    'en': 'Recipient:',
    'zh': '接收人：',
    'ru': 'Получатель:'
  },
  'order.greeting_label': {
    'mn': 'Мэндчилгээний үг:',
    'en': 'Greeting:',
    'zh': '祝福语：',
    'ru': 'Поздравление:'
  },
  'order.gift_quantity_label': {
    'mn': 'Бэлэглэсэн хэмжээ:',
    'en': 'Gifted amount:',
    'zh': '赠送数量：',
    'ru': 'Подаренное количество:'
  },
  'order.amount_label': {
    'mn': 'Мөнгөн дүн:',
    'en': 'Value:',
    'zh': '金额：',
    'ru': 'Сумма:'
  },
  'order.sent_date_label': {
    'mn': 'Илгээсэн огноо:',
    'en': 'Sent on:',
    'zh': '发送日期：',
    'ru': 'Дата отправки:'
  },

  // ---------------------------------------------------------------------------
  // Gift lists and details
  // ---------------------------------------------------------------------------
  'order.no_sent_gifts': {
    'mn': 'Та бэлэг илгээгээгүй байна.',
    'en': 'You have not sent any gifts.',
    'zh': '您还没有赠送过礼物。',
    'ru': 'Вы ещё не отправляли подарков.'
  },
  'order.no_received_gifts': {
    'mn': 'Танд бэлэг ирээгүй байна.',
    'en': 'You have not received any gifts.',
    'zh': '您还没有收到礼物。',
    'ru': 'Вы ещё не получали подарков.'
  },
  'order.sent_gift_list_desc': {
    'mn':
        'Та {phone} утасны дугаартай {name} хэрэглэгч рүү {qty}{unit} бэлэг болгон илгээсэн байна.',
    'en': 'You sent {qty}{unit} as a gift to {name}, phone number {phone}.',
    'zh': '您已向手机号为{phone}的{name}赠送{qty}{unit}作为礼物。',
    'ru':
        'Вы отправили {qty}{unit} в подарок пользователю {name} с номером {phone}.'
  },
  'order.received_gift_list_desc': {
    'mn':
        'Танд {phone} утасны дугаартай {name} хэрэглэгчээс {qty}{unit} бэлэг ирсэн байна.',
    'en': '{name}, phone number {phone}, sent you {qty}{unit} as a gift.',
    'zh': '手机号为{phone}的{name}向您赠送了{qty}{unit}作为礼物。',
    'ru':
        'Пользователь {name} с номером {phone} отправил вам {qty}{unit} в подарок.'
  },
  'order.sent_gift_detail_title': {
    'mn': 'Илгээсэн бэлгийн дэлгэрэнгүй',
    'en': 'Sent gift details',
    'zh': '已发送礼物详情',
    'ru': 'Детали отправленного подарка'
  },
  'order.gift_gram_gold_title': {
    'mn': 'Бэлэг - {qty} гр алт',
    'en': 'Gift - {qty} g gold',
    'zh': '礼物 - {qty}克黄金',
    'ru': 'Подарок - {qty} г золота'
  },
  'order.gift_sent_to_phone_desc': {
    'mn':
        'Та {phone} утасны дугаартай хэрэглэгч рүү {qty}{unit} бэлэг болгон илгээсэн байна.',
    'en':
        'You sent {qty}{unit} as a gift to the user with phone number {phone}.',
    'zh': '您已向手机号为{phone}的用户赠送{qty}{unit}作为礼物。',
    'ru': 'Вы отправили {qty}{unit} в подарок пользователю с номером {phone}.'
  },
  'order.recipient_phone_label': {
    'mn': 'Хүлээн авагчийн дугаар:',
    'en': 'Recipient phone:',
    'zh': '接收人号码：',
    'ru': 'Номер получателя:'
  },
  'order.message_label': {
    'mn': 'Зурвас:',
    'en': 'Message:',
    'zh': '留言：',
    'ru': 'Сообщение:'
  },
  'order.cancel_gift_title': {
    'mn': 'Бэлэг цуцлах',
    'en': 'Cancel gift',
    'zh': '取消礼物',
    'ru': 'Отменить подарок'
  },
  'order.cancel_gift_confirm': {
    'mn': 'Та энэ бэлгийг цуцлахдаа итгэлтэй байна уу?',
    'en': 'Are you sure you want to cancel this gift?',
    'zh': '您确定要取消这份礼物吗？',
    'ru': 'Вы уверены, что хотите отменить этот подарок?'
  },
  'order.gift_cancelled_success': {
    'mn': 'Бэлэг амжилттай цуцлагдлаа.',
    'en': 'The gift was cancelled.',
    'zh': '礼物已成功取消。',
    'ru': 'Подарок успешно отменён.'
  },
  'order.gift_cancel_error': {
    'mn': 'Бэлэг цуцлахад алдаа гарлаа: {error}',
    'en': 'Failed to cancel the gift: {error}',
    'zh': '取消礼物时出错：{error}',
    'ru': 'Ошибка при отмене подарка: {error}'
  },
  'order.gift': {'mn': 'Бэлэг', 'en': 'Gift', 'zh': '礼物', 'ru': 'Подарок'},
  'order.gift_from_sender_title': {
    'mn': 'Бэлэг - {sender}/{qty} гр алт/',
    'en': 'Gift - {sender}/{qty} g gold/',
    'zh': '礼物 - {sender}/{qty}克黄金/',
    'ru': 'Подарок - {sender}/{qty} г золота/'
  },
  'order.gift_received_desc': {
    'mn':
        '{phone} дугаартай {name} хэрэглэгч танд {qty} гр алт бэлэглэж байна.',
    'en': '{name}, phone number {phone}, is gifting you {qty} g of gold.',
    'zh': '手机号为{phone}的用户{name}正在向您赠送{qty}克黄金。',
    'ru': 'Пользователь {name} с номером {phone} дарит вам {qty} г золота.'
  },
  'order.sender_name_label': {
    'mn': 'Илгээгчийн нэр:',
    'en': 'Sender name:',
    'zh': '发送人姓名：',
    'ru': 'Имя отправителя:'
  },
  'order.sender_phone_label': {
    'mn': 'Илгээгчийн дугаар:',
    'en': 'Sender phone:',
    'zh': '发送人号码：',
    'ru': 'Номер отправителя:'
  },
  'order.accept_gift': {
    'mn': 'Бэлэг хүлээн авах',
    'en': 'Accept gift',
    'zh': '接收礼物',
    'ru': 'Принять подарок'
  },
  'order.gift_accepted_success': {
    'mn': 'Баяр хүргэе! Таны алтан хуримтлал {qty} гр-аар нэмэгдлээ.',
    'en': 'Congratulations! Your gold savings increased by {qty} g.',
    'zh': '恭喜！您的黄金储蓄增加了{qty}克。',
    'ru': 'Поздравляем! Ваши золотые накопления выросли на {qty} г.'
  },
  'order.gift_accept_error': {
    'mn': 'Бэлэг хүлээн авахад алдаа гарлаа: {error}',
    'en': 'Failed to accept the gift: {error}',
    'zh': '接收礼物时出错：{error}',
    'ru': 'Ошибка при получении подарка: {error}'
  },

  // ---------------------------------------------------------------------------
  // Exchange rate screens
  // ---------------------------------------------------------------------------
  'order.rate_info_title': {
    'mn': 'Ханшийн мэдээлэл',
    'en': 'Rate information',
    'zh': '汇价信息',
    'ru': 'Информация о курсе'
  },
  'order.rate_load_error': {
    'mn': 'Ханшийн мэдээллийг харахад алдаа гарлаа!',
    'en': 'Could not load the rate information.',
    'zh': '加载汇价信息时出错！',
    'ru': 'Не удалось загрузить информацию о курсе!'
  },
  'order.no_data': {
    'mn': 'Мэдээлэл олдсонгүй',
    'en': 'No data found',
    'zh': '未找到数据',
    'ru': 'Данные не найдены'
  },
  'order.chart': {'mn': 'График', 'en': 'Chart', 'zh': '图表', 'ru': 'График'},
  'order.daily': {
    'mn': 'Өдрөөр',
    'en': 'Day by day',
    'zh': '按日',
    'ru': 'По дням'
  },
  'order.gold_rate_error': {
    'mn': 'Алтны ханшийг харахад алдаа гарлаа!',
    'en': 'Could not load the gold rate.',
    'zh': '加载黄金汇价时出错！',
    'ru': 'Не удалось загрузить курс золота!'
  },
  'order.silver_rate_error': {
    'mn': 'Мөнгөний ханшийг харахад алдаа гарлаа!',
    'en': 'Could not load the silver rate.',
    'zh': '加载白银汇价时出错！',
    'ru': 'Не удалось загрузить курс серебра!'
  },

  // ---------------------------------------------------------------------------
  // Buy gold / silver flow (make-order wizard)
  // ---------------------------------------------------------------------------
  'order.make_order_title': {
    'mn': 'Захиалга өгөх',
    'en': 'Place an order',
    'zh': '下单',
    'ru': 'Оформить заказ'
  },
  'order.type_gold_sycee': {
    'mn': 'Алтан ембүү',
    'en': 'Gold sycee',
    'zh': '金元宝',
    'ru': 'Золотой юаньбао'
  },
  'order.type_gold_coin': {
    'mn': 'Алтан зоос',
    'en': 'Gold coin',
    'zh': '金币',
    'ru': 'Золотая монета'
  },
  'order.type_gold_bar': {
    'mn': 'Алтан гулдмай',
    'en': 'Gold bar',
    'zh': '金条',
    'ru': 'Золотой слиток'
  },
  'order.type_gold_desc': {
    'mn': 'Алтан бүтээгдэхүүн захиалах',
    'en': 'Order a gold product',
    'zh': '订购黄金产品',
    'ru': 'Заказать золотое изделие'
  },
  'order.type_gold_bar_desc': {
    'mn': '100 гр алтан гулдмай',
    'en': '100 g gold bar',
    'zh': '100克金条',
    'ru': 'Золотой слиток 100 г'
  },
  'order.select_type_prompt': {
    'mn': 'Захиалах төрлөө сонгоно уу.',
    'en': 'Please choose the type you want to order.',
    'zh': '请选择您要订购的类型。',
    'ru': 'Выберите тип заказа.'
  },
  'order.enter_gold_grams_prompt': {
    'mn': 'Та авах гэж буй алтны хэмжээг граммаар оруулна уу.',
    'en': 'Please enter the amount of gold you want to buy, in grams.',
    'zh': '请输入您要购买的黄金克数。',
    'ru': 'Введите количество золота в граммах, которое хотите приобрести.'
  },
  'order.enter_silver_lan_prompt': {
    'mn': 'Та авах гэж буй мөнгөний лангийн хэмжээгээ оруулна уу.',
    'en': 'Please enter the amount of silver you want to buy, in lan.',
    'zh': '请输入您要购买的白银两数。',
    'ru': 'Введите количество серебра в ланах, которое хотите приобрести.'
  },
  'order.max_per_order_exceeded': {
    'mn': 'Нэг удаагийн захиалгын дээд хэмжээнээс хэтэрсэн байна.',
    'en': 'You have exceeded the maximum amount for a single order.',
    'zh': '已超出单次购买上限。',
    'ru': 'Превышен лимит на одну покупку.'
  },
  'order.rate_not_found_retry': {
    'mn': 'Ханшийн мэдээлэл олдсонгүй. Дахин оролдоно уу.',
    'en': 'Rate information not found. Please try again.',
    'zh': '未找到价格信息，请重试。',
    'ru': 'Информация о курсе не найдена. Попробуйте ещё раз.'
  },
  'order.enter_quantity_prompt': {
    'mn': 'Та авах хэмжээгээ оруулна уу',
    'en': 'Please enter the amount you want to buy',
    'zh': '请输入购买数量',
    'ru': 'Введите количество для покупки'
  },

  // Gift list tabs
  'order.gift_received_tab': {
    'mn': 'Ирсэн',
    'en': 'Received',
    'zh': '收到的',
    'ru': 'Полученные'
  },
  'order.gift_sent_tab': {
    'mn': 'Илгээсэн',
    'en': 'Sent',
    'zh': '已发送',
    'ru': 'Отправленные'
  },
};
