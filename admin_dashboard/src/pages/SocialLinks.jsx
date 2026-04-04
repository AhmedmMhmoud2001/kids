import React, { useState, useEffect } from 'react';
import { Save, Share2, Facebook, Instagram, CheckCircle2, Info } from 'lucide-react';
import { getSocialLinks, updateSocialLinks } from '../api/settings';
import { useLanguage } from '../context/LanguageContext';
import { tx } from '../i18n/text';

const SocialLinks = () => {
    const { t } = useLanguage();
    const [facebookUrl, setFacebookUrl] = useState('');
    const [instagramUrl, setInstagramUrl] = useState('');
    const [twitterUrl, setTwitterUrl] = useState('');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const data = await getSocialLinks();
            setFacebookUrl(data.facebook || '');
            setInstagramUrl(data.instagram || '');
            setTwitterUrl(data.twitter || '');
            setYoutubeUrl(data.youtube || '');
        } catch (error) {
            console.error('Error loading social links:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setMessage(null);
            const res = await updateSocialLinks({
                facebook: facebookUrl.trim(),
                instagram: instagramUrl.trim(),
                twitter: twitterUrl.trim(),
                youtube: youtubeUrl.trim()
            });
            if (res.success) {
                setMessage({ type: 'success', text: t(tx('Social links updated successfully!', 'تم تحديث روابط التواصل الاجتماعي بنجاح!')) });
                setTimeout(() => setMessage(null), 3000);
            } else {
                setMessage({ type: 'error', text: res.message || t(tx('Failed to update', 'فشل التحديث')) });
            }
        } catch (error) {
            setMessage({ type: 'error', text: error?.message || t(tx('Failed to update social links', 'فشل تحديث روابط التواصل الاجتماعي')) });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-center text-gray-500">{t(tx('Loading social links...', 'جاري تحميل روابط التواصل...'))}</div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{t(tx('Social Links', 'روابط التواصل الاجتماعي'))}</h1>
                <p className="text-gray-500 mt-1 text-base">
                    {t(tx('Add your social media URLs. They appear in the store footer. Leave empty to hide a link.', 'أضف روابط وسائل التواصل الاجتماعي. ستظهر في تذييل المتجر. اترك الحقل فارغًا لإخفاء الرابط.'))}
                </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-linear-to-r from-blue-600 to-indigo-700 px-8 py-6">
                    <div className="flex items-center gap-3 text-white">
                        <Share2 size={28} />
                        <h2 className="text-xl font-bold">{t(tx('Social Links', 'روابط التواصل الاجتماعي'))}</h2>
                    </div>
                </div>

                <div className="p-8">
                    <form onSubmit={handleSave} className="space-y-8">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                                <Facebook size={18} className="text-[#1877f2]" />
                                {t(tx('Facebook Page URL', 'رابط صفحة فيسبوك'))}
                            </label>
                            <input
                                type="url"
                                value={facebookUrl}
                                onChange={(e) => setFacebookUrl(e.target.value)}
                                placeholder={t(tx('https://www.facebook.com/yourpage', 'https://www.facebook.com/yourpage'))}
                                className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-gray-800"
                            />
                            <p className="mt-2 text-sm text-gray-400 flex items-center gap-1">
                                <Info size={14} />
                                {t(tx('Full URL to your Facebook page (e.g. https://www.facebook.com/YourPage)', 'الرابط الكامل لصفحة فيسبوك (مثال: https://www.facebook.com/YourPage)'))}
                            </p>
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                                <Instagram size={18} className="text-[#e4405f]" />
                                {t(tx('Instagram Page URL', 'رابط صفحة إنستجرام'))}
                            </label>
                            <input
                                type="url"
                                value={instagramUrl}
                                onChange={(e) => setInstagramUrl(e.target.value)}
                                placeholder={t(tx('https://www.instagram.com/yourpage', 'https://www.instagram.com/yourpage'))}
                                className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-gray-800"
                            />
                            <p className="mt-2 text-sm text-gray-400 flex items-center gap-1">
                                <Info size={14} />
                                {t(tx('Full URL to your Instagram profile (e.g. https://www.instagram.com/YourPage)', 'الرابط الكامل لحساب إنستجرام (مثال: https://www.instagram.com/YourPage)'))}
                            </p>
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                                {t(tx('Twitter / X URL', 'رابط تويتر / X'))}
                            </label>
                            <input
                                type="url"
                                value={twitterUrl}
                                onChange={(e) => setTwitterUrl(e.target.value)}
                                placeholder={t(tx('https://twitter.com/yourpage or https://x.com/yourpage', 'https://twitter.com/yourpage أو https://x.com/yourpage'))}
                                className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-gray-800"
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                                {t(tx('YouTube Channel URL', 'رابط قناة يوتيوب'))}
                            </label>
                            <input
                                type="url"
                                value={youtubeUrl}
                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                placeholder={t(tx('https://www.youtube.com/@yourchannel', 'https://www.youtube.com/@yourchannel'))}
                                className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-gray-800"
                            />
                        </div>

                        {message && (
                            <div
                                className={`p-4 rounded-xl flex items-center gap-3 ${
                                    message.type === 'success'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                        : 'bg-red-50 text-red-700 border border-red-100'
                                }`}
                            >
                                {message.type === 'success' ? <CheckCircle2 size={20} /> : <Info size={20} />}
                                <span className="font-semibold">{message.text}</span>
                            </div>
                        )}

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-10 rounded-xl transition-all shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-50"
                            >
                                {saving ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Save size={20} />
                                )}
                                {saving ? t(tx('Saving...', 'جاري الحفظ...')) : t(tx('Save Social Links', 'حفظ روابط التواصل'))}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SocialLinks;
