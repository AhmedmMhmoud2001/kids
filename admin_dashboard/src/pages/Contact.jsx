import { useEffect, useState } from 'react';
import { Mail, Trash2, Eye, X, User, Calendar, MessageSquare } from 'lucide-react';
import { fetchContactMessages, deleteContactMessage } from '../api/contact';
import { useLanguage } from '../context/LanguageContext';
import { tx } from '../i18n/text';

const ContactMessages = () => {
    const { t } = useLanguage();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedMessage, setSelectedMessage] = useState(null);

    const loadMessages = async () => {
        try {
            setLoading(true);
            const res = await fetchContactMessages();
            if (res.success) {
                setMessages(res.data);
            }
        } catch (err) {
            console.error('Failed to load messages:', err);
            setError(t(tx('Failed to load messages', 'فشل تحميل الرسائل')));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMessages();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm(t(tx('Are you sure you want to delete this message?', 'هل أنت متأكد من حذف هذه الرسالة؟')))) return;
        try {
            const res = await deleteContactMessage(id);
            if (res.success) {
                setMessages(messages.filter((m) => m.id !== id));
                if (selectedMessage?.id === id) setSelectedMessage(null);
            }
        } catch (err) {
            console.error('Failed to delete message:', err);
            alert(t(tx('Failed to delete message', 'فشل حذف الرسالة')));
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
                {t(tx('Loading messages...', 'جاري تحميل الرسائل...'))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 leading-tight flex items-center gap-2">
                        <Mail className="text-blue-600" size={28} />
                        {t(tx('Contact Messages', 'رسائل التواصل'))}
                    </h1>
                    <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1">
                        {t(tx('View and manage customer inquiries', 'عرض وإدارة استفسارات العملاء'))}
                    </p>
                </div>
                <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-bold">
                    {messages.length} {t(tx('Messages', 'رسائل'))}
                </div>
            </div>

            {messages.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <MessageSquare className="mx-auto text-gray-300 mb-4" size={48} />
                    <h3 className="text-lg font-bold text-gray-900">{t(tx('No messages yet', 'لا توجد رسائل حتى الآن'))}</h3>
                    <p className="text-gray-500">{t(tx('Customer messages will appear here', 'ستظهر رسائل العملاء هنا'))}</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 -mx-3 sm:mx-0">
                    {/* Mobile hint */}
                    <div className="sm:hidden px-3 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-600 font-medium flex items-center justify-center gap-2">
                        <span>←</span> {t(tx('Swipe to see more', 'اسحب لرؤية المزيد'))} <span>→</span>
                    </div>
                    <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                        <table className="w-full" style={{ minWidth: '700px' }}>
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-4 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        {t(tx('Sender', 'المرسل'))}
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        {t(tx('Subject', 'الموضوع'))}
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        {t(tx('Message', 'الرسالة'))}
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        {t(tx('Date', 'التاريخ'))}
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-center text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        {t(tx('Actions', 'الإجراءات'))}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {messages.map((msg) => (
                                    <tr key={msg.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                                                    {msg.name?.[0]?.toUpperCase() || 'U'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">{msg.name}</p>
                                                    <p className="text-xs text-gray-500 truncate">{msg.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                                            <p className="text-sm text-gray-800 font-medium truncate max-w-[150px]">{msg.subject}</p>
                                        </td>
                                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                                            <p className="text-sm text-gray-600 truncate max-w-[200px]">{msg.message}</p>
                                        </td>
                                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs text-gray-500 whitespace-nowrap">
                                            {new Date(msg.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => setSelectedMessage(msg)}
                                                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                                                >
                                                    <Eye size={14} />
                                                    {t(tx('View', 'عرض'))}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(msg.id)}
                                                    className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-800 font-medium bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                    {t(tx('Delete', 'حذف'))}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Message Detail Modal */}
            {selectedMessage && (
                <div 
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
                    style={{ zIndex: 99999 }}
                    onClick={() => setSelectedMessage(null)}
                >
                    <div 
                        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-linear-to-r from-blue-50 to-purple-50">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                    {selectedMessage.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{t(tx('Message Details', 'تفاصيل الرسالة'))}</h3>
                                    <p className="text-sm text-gray-500">{t(tx('From customer inquiry', 'من استفسار عميل'))}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedMessage(null)}
                                className="p-2 hover:bg-white/80 rounded-full transition-colors"
                            >
                                <X size={24} className="text-gray-400" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 sm:p-6 space-y-5">
                            {/* Sender Info */}
                            <div className="flex items-start gap-3">
                                <User size={18} className="text-gray-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t(tx('From', 'من'))}</p>
                                    <p className="text-sm font-medium text-gray-900">{selectedMessage.name}</p>
                                    <p className="text-sm text-blue-600">{selectedMessage.email}</p>
                                </div>
                            </div>

                            {/* Subject */}
                            <div className="flex items-start gap-3">
                                <Mail size={18} className="text-gray-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t(tx('Subject', 'الموضوع'))}</p>
                                    <p className="text-sm font-medium text-gray-900">{selectedMessage.subject}</p>
                                </div>
                            </div>

                            {/* Message */}
                            <div className="flex items-start gap-3">
                                <MessageSquare size={18} className="text-gray-400 mt-0.5 shrink-0" />
                                <div className="flex-1">
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t(tx('Message', 'الرسالة'))}</p>
                                    <div className="mt-2 bg-gray-50 p-4 rounded-xl text-sm text-gray-700 whitespace-pre-wrap leading-relaxed border border-gray-100">
                                        {selectedMessage.message}
                                    </div>
                                </div>
                            </div>

                            {/* Date */}
                            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                                <Calendar size={16} className="text-gray-400" />
                                <p className="text-xs text-gray-500">
                                    {t(tx('Received:', 'تم الاستلام:'))} {new Date(selectedMessage.createdAt).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                            <button
                                onClick={() => setSelectedMessage(null)}
                                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                {t(tx('Close', 'إغلاق'))}
                            </button>
                            <button
                                onClick={() => handleDelete(selectedMessage.id)}
                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
                            >
                                <Trash2 size={16} />
                                {t(tx('Delete Message', 'حذف الرسالة'))}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContactMessages;
