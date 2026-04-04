import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import facebookIcon from '../../assets/logos_facebook.webp';
import instagramIcon from '../../assets/skill-icons_instagram.webp';
import logo from '../../assets/logo.webp';
import { getSocialLinks } from '../../api/settings';
import { useLanguage } from '../../context/LanguageContext';

const Footer = () => {
  const [socialLinks, setSocialLinks] = useState({ facebook: '', instagram: '', twitter: '', youtube: '' });
  const { t } = useLanguage();

  useEffect(() => {
    getSocialLinks().then(setSocialLinks);
  }, []);

  const hasAnySocial = socialLinks.facebook || socialLinks.instagram || socialLinks.twitter || socialLinks.youtube;

  return (
    <footer className="bg-gray-50 mt-8 lg:mt-16">
      <div className="container mx-auto py-16 text-sm px-4 sm:px-6 md:px-10 lg:px-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Logo and Description */}
          <div className="space-y-4 text-center md:text-left">
            <img src={logo} alt="Logo" className="" />
            <p className="text-sm text-gray-600 leading-relaxed max-w-sm mx-auto md:mx-0">
              {t('footer.description')}
            </p>
            {/* Social Media Icons — من الباكند (Social Links) */}
            {hasAnySocial && (
              <div className="flex gap-4 justify-center md:justify-start">
                {socialLinks.facebook && (
                  <a
                    href={socialLinks.facebook.startsWith('http') ? socialLinks.facebook : `https://${socialLinks.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-70 transition-opacity"
                    aria-label="Facebook"
                  >
                    <img src={facebookIcon} alt="Facebook" className="w-8 h-8" />
                  </a>
                )}
                {socialLinks.instagram && (
                  <a
                    href={socialLinks.instagram.startsWith('http') ? socialLinks.instagram : `https://${socialLinks.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-70 transition-opacity"
                    aria-label="Instagram"
                  >
                    <img src={instagramIcon} alt="Instagram" className="w-8 h-8" />
                  </a>
                )}
                {socialLinks.twitter && (
                  <a
                    href={socialLinks.twitter.startsWith('http') ? socialLinks.twitter : `https://${socialLinks.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-70 transition-opacity text-gray-600 hover:text-gray-900"
                    aria-label="Twitter"
                  >
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                  </a>
                )}
                {socialLinks.youtube && (
                  <a
                    href={socialLinks.youtube.startsWith('http') ? socialLinks.youtube : `https://${socialLinks.youtube}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-70 transition-opacity text-gray-600 hover:text-red-600"
                    aria-label="YouTube"
                  >
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Links - Hidden on small mobile, shown from md */}
          <div className="hidden md:block">
            <h3 className="font-semibold text-gray-900 mb-4 text-base lg:text-lg">{t('footer.links')}</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li><Link to="/about" className="hover:text-gray-900 transition-colors">{t('footer.aboutUs')}</Link></li>
              <li><Link to="/faqs" className="hover:text-gray-900 transition-colors">{t('footer.faqs')}</Link></li>
              <li><Link to="/contact" className="hover:text-gray-900 transition-colors">{t('footer.contactUs')}</Link></li>
              <li><Link to="/delivery" className="hover:text-gray-900 transition-colors">{t('footer.deliveryAndReturn')}</Link></li>
              <li><Link to="/brands" className="hover:text-gray-900 transition-colors">{t('footer.ourBrands')}</Link></li>
            </ul>
          </div>

          {/* Ship to */}
          <div className="text-center md:text-left">
            <h3 className="font-semibold text-gray-900 mb-4 text-base lg:text-lg">{t('footer.shipTo')}</h3>
            <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mx-auto md:mx-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{t('footer.egypt')}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile-only Links Section */}
        <div className="md:hidden mt-8 pt-8 border-t">
          <div className="grid grid-cols-2 gap-4 text-center">
            <Link to="/about" className="text-sm text-gray-600 hover:text-gray-900 py-2">{t('footer.aboutUs')}</Link>
            <Link to="/faqs" className="text-sm text-gray-600 hover:text-gray-900 py-2">{t('footer.faqs')}</Link>
            <Link to="/contact" className="text-sm text-gray-600 hover:text-gray-900 py-2">{t('footer.contactUs')}</Link>
            <Link to="/delivery" className="text-sm text-gray-600 hover:text-gray-900 py-2">{t('footer.delivery')}</Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t mt-8 pt-6 pb-16 lg:pb-0 text-center">
          <p className="text-xs lg:text-sm text-gray-600">
            {t('footer.allRightsReserved')} © {t('footer.designedBy')}{' '}
            <a
              href="https://www.qeematech.net/"
              rel="dofollow"
              target="_blank"
              className="text-blue-600 hover:text-blue-800 font-semibold transition-colors"
            >
              Qeematech
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
