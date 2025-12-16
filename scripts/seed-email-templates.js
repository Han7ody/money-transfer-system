const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../backend/node_modules/@prisma/client'));
const prisma = new PrismaClient();

const templates = [
  {
    name: 'WELCOME_EMAIL',
    displayName: 'رسالة الترحيب',
    subject: 'مرحباً بك في راصد - حسابك جاهز',
    bodyHtml: `<div dir="rtl">
<h2>مرحباً {{name}}،</h2>
<p>أهلاً بك في راصد! يسعدنا انضمامك إلى منصتنا لتحويل الأموال.</p>
<p>حسابك الآن جاهز للاستخدام. يمكنك البدء بإجراء تحويلاتك المالية بكل سهولة وأمان.</p>
<p>للبدء، يرجى إكمال عملية التحقق من هويتك (KYC) للاستفادة من جميع خدماتنا.</p>
<p>مع تحيات،<br>فريق راصد</p>
</div>`,
    bodyText: 'مرحباً {{name}}، أهلاً بك في راصد!',
    variables: ['name']
  },
  {
    name: 'EMAIL_VERIFICATION',
    displayName: 'رمز التحقق من البريد',
    subject: 'رمز التحقق من بريدك الإلكتروني - راصد',
    bodyHtml: `<div dir="rtl">
<h2>مرحباً {{name}}،</h2>
<p>رمز التحقق الخاص بك هو:</p>
<h1 style="color: #4f46e5; font-size: 32px; letter-spacing: 4px;">{{otp}}</h1>
<p>هذا الرمز صالح لمدة 10 دقائق فقط. لا تشاركه مع أي شخص.</p>
<p>إذا لم تطلب هذا الرمز، يرجى تجاهل هذا البريد.</p>
<p>مع تحيات،<br>فريق راصد</p>
</div>`,
    bodyText: 'رمز التحقق: {{otp}}',
    variables: ['name', 'otp']
  },
  {
    name: 'PASSWORD_RESET',
    displayName: 'إعادة تعيين كلمة المرور',
    subject: 'إعادة تعيين كلمة المرور - راصد',
    bodyHtml: `<div dir="rtl">
<h2>مرحباً {{name}}،</h2>
<p>تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك.</p>
<p>رمز إعادة التعيين الخاص بك هو:</p>
<h1 style="color: #4f46e5; font-size: 32px; letter-spacing: 4px;">{{otp}}</h1>
<p>هذا الرمز صالح لمدة 15 دقيقة فقط.</p>
<p>إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد.</p>
<p>مع تحيات،<br>فريق راصد</p>
</div>`,
    bodyText: 'رمز إعادة التعيين: {{otp}}',
    variables: ['name', 'otp']
  },
  {
    name: 'TRANSACTION_CREATED',
    displayName: 'تم إنشاء تحويل',
    subject: 'تم إنشاء تحويل جديد - {{transaction_id}}',
    bodyHtml: `<div dir="rtl">
<h2>مرحباً {{name}}،</h2>
<p>تم إنشاء طلب تحويل جديد بنجاح.</p>
<h3>تفاصيل التحويل:</h3>
<ul>
<li><strong>رقم المرجع:</strong> {{transaction_id}}</li>
<li><strong>المبلغ المرسل:</strong> {{amount_sent}} {{from_currency}}</li>
<li><strong>المبلغ المستلم:</strong> {{amount_received}} {{to_currency}}</li>
<li><strong>سعر الصرف:</strong> {{exchange_rate}}</li>
<li><strong>المستفيد:</strong> {{recipient_name}}</li>
</ul>
<p><strong>الخطوة التالية:</strong><br>يرجى إتمام عملية الدفع ورفع إيصال التحويل لمتابعة معالجة طلبك.</p>
<p>مع تحيات،<br>فريق راصد</p>
</div>`,
    bodyText: 'تم إنشاء تحويل {{transaction_id}}',
    variables: ['name', 'transaction_id', 'amount_sent', 'from_currency', 'amount_received', 'to_currency', 'exchange_rate', 'recipient_name']
  },
  {
    name: 'TRANSACTION_COMPLETED',
    displayName: 'تم إتمام التحويل',
    subject: 'تم إتمام تحويلك بنجاح ✓ - {{transaction_id}}',
    bodyHtml: `<div dir="rtl">
<h2>مرحباً {{name}}،</h2>
<p>يسعدنا إبلاغك بأن تحويلك قد تم بنجاح!</p>
<h3>ملخص التحويل:</h3>
<ul>
<li><strong>رقم المرجع:</strong> {{transaction_id}}</li>
<li><strong>المبلغ المرسل:</strong> {{amount_sent}} {{from_currency}}</li>
<li><strong>المبلغ المستلم:</strong> {{amount_received}} {{to_currency}}</li>
<li><strong>المستفيد:</strong> {{recipient_name}}</li>
<li><strong>تاريخ الإتمام:</strong> {{completion_date}}</li>
</ul>
<p>تم إيداع المبلغ في حساب المستفيد بنجاح.</p>
<p>شكراً لاختيارك راصد!</p>
<p>مع تحيات،<br>فريق راصد</p>
</div>`,
    bodyText: 'تم إتمام تحويل {{transaction_id}}',
    variables: ['name', 'transaction_id', 'amount_sent', 'from_currency', 'amount_received', 'to_currency', 'recipient_name', 'completion_date']
  },
  {
    name: 'TRANSACTION_REJECTED',
    displayName: 'تم رفض التحويل',
    subject: 'تم رفض التحويل - {{transaction_id}}',
    bodyHtml: `<div dir="rtl">
<h2>مرحباً {{name}}،</h2>
<p>نأسف لإبلاغك بأن تحويلك رقم {{transaction_id}} لم يتم قبوله.</p>
<p><strong>السبب:</strong> {{reason}}</p>
<p>إذا كنت بحاجة إلى مساعدة، يرجى التواصل مع فريق الدعم.</p>
<p>مع تحيات،<br>فريق راصد</p>
</div>`,
    bodyText: 'تم رفض تحويل {{transaction_id}}. السبب: {{reason}}',
    variables: ['name', 'transaction_id', 'reason']
  },
  {
    name: 'KYC_APPROVED',
    displayName: 'تمت الموافقة على التحقق',
    subject: 'تمت الموافقة على التحقق من هويتك ✓',
    bodyHtml: `<div dir="rtl">
<h2>مرحباً {{name}}،</h2>
<p>أخبار سارة! تمت الموافقة على وثائق التحقق من هويتك بنجاح.</p>
<p>حسابك الآن موثق بالكامل ويمكنك الاستفادة من جميع خدمات راصد:</p>
<ul>
<li>إجراء تحويلات مالية دولية</li>
<li>حدود تحويل أعلى</li>
<li>أسعار صرف تنافسية</li>
</ul>
<p>ابدأ أول تحويل لك الآن!</p>
<p>مع تحيات،<br>فريق راصد</p>
</div>`,
    bodyText: 'تمت الموافقة على التحقق من هويتك',
    variables: ['name']
  },
  {
    name: 'KYC_REJECTED',
    displayName: 'تم رفض التحقق',
    subject: 'يلزم تحديث وثائق التحقق',
    bodyHtml: `<div dir="rtl">
<h2>مرحباً {{name}}،</h2>
<p>للأسف، لم نتمكن من الموافقة على وثائق التحقق من هويتك للسبب التالي:</p>
<p><strong>{{reason}}</strong></p>
<p>يرجى إعادة رفع المستندات المطلوبة مع التأكد من:</p>
<ul>
<li>وضوح الصورة وجودتها</li>
<li>ظهور جميع المعلومات بشكل كامل</li>
<li>صلاحية المستند</li>
</ul>
<p>إذا كنت بحاجة إلى مساعدة، لا تتردد في التواصل مع فريق الدعم.</p>
<p>مع تحيات،<br>فريق راصد</p>
</div>`,
    bodyText: 'يلزم تحديث وثائق التحقق. السبب: {{reason}}',
    variables: ['name', 'reason']
  }
];

async function seedEmailTemplates() {
  try {
    console.log('Seeding email templates...');

    for (const template of templates) {
      await prisma.emailTemplate.upsert({
        where: { name: template.name },
        update: template,
        create: template
      });
      console.log(`✓ ${template.displayName}`);
    }

    console.log('\n✅ Email templates seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding email templates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedEmailTemplates();
