# Deploy Admin Dashboard on Vercel

## إذا ظهر: "Failed to fetch one or more git submodules"

### 1. تعطيل Git Submodules في إعدادات Vercel

1. ادخل على [Vercel Dashboard](https://vercel.com/dashboard)
2. اختر المشروع (admin_dashboard)
3. **Settings** → **Git**
4. لو فيه خيار **"Include Git Submodules"** أو **"Clone submodules"** → غيّره لـ **Off** / **No**
5. احفظ ثم اعمل **Redeploy** من تبويب Deployments

### 2. التأكد أن الريبو بدون submodules

لو الريبو الرئيسي (fullstack_kids) كان فيه مجلد مسجّل كـ submodule (مثل Kids---Co--Backlog)، لازم يكون تم إلغاء تسجيله ورفع الكوميت.

على جهازك من جذر المشروع:

```bash
git status
# لو فيه تغييرات (admin_dashboard أو غيره) اعمل:
git add .
git commit -m "fix: remove submodule ref for Vercel deploy"
git push
```

بعد الـ push، من Vercel اعمل **Redeploy** للمشروع.

### 3. إعداد المشروع على Vercel

- **Root Directory:** `admin_dashboard` (لو الداشبورد داخل نفس الريبو)
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variables:**  
  `VITE_API_URL` و `VITE_API_HOST` لو محتاجهم (غالباً من الـ config أو .env)

بعد تطبيق الخطوات فوق، التحذير الخاص بالـ submodules يفترض يختفي مع الـ redeploy.
