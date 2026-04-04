import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import staticPagesApi from '../api/staticPages';
import { useLanguage } from '../context/LanguageContext';
import { tx } from '../i18n/text';

const StaticPages = () => {
    const { language, t } = useLanguage();
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPage, setSelectedPage] = useState(null);
    const [contentEn, setContentEn] = useState('');
    const [contentAr, setContentAr] = useState('');
    const [editorLanguage, setEditorLanguage] = useState('en');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        loadPages();
    }, []);

    const loadPages = async () => {
        try {
            setLoading(true);
            const response = await staticPagesApi.getAll();
            if (response.success) {
                // Filter out Contact Us as requested
                const filteredPages = response.data.filter(page => page.slug !== 'contact-us');
                setPages(filteredPages);
                if (filteredPages.length > 0) {
                    setSelectedPage(filteredPages[0]);
                    setContentEn(filteredPages[0].contentEn || filteredPages[0].content || '');
                    setContentAr(filteredPages[0].contentAr || '');
                }
            } else {
                setError(t(tx('Failed to load static pages', 'فشل تحميل الصفحات الثابتة')));
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePageSelect = (page) => {
        setSelectedPage(page);
        setContentEn(page.contentEn || page.content || '');
        setContentAr(page.contentAr || '');
        setMessage(null);
    };

    const handleSave = async () => {
        if (!selectedPage) return;
        try {
            setSaving(true);
            setMessage(null);
            const response = await staticPagesApi.update(selectedPage.id, { 
                contentEn,
                contentAr
            });
            if (response.success) {
                setPages(pages.map(p => p.id === selectedPage.id ? response.data : p));
                setMessage({ type: 'success', text: t(tx('Page content updated successfully', 'تم تحديث محتوى الصفحة بنجاح')) });
            } else {
                setMessage({ type: 'error', text: response.message || t(tx('Failed to update content', 'فشل تحديث المحتوى')) });
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleEditorLanguageChange = (lang) => {
        setEditorLanguage(lang);
    };

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'image'],
            ['clean']
        ],
    };

    const currentContent = editorLanguage === 'en' ? contentEn : contentAr;
    const setCurrentContent = editorLanguage === 'en' ? setContentEn : setContentAr;

    if (loading) return <div className="p-4 text-center">{t(tx('Loading pages...', 'جاري تحميل الصفحات...'))}</div>;
    if (error) return <div className="p-4 text-center text-red-600">{t(tx('Error', 'خطأ'))}: {error}</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">{t(tx('Static Pages', 'الصفحات الثابتة'))}</h1>
                <p className="text-gray-600 mt-1">{t(tx('Manage content for About Us, FAQs, and Delivery & Return', 'إدارة محتوى من نحن والأسئلة الشائعة وسياسة الشحن والاسترجاع'))}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar - Page List */}
                <div className="lg:col-span-1 space-y-2">
                    {pages.map((page) => (
                        <button
                            key={page.id}
                            onClick={() => handlePageSelect(page)}
                            className={`w-full text-left px-4 py-3 rounded-lg transition-colors font-medium ${selectedPage?.id === page.id
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                }`}
                        >
                            {page.title}
                        </button>
                    ))}
                </div>

                {/* Main Content - Editor */}
                <div className="lg:col-span-3">
                    {selectedPage ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
                                <h2 className="font-bold text-lg text-gray-900">{selectedPage.title}</h2>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-semibold"
                                >
                                    {saving ? t(tx('Saving...', 'جاري الحفظ...')) : (
                                        <>
                                            <Save size={20} />
                                            {t(tx('Save Changes', 'حفظ التغييرات'))}
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Language Toggle */}
                            <div className="px-4 py-3 bg-gray-100 border-b flex items-center gap-4">
                                <span className="text-sm font-medium text-gray-700">{t(tx('Edit Language:', 'تعديل اللغة:'))}</span>
                                <div className="flex rounded-lg overflow-hidden border border-gray-300">
                                    <button
                                        onClick={() => handleEditorLanguageChange('en')}
                                        className={`px-4 py-1.5 text-sm font-medium transition-colors ${editorLanguage === 'en' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                    >
                                        English
                                    </button>
                                    <button
                                        onClick={() => handleEditorLanguageChange('ar')}
                                        className={`px-4 py-1.5 text-sm font-medium transition-colors ${editorLanguage === 'ar' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                    >
                                        العربية
                                    </button>
                                </div>
                                <span className="text-xs text-gray-500 ml-auto">
                                    {editorLanguage === 'en' ? t(tx('Currently editing English content', 'جارٍ تعديل المحتوى الإنجليزي')) : t(tx('Currently editing Arabic content', 'جارٍ تعديل المحتوى العربي'))}
                                </span>
                            </div>

                            {message && (
                                <div className={`p-4 mx-4 mt-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                                    }`}>
                                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                    {message.text}
                                </div>
                            )}

                            <div className="p-6">
                                <div className="bg-white h-[500px] mb-12">
                                    <ReactQuill
                                        theme="snow"
                                        value={currentContent}
                                        onChange={setCurrentContent}
                                        modules={modules}
                                        className="h-full"
                                        placeholder={editorLanguage === 'en' ? t(tx('Start typing your content here...', 'ابدأ كتابة المحتوى هنا...')) : t(tx('ابدأ كتابة المحتوى هنا...', 'ابدأ كتابة المحتوى هنا...'))}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl p-12 text-center text-gray-500 border border-dashed border-gray-300">
                            {t(tx('Select a page from the list to edit its content', 'اختر صفحة من القائمة لتعديل محتواها'))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StaticPages;
