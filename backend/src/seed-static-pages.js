const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const pages = [
        {
            title: 'About Us',
            slug: 'about-us',
            contentEn: `<h1>About Kids & Co</h1>
<p>Welcome to Kids & Co, your premier destination for high-quality children's clothing and accessories. Since our founding, we've been dedicated to providing stylish, comfortable, and affordable clothing for kids of all ages.</p>

<h2>Our Mission</h2>
<p>At Kids & Co, we believe that every child deserves to look and feel their best. Our mission is to offer a carefully curated selection of clothing that combines style, comfort, and durability - all at prices that won't break the bank.</p>

<h2>What We Offer</h2>
<ul>
<li>Wide range of sizes from newborn to teens</li>
<li>Two distinct collections: Kids & Next</li>
<li>Quality fabrics that are gentle on sensitive skin</li>
<li>Trendy designs that kids love</li>
<li>Fast and reliable shipping</li>
<li>Hassle-free returns and exchanges</li>
</ul>

<h2>Our Collections</h2>
<p><strong>Kids Collection:</strong> Featuring fun, colorful designs for everyday wear and special occasions.</p>
<p><strong>Next Collection:</strong> Our premium line with sophisticated styles for fashion-forward kids.</p>

<h2>Quality Promise</h2>
<p>Every item in our store is carefully selected for quality and durability. We work with trusted suppliers and brands to ensure that our products meet the highest standards.</p>

<p>Thank you for choosing Kids & Co. We're honored to be part of your child's growing years!</p>`,
            contentAr: `<h1>عن Kids & Co</h1>
<p>مرحباً بكم في Kids & Co، وجهتكم الرئيسية للملابس والإكسسوارات عالية الجودة للأطفال. منذ تأسيسنا، ونحن ملتزمون بتقديم ملابس أنيقة ومريحة وبأسعار معقولة للأطفال من جميع الأعمار.</p>

<h2>مهمتنا</h2>
<p>في Kids & Co، نؤمن بأن كل طفل يستحق أن يبدو ويشعر بأفضل حال. مهمتنا هي تقديم مجموعة منتقاة بعناية من الملابس التي تجمع بين الأناقة والراحة والمتانة - بأسعار مناسبة للجميع.</p>

<h2>ماذا نقدم</h2>
<ul>
<li>مجموعة واسعة من المقاسات من حديثي الولادة إلى المراهقين</li>
<li>مجموعتان مميزتان: Kids و Next</li>
<li>أقمشة عالية الجودة ولطيفة على البشرة الحساسة</li>
<li>تصاميم عصرية يحبها الأطفال</li>
<li>شحن سريع وموثوق</li>
<li>استرجاع وتبديل بدون متاعب</li>
</ul>

<h2>مجموعاتنا</h2>
<p><strong>مجموعة Kids:</strong> تصاميم مبهجة وملونة للاستخدام اليومي والمناسبات الخاصة.</p>
<p><strong>مجموعة Next:</strong> خطنا المتميز بأساليب متطورة للأطفال المهتمين بالموضة.</p>

<h2>وعدنا بالجودة</h2>
<p>كل عنصر في متجرنا يتم اختياره بعناية للجودة والمتانة. نعمل مع موردين وعلامات تجارية موثوقة لضمان أن منتجاتنا تلبي أعلى المعايير.</p>

<p>شكراً لاختياركم Kids & Co. نحن فخورون بأن نكون جزءاً من سنوات نمو طفلكم!</p>`,
            isActive: true
        },
        {
            title: 'FAQs',
            slug: 'faq',
            contentEn: `<h1>Frequently Asked Questions</h1>

<h2>Orders & Shipping</h2>
<h3>How long does shipping take?</h3>
<p>Standard shipping typically takes 3-5 business days. Express shipping options are available at checkout for faster delivery (1-2 business days).</p>

<h3>Do you ship internationally?</h3>
<p>Currently, we ship within Egypt only. International shipping will be available soon.</p>

<h3>How can I track my order?</h3>
<p>Once your order ships, you'll receive a tracking number via email. You can also check your order status in your account dashboard.</p>

<h2>Returns & Exchanges</h2>
<h3>What is your return policy?</h3>
<p>We offer a 30-day return policy for unworn, unwashed items with original tags attached. Full refunds are provided for returned items.</p>

<h3>How do I initiate a return?</h3>
<p>Contact our customer service team or log into your account to start a return. We'll provide you with a prepaid return label.</p>

<h2>Sizing & Products</h2>
<h3>How do I choose the right size?</h3>
<p>Each product page includes a detailed size chart. If you're between sizes, we recommend ordering the larger size for growing children.</p>

<h3>Are your clothes machine washable?</h3>
<p>Yes! Most of our items are machine washable. Care instructions are provided on each product page and garment tag.</p>

<h2>Payment & Security</h2>
<h3>What payment methods do you accept?</h3>
<p>We accept all major credit cards, debit cards, and cash on delivery (COD) for eligible orders.</p>

<h3>Is my payment information secure?</h3>
<p>Absolutely. We use industry-standard encryption to protect your personal and payment information.</p>

<h2>Account & Support</h2>
<h3>Do I need an account to order?</h3>
<p>While you can checkout as a guest, creating an account allows you to track orders, save favorites, and checkout faster.</p>

<h3>How can I contact customer support?</h3>
<p>You can reach us via the contact form on our website, email us at support@kidsandco.com, or call our hotline during business hours.</p>`,
            contentAr: `<h1>الأسئلة الشائعة</h1>

<h2>الطلبات والشحن</h2>
<h3>كم يستغرق الشحن؟</h3>
<p>عادةً يستغرق الشحن القياسي من 3 إلى 5 أيام عمل. تتوفر خيارات الشحن السريع عند الدفع لتوصيل أسرع (1-2 يوم عمل).</p>

<h3>هل تشحنون دولياً؟</h3>
<p>حالياً، نشحن داخل مصر فقط. الشحن الدولي سيكون متاحاً قريباً.</p>

<h3>كيف يمكنني تتبع طلبي؟</h3>
<p>بمجرد شحن طلبك، ستتلقى رقم تتبع عبر البريد الإلكتروني. يمكنك أيضاً التحقق من حالة طلبك في لوحة حسابك.</p>

<h2>الاسترجاع والتبديل</h2>
<h3>ما هي سياسة الاسترجاع؟</h3>
<p>نقدم سياسة استرجاع لمدة 30 يوماً للعناصر غير المرتداة وغير المغسولة مع العلامات الأصلية. يتم تقديم استرداد كامل للعناصر المرتجعة.</p>

<h3>كيف أبدأ عملية الاسترجاع؟</h3>
<p>تواصل مع فريق خدمة العملاء أو سجّل الدخول إلى حسابك لبدء الاسترجاع. سنزودك بملصق إرجاع مدفوع مسبقاً.</p>

<h2>المقاسات والمنتجات</h2>
<h3>كيف أختار المقاس المناسب؟</h3>
<p>كل صفحة منتج تتضمن جدول مقاسات مفصل. إذا كنت بين مقاسين، نوصي بطلب المقاس الأكبر للأطفال في مرحلة النمو.</p>

<h3>هل ملابسكم قابلة للغسل في الغسالة؟</h3>
<p>نعم! معظم منتجاتنا قابلة للغسل في الغسالة. تعليمات العناية متوفرة في كل صفحة منتج وعلى بطاقة الملابس.</p>

<h2>الدفع والأمان</h2>
<h3>ما هي طرق الدفع التي تقبلونها؟</h3>
<p>نقبل جميع بطاقات الائتمان والخصم الرئيسية، والدفع عند الاستلام للطلبات المؤهلة.</p>

<h3>هل معلومات الدفع آمنة؟</h3>
<p>بالتأكيد. نستخدم تشفيراً بمعايير الصناعة لحماية معلوماتك الشخصية ومعلومات الدفع.</p>

<h2>الحساب والدعم</h2>
<h3>هل أحتاج حساباً للطلب؟</h3>
<p>يمكنك الدفع كضيف، لكن إنشاء حساب يتيح لك تتبع الطلبات وحفظ المفضلة والدفع بشكل أسرع.</p>

<h3>كيف أتواصل مع خدمة العملاء؟</h3>
<p>يمكنك التواصل معنا عبر نموذج الاتصال على موقعنا، أو البريد الإلكتروني support@kidsandco.com، أو الاتصال بالخط الساخن خلال ساعات العمل.</p>`,
            isActive: true
        },
        {
            title: 'Delivery & Returns',
            slug: 'delivery-return',
            contentEn: `<h1>Delivery & Returns Policy</h1>

<h2>Delivery Information</h2>

<h3>Shipping Methods</h3>
<ul>
<li><strong>Standard Shipping:</strong> 3-5 business days - Free on orders over 500 EGP</li>
<li><strong>Express Shipping:</strong> 1-2 business days - 50 EGP flat rate</li>
<li><strong>Same-Day Delivery:</strong> Available in select areas - 100 EGP</li>
</ul>

<h3>Delivery Times</h3>
<p>Orders placed before 2 PM are typically processed the same day. Delivery times may vary during holidays and peak seasons.</p>

<h3>Order Tracking</h3>
<p>Track your order in real-time using the tracking number sent to your email. You can also check your order status in your account dashboard.</p>

<h2>Returns Policy</h2>

<h3>30-Day Return Window</h3>
<p>You have 30 days from the date of delivery to return any item. Items must be:</p>
<ul>
<li>Unworn and unwashed</li>
<li>In original condition with all tags attached</li>
<li>In original packaging when possible</li>
</ul>

<h3>How to Return</h3>
<ol>
<li>Log into your account and go to Order History</li>
<li>Select the order and click "Return Items"</li>
<li>Choose items to return and provide reason</li>
<li>Print the prepaid return label we email you</li>
<li>Pack items securely and attach the label</li>
<li>Drop off at any authorized courier location</li>
</ol>

<h3>Refunds</h3>
<p>Once we receive and inspect your return, we'll process your refund within 5-7 business days. Refunds are issued to the original payment method.</p>

<h2>Exchanges</h2>
<p>Need a different size or color? We make exchanges easy! Follow the same return process and place a new order for the item you want. We'll process your refund promptly.</p>

<h2>Damaged or Defective Items</h2>
<p>If you receive a damaged or defective item, please contact us within 48 hours of delivery. We'll arrange a free return and send a replacement or provide a full refund.</p>

<h2>Non-Returnable Items</h2>
<p>For hygiene reasons, certain items cannot be returned:</p>
<ul>
<li>Underwear and innerwear</li>
<li>Swimwear (unless unopened)</li>
<li>Face masks</li>
<li>Personalized or custom items</li>
</ul>

<h2>Contact Us</h2>
<p>Have questions about delivery or returns? Contact our customer service team at support@kidsandco.com or call us during business hours.</p>`,
            contentAr: `<h1>سياسة الشحن والاسترجاع</h1>

<h2>معلومات التوصيل</h2>

<h3>طرق الشحن</h3>
<ul>
<li><strong>الشحن القياسي:</strong> 3-5 أيام عمل - مجاني للطلبات أكثر من 500 جنيه</li>
<li><strong>الشحن السريع:</strong> 1-2 يوم عمل - 50 جنيه سعر ثابت</li>
<li><strong>التوصيل في نفس اليوم:</strong> متاح في مناطق محددة - 100 جنيه</li>
</ul>

<h3>أوقات التوصيل</h3>
<p>الطلبات المقدمة قبل الساعة 2 مساءً عادةً ما تتم معالجتها في نفس اليوم. قد تختلف أوقات التوصيل خلال العطلات والمواسم.</p>

<h3>تتبع الطلب</h3>
<p>تتبع طلبك في الوقت الفعلي باستخدام رقم التتبع المرسل إلى بريدك الإلكتروني. يمكنك أيضاً التحقق من حالة طلبك في لوحة حسابك.</p>

<h2>سياسة الاسترجاع</h2>

<h3>فترة استرجاع 30 يوماً</h3>
<p>لديك 30 يوماً من تاريخ التوصيل لإرجاع أي عنصر. يجب أن تكون العناصر:</p>
<ul>
<li>غير مرتداة وغير مغسولة</li>
<li>في حالتها الأصلية مع جميع العلامات</li>
<li>في عبواتها الأصلية عند الإمكان</li>
</ul>

<h3>كيفية الاسترجاع</h3>
<ol>
<li>سجّل الدخول إلى حسابك وانتقل إلى سجل الطلبات</li>
<li>اختر الطلب واضغط على "إرجاع العناصر"</li>
<li>اختر العناصر المراد إرجاعها واذكر السبب</li>
<li>اطبع ملصق الإرجاع المدفوع مسبقاً الذي نرسله لك</li>
<li>غلّف العناصر بأمان وألصق الملصق</li>
<li>سلّمها إلى أي موقع معتمد للشحن</li>
</ol>

<h3>استرداد المبالغ</h3>
<p>بمجرد استلام واستلام استرجاعك، سنعالج استرداد المبلغ خلال 5-7 أيام عمل. يتم إصدار المبلغ إلى طريقة الدفع الأصلية.</p>

<h2>التبديلات</h2>
<p>تحتاج مقاساً أو لوناً مختلفاً؟ نجعل التبديلات سهلة! اتبع نفس عملية الاسترجاع وقدم طلباً جديداً للعنصر الذي تريده. سنعالج استرداد المبلغ بسرعة.</p>

<h2>العناصر التالفة أو المعيبة</h2>
<p>إذا استلمت عنصراً تالفاً أو معيباً، يرجى التواصل معنا خلال 48 ساعة من التوصيل. سنرتب إرجاعاً مجانياً ونرسل بديلاً أو نوفر استرداداً كاملاً.</p>

<h2>العناصر غير القابلة للاسترجاع</h2>
<p>لأسباب صحية، لا يمكن إرجاع بعض العناصر:</p>
<ul>
<li>الملابس الداخلية</li>
<li>ملابس السباحة (ما لم تكن غير مفتوحة)</li>
<li>أقنعة الوجه</li>
<li>العناصر المخصصة أو الشخصية</li>
</ul>

<h2>تواصل معنا</h2>
<p>لديك أسئلة حول التوصيل أو الاسترجاع؟ تواصل مع فريق خدمة العملاء على support@kidsandco.com أو اتصل بنا خلال ساعات العمل.</p>`,
            isActive: true
        },
        {
            title: 'Privacy Policy',
            slug: 'privacy-policy',
            contentEn: `<h1>Privacy Policy</h1>
<p><em>Last updated: January 2026</em></p>

<h2>Introduction</h2>
<p>At Kids & Co, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, and safeguard your data.</p>

<h2>Information We Collect</h2>
<h3>Personal Information</h3>
<ul>
<li>Name, email address, and phone number</li>
<li>Shipping and billing addresses</li>
<li>Payment information (processed securely by our payment partners)</li>
<li>Order history and preferences</li>
</ul>

<h3>Automatically Collected Information</h3>
<ul>
<li>Browser type and IP address</li>
<li>Pages visited and time spent on site</li>
<li>Referring website addresses</li>
<li>Device information</li>
</ul>

<h2>How We Use Your Information</h2>
<p>We use your information to:</p>
<ul>
<li>Process and fulfill your orders</li>
<li>Communicate about your orders and account</li>
<li>Send promotional emails (with your consent)</li>
<li>Improve our website and services</li>
<li>Prevent fraud and enhance security</li>
<li>Comply with legal obligations</li>
</ul>

<h2>Information Sharing</h2>
<p>We do not sell your personal information. We may share your data with:</p>
<ul>
<li><strong>Service Providers:</strong> Shipping companies, payment processors, and marketing partners</li>
<li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
<li><strong>Business Transfers:</strong> In the event of a merger or acquisition</li>
</ul>

<h2>Data Security</h2>
<p>We implement industry-standard security measures to protect your information, including:</p>
<ul>
<li>SSL encryption for data transmission</li>
<li>Secure servers and databases</li>
<li>Regular security audits</li>
<li>Limited access to personal information</li>
</ul>

<h2>Your Rights</h2>
<p>You have the right to:</p>
<ul>
<li>Access your personal information</li>
<li>Correct inaccurate data</li>
<li>Request deletion of your data</li>
<li>Opt-out of marketing communications</li>
<li>Object to data processing</li>
</ul>

<h2>Cookies</h2>
<p>We use cookies to enhance your browsing experience. You can control cookie settings through your browser preferences.</p>

<h2>Children's Privacy</h2>
<p>While we sell children's products, our website is intended for use by adults. We do not knowingly collect information from children under 13.</p>

<h2>Changes to This Policy</h2>
<p>We may update this Privacy Policy periodically. We'll notify you of significant changes via email or website notice.</p>

<h2>Contact Us</h2>
<p>If you have questions about this Privacy Policy, please contact us at privacy@kidsandco.com</p>`,
            contentAr: `<h1>سياسة الخصوصية</h1>
<p><em>آخر تحديث: يناير 2026</em></p>

<h2>مقدمة</h2>
<p>في Kids & Co، نحن ملتزمون بحماية خصوصيتك وضمان أمان معلوماتك الشخصية. توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية بياناتك.</p>

<h2>المعلومات التي نجمعها</h2>
<h3>المعلومات الشخصية</h3>
<ul>
<li>الاسم والبريد الإلكتروني ورقم الهاتف</li>
<li>عناوين الشحن والفواتير</li>
<li>معلومات الدفع (تتم معالجتها بأمان من قبل شركائنا في الدفع)</li>
<li>سجل الطلبات والتفضيلات</li>
</ul>

<h3>المعلومات المجموعة تلقائياً</h3>
<ul>
<li>نوع المتصفح وعنوان IP</li>
<li>الصفحات التي تمت زيارتها والوقت المستغرق في الموقع</li>
<li>عناوين المواقع المحيلة</li>
<li>معلومات الجهاز</li>
</ul>

<h2>كيف نستخدم معلوماتك</h2>
<p>نستخدم معلوماتك لـ:</p>
<ul>
<li>معالجة وتلبية طلباتك</li>
<li>التواصل بشأن طلباتك وحسابك</li>
<li>إرسال رسائل بريد إلكتروني ترويجية (بموافقتك)</li>
<li>تحسين موقعنا وخدماتنا</li>
<li>منع الاحتيال وتعزيز الأمان</li>
<li>الامتثال للالتزامات القانونية</li>
</ul>

<h2>مشاركة المعلومات</h2>
<p>لا نبيع معلوماتك الشخصية. قد نشارك بياناتك مع:</p>
<ul>
<li><strong>مقدمي الخدمات:</strong> شركات الشحن ومعالجي الدفع وشركاء التسويق</li>
<li><strong>المتطلبات القانونية:</strong> عند الاقتضاء بموجب القانون أو لحماية حقوقنا</li>
<li><strong>نقل الأعمال:</strong> في حالة الاندماج أو الاستحواذ</li>
</ul>

<h2>أمان البيانات</h2>
<p>نطبق تدابير أمنية بمعايير الصناعة لحماية معلوماتك، بما في ذلك:</p>
<ul>
<li>تشفير SSL لنقل البيانات</li>
<li>خوادم وقواعد بيانات آمنة</li>
<li>تدقيقات أمنية منتظمة</li>
<li>وصول محدود إلى المعلومات الشخصية</li>
</ul>

<h2>حقوقك</h2>
<p>لديك الحق في:</p>
<ul>
<li>الوصول إلى معلوماتك الشخصية</li>
<li>تصحيح البيانات غير الدقيقة</li>
<li>طلب حذف بياناتك</li>
<li>الانسحاب من الاتصالات التسويقية</li>
<li>الاعتراض على معالجة البيانات</li>
</ul>

<h2>ملفات تعريف الارتباط</h2>
<p>نستخدم ملفات تعريف الارتباط لتحسين تجربة التصفح. يمكنك التحكم في إعدادات ملفات تعريف الارتباط من خلال تفضيلات المتصفح.</p>

<h2>خصوصية الأطفال</h2>
<p>على الرغم من أننا نبيع منتجات للأطفال، فإن موقعنا مخصص للاستخدام من قبل البالغين. لا نجمع معلومات من الأطفال دون 13 عاماً عن قصد.</p>

<h2>التغييرات على هذه السياسة</h2>
<p>قد نقوم بتحديث سياسة الخصوصية هذه بشكل دوري. سنخطرك بالتغييرات المهمة عبر البريد الإلكتروني أو إشعار على الموقع.</p>

<h2>تواصل معنا</h2>
<p>إذا كانت لديك أسئلة حول سياسة الخصوصية هذه، يرجى التواصل معنا على privacy@kidsandco.com</p>`,
            isActive: true
        },
        {
            title: 'Terms & Conditions',
            slug: 'terms-conditions',
            contentEn: `<h1>Terms & Conditions</h1>
<p><em>Last updated: January 2026</em></p>

<h2>1. Agreement to Terms</h2>
<p>By accessing and using the Kids & Co website and services, you agree to be bound by these Terms and Conditions. If you disagree with any part of these terms, you may not access our services.</p>

<h2>2. Use of Our Service</h2>
<h3>Account Registration</h3>
<ul>
<li>You must be at least 18 years old to create an account</li>
<li>You are responsible for maintaining account security</li>
<li>You must provide accurate and complete information</li>
<li>One person may not maintain multiple accounts</li>
</ul>

<h3>Prohibited Activities</h3>
<p>You may not:</p>
<ul>
<li>Use the service for any illegal purpose</li>
<li>Attempt to access unauthorized areas</li>
<li>Interfere with the proper functioning of the website</li>
<li>Transmit viruses or malicious code</li>
<li>Harvest data from other users</li>
</ul>

<h2>3. Products & Pricing</h2>
<ul>
<li>All prices are in Egyptian Pounds (EGP) unless otherwise stated</li>
<li>We reserve the right to change prices without notice</li>
<li>Product images are for illustration; actual products may vary slightly</li>
<li>We do not guarantee product availability</li>
<li>We reserve the right to limit order quantities</li>
</ul>

<h2>4. Orders & Payment</h2>
<h3>Order Acceptance</h3>
<p>Your order is an offer to purchase. We reserve the right to accept or reject any order. We'll notify you of acceptance via email.</p>

<h3>Payment</h3>
<ul>
<li>Payment must be made at time of order</li>
<li>We accept credit/debit cards and cash on delivery</li>
<li>Prices include applicable taxes</li>
<li>Failed payments may result in order cancellation</li>
</ul>

<h2>5. Shipping & Delivery</h2>
<ul>
<li>Delivery times are estimates, not guarantees</li>
<li>Risk of loss passes to you upon delivery</li>
<li>We are not responsible for delays caused by shipping carriers</li>
<li>Undeliverable packages may incur return shipping fees</li>
</ul>

<h2>6. Returns & Refunds</h2>
<p>Please refer to our Delivery & Returns Policy for detailed information. All returns are subject to inspection and approval.</p>

<h2>7. Intellectual Property</h2>
<ul>
<li>All content on this website is owned by Kids & Co</li>
<li>You may not reproduce, distribute, or modify our content</li>
<li>Our logos and trademarks are protected by law</li>
<li>Unauthorized use may result in legal action</li>
</ul>

<h2>8. User Content</h2>
<p>By submitting reviews, photos, or other content, you grant us a worldwide, royalty-free license to use, reproduce, and display that content.</p>

<h2>9. Disclaimer of Warranties</h2>
<p>Our services are provided "as is" without warranties of any kind. We do not guarantee uninterrupted or error-free service.</p>

<h2>10. Limitation of Liability</h2>
<p>Kids & Co shall not be liable for any indirect, incidental, or consequential damages arising from your use of our services.</p>

<h2>11. Indemnification</h2>
<p>You agree to indemnify and hold Kids & Co harmless from any claims arising from your use of our services or violation of these terms.</p>

<h2>12. Governing Law</h2>
<p>These terms are governed by the laws of Egypt. Any disputes shall be resolved in Egyptian courts.</p>

<h2>13. Changes to Terms</h2>
<p>We reserve the right to modify these terms at any time. Continued use of our services constitutes acceptance of modified terms.</p>

<h2>14. Contact Information</h2>
<p>For questions about these Terms & Conditions, contact us at legal@kidsandco.com</p>`,
            contentAr: `<h1>الشروط والأحكام</h1>
<p><em>آخر تحديث: يناير 2026</em></p>

<h2>1. الاتفاق على الشروط</h2>
<p>من خلال الوصول إلى موقع Kids & Co واستخدامه وخدماتنا، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا لم توافق على أي جزء من هذه الشروط، فلا يجوز لك الوصول إلى خدماتنا.</p>

<h2>2. استخدام خدمتنا</h2>
<h3>تسجيل الحساب</h3>
<ul>
<li>يجب أن يكون عمرك 18 عاماً على الأقل لإنشاء حساب</li>
<li>أنت مسؤول عن الحفاظ على أمان الحساب</li>
<li>يجب تقديم معلومات دقيقة وكاملة</li>
<li>لا يجوز لشخص واحد الاحتفاظ بحسابات متعددة</li>
</ul>

<h3>الأنشطة المحظورة</h3>
<p>لا يجوز لك:</p>
<ul>
<li>استخدام الخدمة لأي غرض غير قانوني</li>
<li>محاولة الوصول إلى مناطق غير مصرح بها</li>
<li>التدخل في الأداء السليم للموقع</li>
<li>نقل الفيروسات أو التعليمات البرمجية الضارة</li>
<li>جمع بيانات من مستخدمين آخرين</li>
</ul>

<h2>3. المنتجات والأسعار</h2>
<ul>
<li>جميع الأسعار بالجنيه المصري (EGP) ما لم يُذكر خلاف ذلك</li>
<li>نحتفظ بالحق في تغيير الأسعار دون إشعار</li>
<li>صور المنتجات للعرض فقط؛ قد تختلف المنتجات الفعلية قليلاً</li>
<li>لا نضمن توفر المنتج</li>
<li>نحتفظ بالحق في تحديد كميات الطلب</li>
</ul>

<h2>4. الطلبات والدفع</h2>
<h3>قبول الطلب</h3>
<p>طلبك هو عرض للشراء. نحتفظ بالحق في قبول أو رفض أي طلب. سنخطرك بالقبول عبر البريد الإلكتروني.</p>

<h3>الدفع</h3>
<ul>
<li>يجب السداد وقت الطلب</li>
<li>نقبل بطاقات الائتمان/الخصم والدفع عند الاستلام</li>
<li>الأسعار تشمل الضرائب المطبقة</li>
<li>قد يؤدي فشل الدفع إلى إلغاء الطلب</li>
</ul>

<h2>5. الشحن والتوصيل</h2>
<ul>
<li>أوقات التوصيل تقديرات وليست ضمانات</li>
<li>ينتقل خطر الفقدان إليك عند التوصيل</li>
<li>لسنا مسؤولين عن التأخيرات الناتجة عن شركات الشحن</li>
<li>الطرود غير القابلة للتوصيل قد تتحمل رسوم شحن إرجاع</li>
</ul>

<h2>6. الاسترجاع والاسترداد</h2>
<p>يرجى الرجوع إلى سياسة الشحن والاسترجاع للحصول على معلومات مفصلة. جميع عمليات الاسترجاع تخضع للفحص والموافقة.</p>

<h2>7. الملكية الفكرية</h2>
<ul>
<li>جميع المحتويات على هذا الموقع مملوكة لـ Kids & Co</li>
<li>لا يجوز لك إعادة إنتاج أو توزيع أو تعديل محتوانا</li>
<li>شعاراتنا وعلاماتنا التجارية محمية بموجب القانون</li>
<li>الاستخدام غير المصرح به قد يؤدي إلى إجراءات قانونية</li>
</ul>

<h2>8. محتوى المستخدم</h2>
<p>بتقديم التقييمات أو الصور أو محتوى آخر، فإنك تمنحنا ترخيصاً عالمياً وخالياً من حقوق الملكية لاستخدام وإعادة إنتاج وعرض هذا المحتوى.</p>

<h2>9. إخلاء المسؤولية عن الضمانات</h2>
<p>يتم تقديم خدماتنا "كما هي" دون ضمانات من أي نوع. لا نضمن خدمة بدون انقطاع أو خالية من الأخطاء.</p>

<h2>10. تحديد المسؤولية</h2>
<p>لا تتحمل Kids & Co مسؤولية أي أضرار غير مباشرة أو عرضية أو تبعية ناتجة عن استخدامك لخدماتنا.</p>

<h2>11. التعويض</h2>
<p>توافق على تعويض Kids & Co وحمايته من أي مطالبات ناتجة عن استخدامك لخدماتنا أو انتهاكك لهذه الشروط.</p>

<h2>12. القانون الحاكم</h2>
<p>تخضع هذه الشروط لقوانين مصر. يتم حل أي نزاعات في المحاكم المصرية.</p>

<h2>13. التغييرات على الشروط</h2>
<p>نحتفظ بالحق في تعديل هذه الشروط في أي وقت. الاستخدام المستمر لخدماتنا يشكل قبولاً للشروط المعدلة.</p>

<h2>14. معلومات الاتصال</h2>
<p>لأسئلة حول هذه الشروط والأحكام، تواصل معنا على legal@kidsandco.com</p>`,
            isActive: true
        },
        {
            title: 'Contact Us',
            slug: 'contact',
            contentEn: `<h1>Contact Us</h1>

<h2>Get In Touch</h2>
<p>We'd love to hear from you! Whether you have a question about products, orders, or anything else, our team is ready to help.</p>

<h2>Customer Service</h2>
<p><strong>Email:</strong> support@kidsandco.com</p>
<p><strong>Phone:</strong> +20 123 456 7890</p>
<p><strong>Hours:</strong> Saturday - Thursday, 9:00 AM - 6:00 PM (EET)</p>
<p><em>Closed on Fridays and public holidays</em></p>

<h2>Office Address</h2>
<p>Kids & Co Headquarters<br>
123 Mohamed Farid Street<br>
Downtown, Cairo<br>
Egypt 11511</p>

<h2>Business Inquiries</h2>
<p><strong>Partnerships:</strong> partners@kidsandco.com</p>
<p><strong>Press & Media:</strong> media@kidsandco.com</p>
<p><strong>Careers:</strong> careers@kidsandco.com</p>

<h2>Social Media</h2>
<p>Follow us on social media for the latest updates, promotions, and inspiration:</p>
<ul>
<li><strong>Facebook:</strong> @KidsAndCoEgypt</li>
<li><strong>Instagram:</strong> @kidsandco_official</li>
<li><strong>Twitter:</strong> @KidsAndCoEG</li>
</ul>

<h2>Feedback</h2>
<p>Your feedback helps us improve! Share your thoughts, suggestions, or concerns at feedback@kidsandco.com</p>

<p><em>We typically respond to all inquiries within 24 hours during business days.</em></p>`,
            contentAr: `<h1>تواصل معنا</h1>

<h2>ابقى على تواصل</h2>
<p>يسعدنا أن نسمع منك! سواء كان لديك سؤال عن المنتجات أو الطلبات أو أي شيء آخر، فريقنا جاهز للمساعدة.</p>

<h2>خدمة العملاء</h2>
<p><strong>البريد الإلكتروني:</strong> support@kidsandco.com</p>
<p><strong>الهاتف:</strong> +20 123 456 7890</p>
<p><strong>ساعات العمل:</strong> السبت - الخميس، 9:00 صباحاً - 6:00 مساءً (بتوقيت القاهرة)</p>
<p><em>مغلق يوم الجمعة والعطلات الرسمية</em></p>

<h2>عنوان المكتب</h2>
<p>مقر Kids & Co<br>
123 شارع محمد فريد<br>
الوسطى، القاهرة<br>
مصر 11511</p>

<h2>استفسارات الأعمال</h2>
<p><strong>الشراكات:</strong> partners@kidsandco.com</p>
<p><strong>الصحافة والإعلام:</strong> media@kidsandco.com</p>
<p><strong>التوظيف:</strong> careers@kidsandco.com</p>

<h2>وسائل التواصل الاجتماعي</h2>
<p>تابعنا على وسائل التواصل الاجتماعي لآخر التحديثات والعروض والإلهام:</p>
<ul>
<li><strong>فيسبوك:</strong> @KidsAndCoEgypt</li>
<li><strong>إنستجرام:</strong> @kidsandco_official</li>
<li><strong>تويتر:</strong> @KidsAndCoEG</li>
</ul>

<h2>الملاحظات</h2>
<p>ملاحظاتك تساعدنا على التحسين! شارك أفكارك أو اقتراحاتك أو مخاوفك على feedback@kidsandco.com</p>

<p><em>عادةً نرد على جميع الاستفسارات خلال 24 ساعة في أيام العمل.</em></p>`,
            isActive: true
        }
    ];

    // Delete existing pages first to avoid constraint conflicts
    await prisma.staticPage.deleteMany({});
    console.log('🗑️ Cleared existing static pages');

    for (const page of pages) {
        await prisma.staticPage.create({
            data: {
                title: page.title,
                slug: page.slug,
                contentEn: page.contentEn,
                contentAr: page.contentAr,
                isActive: page.isActive
            }
        });
        console.log(`   ✅ ${page.title} (${page.slug})`);
    }

    console.log('Static pages seeded!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
