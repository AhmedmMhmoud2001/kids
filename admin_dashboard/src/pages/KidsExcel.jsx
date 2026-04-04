import React, { useState } from 'react';
import { Download, FileSpreadsheet, Upload, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { downloadKidsExport, downloadKidsTemplate, importKidsExcel } from '../api/products';
import { useLanguage } from '../context/LanguageContext';
import { tx } from '../i18n/text';

const KidsExcel = () => {
    const { t } = useLanguage();
    const [exportLoading, setExportLoading] = useState(false);
    const [templateLoading, setTemplateLoading] = useState(false);
    const [importLoading, setImportLoading] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importResult, setImportResult] = useState(null);
    const [importError, setImportError] = useState(null);

    const handleDownloadExport = async () => {
        setExportLoading(true);
        setImportResult(null);
        setImportError(null);
        try {
            await downloadKidsExport();
        } catch (err) {
            setImportError(err.message || t(tx('Failed to download export', 'فشل تنزيل ملف التصدير')));
        } finally {
            setExportLoading(false);
        }
    };

    const handleDownloadTemplate = async () => {
        setTemplateLoading(true);
        setImportResult(null);
        setImportError(null);
        try {
            await downloadKidsTemplate();
        } catch (err) {
            setImportError(err.message || t(tx('Failed to download template', 'فشل تنزيل القالب')));
        } finally {
            setTemplateLoading(false);
        }
    };

    const handleImport = async () => {
        if (!importFile) {
            setImportError(t(tx('Please select an Excel file', 'يرجى اختيار ملف Excel')));
            return;
        }
        setImportLoading(true);
        setImportResult(null);
        setImportError(null);
        try {
            const res = await importKidsExcel(importFile);
            const data = res.data || res;
            const created = data.created ?? {};
            const updated = data.updated ?? {};
            setImportResult({
                createdProducts: (created.products ?? []).length,
                createdVariants: (created.variants ?? []).length,
                updatedVariants: (updated.variants ?? []).length,
                skipped: data.skipped ?? 0,
                errors: data.errors ?? []
            });
            setImportFile(null);
        } catch (err) {
            setImportError(err.message || t(tx('Failed to import Excel', 'فشل استيراد ملف Excel')));
        } finally {
            setImportLoading(false);
        }
    };

    const blockClass = 'bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm';
    const btnClass = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50';

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <FileSpreadsheet className="w-8 h-8 text-blue-500" />
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t(tx('Excel (Kids)', 'إكسيل (كيدز)'))}</h1>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">{t(tx('Export, template, and import Kids products from Excel.', 'تصدير وتنزيل القالب واستيراد منتجات كيدز من Excel.'))}</p>
                </div>
            </div>

            {importError && (
                <div className="mb-6 flex items-center gap-2 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
                    <AlertCircle size={20} />
                    <span>{importError}</span>
                </div>
            )}

            {importResult && (
                <div className="mb-6 p-5 rounded-xl border border-emerald-100 bg-emerald-50/50 dark:bg-emerald-900/10 dark:border-emerald-900/20">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold mb-3 text-lg">
                        <CheckCircle size={22} />
                        {t(tx('Import completed', 'تم الاستيراد بنجاح'))}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">{t(tx('Created Products', 'منتجات تم إنشاؤها'))}</p>
                            <p className="text-xl font-black text-blue-600 dark:text-blue-400">{importResult.createdProducts}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">{t(tx('Created Variants', 'متغيرات تم إنشاؤها'))}</p>
                            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{importResult.createdVariants}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">{t(tx('Updated Variants', 'متغيرات تم تحديثها'))}</p>
                            <p className="text-xl font-black text-amber-600 dark:text-amber-400">{importResult.updatedVariants}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">{t(tx('Skipped', 'تم التخطي'))}</p>
                            <p className="text-xl font-black text-slate-600 dark:text-slate-400">{importResult.skipped}</p>
                        </div>
                    </div>

                    {importResult.errors?.length > 0 && (
                        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30">
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold mb-1">
                                <AlertCircle size={18} />
                                {t(tx('Issues Detected', 'تم اكتشاف مشاكل'))}
                            </div>
                            <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                                {t(tx(`${importResult.errors.length} row(s) failed or had validation errors. Please check your data and try again.`, `فشل ${importResult.errors.length} صف(صفوف) أو يحتوي على أخطاء تحقق. يرجى مراجعة البيانات والمحاولة مرة أخرى.`))}
                            </p>
                        </div>
                    )}
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-1">
                <div className={blockClass}>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{t(tx('Download Export', 'تنزيل التصدير'))}</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{t(tx('Download all Kids products as an Excel file (one row per variant).', 'تنزيل كل منتجات كيدز كملف Excel (صف لكل متغير).'))}</p>
                    <button
                        type="button"
                        onClick={handleDownloadExport}
                        disabled={exportLoading}
                        className={`${btnClass} bg-blue-600 text-white hover:bg-blue-700`}
                    >
                        {exportLoading ? <Loader size={18} className="animate-spin" /> : <Download size={18} />}
                        {exportLoading ? t(tx('Downloading...', 'جاري التنزيل...')) : t(tx('Download Export', 'تنزيل التصدير'))}
                    </button>
                </div>

                <div className={blockClass}>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{t(tx('Download Template', 'تنزيل القالب'))}</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{t(tx('Download an Excel template with headers and one example row for importing.', 'تنزيل قالب Excel يحتوي على الأعمدة وصف مثال للاستيراد.'))}</p>
                    <button
                        type="button"
                        onClick={handleDownloadTemplate}
                        disabled={templateLoading}
                        className={`${btnClass} bg-slate-600 text-white hover:bg-slate-700 dark:bg-slate-500 dark:hover:bg-slate-600`}
                    >
                        {templateLoading ? <Loader size={18} className="animate-spin" /> : <Download size={18} />}
                        {templateLoading ? t(tx('Downloading...', 'جاري التنزيل...')) : t(tx('Download Template', 'تنزيل القالب'))}
                    </button>
                </div>

                <div className={blockClass}>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{t(tx('Import from Excel', 'الاستيراد من Excel'))}</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{t(tx('Upload an Excel file (.xlsx or .xls) to create Kids products. Use the template for the correct columns.', 'ارفع ملف Excel (.xlsx أو .xls) لإنشاء منتجات كيدز. استخدم القالب للأعمدة الصحيحة.'))}</p>
                    <div className="flex flex-wrap items-center gap-3">
                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={(e) => {
                                setImportFile(e.target.files?.[0] || null);
                                setImportResult(null);
                                setImportError(null);
                            }}
                            className="text-sm text-slate-600 dark:text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-100 dark:file:bg-slate-700 file:text-slate-700 dark:file:text-slate-200"
                        />
                        <button
                            type="button"
                            onClick={handleImport}
                            disabled={importLoading || !importFile}
                            className={`${btnClass} bg-emerald-600 text-white hover:bg-emerald-700`}
                        >
                            {importLoading ? <Loader size={18} className="animate-spin" /> : <Upload size={18} />}
                            {importLoading ? t(tx('Importing...', 'جاري الاستيراد...')) : t(tx('Import', 'استيراد'))}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KidsExcel;
