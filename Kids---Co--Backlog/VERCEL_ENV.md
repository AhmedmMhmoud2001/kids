# إعداد Vercel لمتجر Kids (kids-co-backlog.vercel.app)

## مشكلة: الطلبات تروح على localhost:5000 أو ERR_CONNECTION_REFUSED

الكود دلوقتي يحدد رابط الـ API **وقت التشغيل**: لو الموقع من **localhost** يستخدم localhost:5000، ولو من **أي دومين تاني** (مثل kids-co-backlog.vercel.app) يستخدم سيرفر الإنتاج. عشان يشتغل لازم يكون **آخر كوميت مرفوع على الريبو وتم عمل Deploy جديد**.

## الخطوات (مهمة)

### 1. رفع الكود و Deploy جديد

من جهازك من جذر المشروع:

```bash
git add .
git commit -m "fix: force production API when not on localhost"
git push
```

بعد الـ push، Vercel هيعمل Deploy تلقائي. انتظر لحد ما يخلص.

### 2. (اختياري) مسح متغيرات localhost من Vercel

1. ادخل [Vercel Dashboard](https://vercel.com/dashboard) → مشروع **Kids** (kids-co-backlog.vercel.app).
2. **Settings** → **Environment Variables**.
3. لو فيه `VITE_API_URL` أو `VITE_API_HOST` قيمتها `http://localhost:5000` → **امسحهم** (مش محتاجينهم على الإنتاج).
4. احفظ ثم من **Deployments** اعمل **Redeploy** لآخر ديبلوي.

### 3. تجربة الموقع

افتح https://kids-co-backlog.vercel.app واعمل **Hard Refresh** (Ctrl+Shift+R أو Cmd+Shift+R) عشان المتصفح مايستخدمش نسخة قديمة من الـ JS. بعد كده الطلبات تكون على `https://kids.nodeteam.site/api`.
