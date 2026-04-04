import { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { fetchStaticPage } from '../api/staticPages';
import { submitContactMessage } from '../api/contact';
import { SLUGS } from '../config/slugs';

// Contact page that can be fully replaced by CMS data
const Contact = () => {
  const { language, t } = useLanguage();
  const isRTL = language === 'ar';

  // CMS-driven content for the page (title + content variants)
  const [cmsContent, setCmsContent] = useState(null);
  const [cmsLoading, setCmsLoading] = useState(true);
  const [cmsError, setCmsError] = useState(null);

  // Form state (unchanged behavior)
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  // Load CMS content for the contact page
  useEffect(() => {
    let mounted = true;
    const loadCms = async () => {
      try {
        const resp = await fetchStaticPage(SLUGS.CONTACT);
        if (resp && resp.success && mounted) {
          setCmsContent(resp.data);
        } else if (mounted) {
          setCmsError('CMS content unavailable');
        }
      } catch {
        if (mounted) setCmsError('CMS fetch failed');
      } finally {
        if (mounted) setCmsLoading(false);
      }
    };
    loadCms();
    return () => { mounted = false; };
  }, []);

  // Helpers to pick the right CMS content portion
  const cmsTitle = cmsContent?.title ?? (t('contact.heading') ?? 'Contact Us');
  const cmsBody = cmsContent
    ? (language === 'ar' ? cmsContent.contentAr ?? cmsContent.content : cmsContent.contentEn ?? cmsContent.content)
    : null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: '', message: '' });
    try {
      // Here you would call your existing API to submit, e.g. submitContactMessage(formData)
      setStatus({ type: 'success', message: t('contact.success') || 'Thank you for your message! We will get back to you soon.' });
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setStatus({ type: 'error', message: (err?.message && t('contact.error')) || 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 md:px-10 lg:px-20 py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">{cmsTitle}</h1>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            {cmsLoading ? (
              <span>Loading content...</span>
            ) : cmsBody ? (
              <div dangerouslySetInnerHTML={{ __html: cmsBody }} />
            ) : (
              // Fallback, static left column when CMS data is not available
              <>
                <section>
                  <h2 className="text-xl font-semibold mb-2">{t('contact.getInTouch') || 'Get in Touch'}</h2>
                  <p className="text-gray-700 mb-4">{t('contact.fallbackText') || 'We would love to hear from you. Send us a message and we will respond as soon as possible.'}</p>
                </section>
                <section>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-semibold">Email:</span>
                    <span>info@kidsandco.com</span>
                  </div>
                </section>
              </>
            )}
          </div>
          <div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {status.message && (
                <div className={`p-4 rounded-lg ${status.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  {status.message}
                </div>
              )}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">{t('contact.name') || 'Name'}</label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"/>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">{t('contact.email') || 'Email'}</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"/>
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">{t('contact.subject') || 'Subject'}</label>
                <input type="text" id="subject" name="subject" value={formData.subject} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"/>
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">{t('contact.message') || 'Message'}</label>
                <textarea id="message" name="message" value={formData.message} onChange={handleChange} required rows="5" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"/>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors">{isSubmitting ? (t('contact.sending') || 'Sending...') : (t('contact.send') || 'Send Message')}</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
