import React, { useState, useEffect } from 'react';
import { Save, Video, Info, CheckCircle2, Loader2, Play, ExternalLink } from 'lucide-react';
import { fetchSettings, updateSetting } from '../api/settings';
import { useLanguage } from '../context/LanguageContext';
import { tx } from '../i18n/text';

const HomeSettings = () => {
    const { t } = useLanguage();
    const [videoUrl, setVideoUrl] = useState('');
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    const SETTING_KEY = 'home2_hero_video';
    const OFFERS_KEY = 'top_header_offers';

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const response = await fetchSettings();
            if (response.success) {
                const videoSetting = response.data.find(s => s.key === SETTING_KEY);
                if (videoSetting) setVideoUrl(videoSetting.value);
                const offersSetting = response.data.find(s => s.key === OFFERS_KEY);
                if (offersSetting?.value) {
                    try {
                        const parsed = JSON.parse(offersSetting.value);
                        if (Array.isArray(parsed)) {
                            setOffers(parsed.map((o, idx) => ({
                                id: o.id || `offer-${Date.now()}-${idx}`,
                                titleEn: o.titleEn || '',
                                titleAr: o.titleAr || '',
                                discountPercent: Number(o.discountPercent || 0),
                                url: '/shop',
                                categorySlug: o.categorySlug || '',
                                brandSlug: o.brandSlug || '',
                                productIds: Array.isArray(o.productIds) ? o.productIds.join(',') : (o.productIds || ''),
                                isActive: o.isActive !== false
                            })));
                        }
                    } catch {
                        setOffers([]);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading home settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setMessage(null);
            const offersPayload = JSON.stringify(
                (offers || []).map((o) => ({
                    id: o.id,
                    titleEn: String(o.titleEn || '').trim(),
                    titleAr: String(o.titleAr || '').trim(),
                    discountPercent: Math.max(0, Number(o.discountPercent || 0)),
                    url: '/shop',
                    categorySlug: String(o.categorySlug || '').trim(),
                    brandSlug: String(o.brandSlug || '').trim(),
                    productIds: String(o.productIds || '')
                        .split(',')
                        .map((id) => id.trim())
                        .filter(Boolean),
                    isActive: o.isActive !== false
                })).filter((o) => o.titleEn || o.titleAr || o.discountPercent > 0)
            );
            const [videoRes, offersRes] = await Promise.all([
                updateSetting(SETTING_KEY, videoUrl),
                updateSetting(OFFERS_KEY, offersPayload)
            ]);
            if (videoRes.success && offersRes.success) {
                setMessage({ type: 'success', text: t(tx('Home2 Hero Video updated successfully!', 'تم تحديث فيديو الهيرو بنجاح!')) });
                setTimeout(() => setMessage(null), 3000);
            } else {
                setMessage({ type: 'error', text: videoRes.message || offersRes.message || t(tx('Failed to update', 'فشل التحديث')) });
            }
        } catch (error) {
            setMessage({ type: 'error', text: t(tx('An error occurred', 'حدث خطأ')) });
        } finally {
            setSaving(false);
        }
    };

    const addOffer = () => {
        setOffers((prev) => [
            ...prev,
            {
                id: `offer-${Date.now()}`,
                titleEn: '',
                titleAr: '',
                discountPercent: 0,
                url: '/shop',
                categorySlug: '',
                brandSlug: '',
                productIds: '',
                isActive: true
            }
        ]);
    };

    const updateOffer = (id, key, value) => {
        setOffers((prev) => prev.map((o) => (o.id === id ? { ...o, [key]: value } : o)));
    };

    const removeOffer = (id) => {
        setOffers((prev) => prev.filter((o) => o.id !== id));
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                <p className="text-gray-500 font-medium tracking-wide">{t(tx('Retrieving homepage configuration...', 'جاري تحميل إعدادات الصفحة الرئيسية...'))}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{t(tx('Homepage Settings', 'إعدادات الصفحة الرئيسية'))}</h1>
                    <p className="text-gray-500 mt-1 text-base">{t(tx('Customize the Hero section and main media for Home2 (NEXT)', 'تخصيص قسم الهيرو والوسائط الرئيسية لصفحة Home2 (NEXT)'))}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-300">
                        <div className="bg-linear-to-r from-indigo-600 to-blue-700 px-8 py-6">
                            <div className="flex items-center gap-3 text-white">
                                <Video size={28} className="animate-pulse" />
                                <h2 className="text-xl font-bold tracking-wide">{t(tx('Hero Video Content', 'محتوى فيديو الهيرو'))}</h2>
                            </div>
                        </div>

                        <div className="p-8">
                            <form onSubmit={handleSave} className="space-y-8">
                                <div className="space-y-4">
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-widest">
                                        {t(tx('Hero Video URL', 'رابط فيديو الهيرو'))}
                                        <Info size={14} className="text-blue-500 cursor-help" />
                                    </label>

                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Play size={20} className="text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                                        </div>
                                        <input
                                            type="url"
                                            value={videoUrl}
                                            onChange={(e) => setVideoUrl(e.target.value)}
                                            placeholder={t(tx('https://example.com/video.mp4', 'https://example.com/video.mp4'))}
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-base font-medium text-gray-800"
                                            required
                                        />
                                    </div>

                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
                                        <Info size={20} className="text-blue-500 shrink-0 mt-0.5" />
                                        <div className="text-sm text-blue-700 space-y-1">
                                            <p className="font-semibold italic">{t(tx('Pro Tip:', 'نصيحة:'))}</p>
                                            <p>{t(tx('Use a direct link to a video file (.mp4, .webm). Recommended resolution is HD (1920x1080) with a reasonable file size for faster loading.', 'استخدم رابطًا مباشرًا لملف فيديو (.mp4 أو .webm). الدقة الموصى بها HD (1920x1080) وحجم ملف مناسب لسرعة التحميل.'))}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-gray-100">
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-sm font-bold text-gray-700 uppercase tracking-widest">
                                            {t(tx('Top Header Offers', 'عروض أعلى الهيدر'))}
                                        </label>
                                        <button
                                            type="button"
                                            onClick={addOffer}
                                            className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                                        >
                                            {t(tx('Add Offer', 'إضافة عرض'))}
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {offers.length === 0 && (
                                            <p className="text-sm text-gray-500">{t(tx('No offers added yet.', 'لا توجد عروض مضافة بعد.'))}</p>
                                        )}
                                        {offers.map((offer, idx) => (
                                            <div key={offer.id} className="p-3 rounded-xl border border-gray-200 bg-gray-50/70 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs font-semibold text-gray-600">#{idx + 1}</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeOffer(offer.id)}
                                                        className="text-xs text-red-600 hover:text-red-700"
                                                    >
                                                        {t(tx('Remove', 'حذف'))}
                                                    </button>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={offer.titleEn}
                                                    onChange={(e) => updateOffer(offer.id, 'titleEn', e.target.value)}
                                                    placeholder={t(tx('Offer text (English)', 'نص العرض (إنجليزي)'))}
                                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white"
                                                />
                                                <input
                                                    type="text"
                                                    dir="rtl"
                                                    value={offer.titleAr}
                                                    onChange={(e) => updateOffer(offer.id, 'titleAr', e.target.value)}
                                                    placeholder={t(tx('Offer text (Arabic)', 'نص العرض (عربي)'))}
                                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white"
                                                />
                                                <p className="text-xs text-gray-500">
                                                    {t(tx('Link is automatic: /shop', 'الرابط تلقائي: /shop'))}
                                                </p>
                                                <input
                                                    type="text"
                                                    value={offer.categorySlug}
                                                    onChange={(e) => updateOffer(offer.id, 'categorySlug', e.target.value)}
                                                    placeholder={t(tx('categorySlug (optional) e.g. accessories', 'categorySlug (اختياري) مثال accessories'))}
                                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white"
                                                />
                                                <input
                                                    type="text"
                                                    value={offer.brandSlug}
                                                    onChange={(e) => updateOffer(offer.id, 'brandSlug', e.target.value)}
                                                    placeholder={t(tx('brandSlug (optional) e.g. nike', 'brandSlug (اختياري) مثال nike'))}
                                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white"
                                                />
                                                <p className="text-xs text-gray-500">
                                                    {t(tx('Products are attached from Product form by selecting offer name.', 'المنتجات تُربط من صفحة المنتج عن طريق اختيار اسم العرض.'))}
                                                </p>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                    value={offer.discountPercent}
                                                    onChange={(e) => updateOffer(offer.id, 'discountPercent', e.target.value)}
                                                    placeholder={t(tx('Discount % (e.g. 50)', 'نسبة الخصم % (مثال 50)'))}
                                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white"
                                                />
                                                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                                    <input
                                                        type="checkbox"
                                                        checked={offer.isActive}
                                                        onChange={(e) => updateOffer(offer.id, 'isActive', e.target.checked)}
                                                    />
                                                    {t(tx('Active', 'نشط'))}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {message && (
                                    <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                                        }`}>
                                        {message.type === 'success' ? <CheckCircle2 size={20} /> : <Info size={20} />}
                                        <span className="font-semibold">{message.text}</span>
                                    </div>
                                )}

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="w-full sm:w-auto flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-10 rounded-xl transition-all shadow-lg hover:shadow-slate-200 active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <Loader2 className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Save size={20} />
                                        )}
                                        {saving ? t(tx('Updating System...', 'جاري التحديث...')) : t(tx('Update Hero Video', 'تحديث فيديو الهيرو'))}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Preview Section */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-gray-900 uppercase tracking-wider text-sm italic">{t(tx('Live Preview', 'معاينة مباشرة'))}</h3>
                            {videoUrl && (
                                <a
                                    href={videoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:text-blue-700 p-1 rounded-lg hover:bg-blue-50 transition-colors"
                                    title={t(tx('Open video in new tab', 'فتح الفيديو في تبويب جديد'))}
                                >
                                    <ExternalLink size={18} />
                                </a>
                            )}
                        </div>

                        <div className="aspect-9/16 md:aspect-video rounded-xl bg-slate-900 overflow-hidden relative shadow-inner group">
                            {videoUrl ? (
                                <video
                                    key={videoUrl}
                                    src={videoUrl}
                                    className="w-full h-full object-cover"
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-6 text-center">
                                    <Video size={48} className="mb-4 opacity-20" />
                                    <p className="text-sm font-medium">{t(tx('Add a URL to see a preview of how the video appears to customers.', 'أضف رابطًا لمعاينة شكل الفيديو كما يظهر للعملاء.'))}</p>
                                </div>
                            )}

                            {/* Overlay simulator */}
                            <div className="absolute inset-0 bg-black/30 pointer-events-none flex items-center justify-center p-4">
                                <div className="text-center opacity-60">
                                    <div className="h-4 w-32 bg-white/20 rounded-full mx-auto mb-2" />
                                    <div className="h-2 w-48 bg-white/10 rounded-full mx-auto" />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-50">
                            <h4 className="font-bold text-sm text-gray-700 mb-2">{t(tx('Technical Specs', 'المواصفات الفنية'))}</h4>
                            <ul className="text-xs text-gray-500 space-y-2">
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                                    <span>{t(tx('Format: MP4, WebM, or AV1', 'الصيغة: MP4 أو WebM أو AV1'))}</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                                    <span>{t(tx('Ratio: 16:9 recommended', 'النسبة: يوصى بـ 16:9'))}</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                                    <span>{t(tx('Sound: Muted by default', 'الصوت: مكتوم افتراضيًا'))}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeSettings;
