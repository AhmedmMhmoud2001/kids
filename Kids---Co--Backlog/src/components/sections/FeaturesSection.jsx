import Section from '../common/Section';
import icon1 from '../../assets/truck-delivery.webp';
import icon2 from '../../assets/card-tick.svg';
import icon3 from '../../assets/delivery-return-01.svg';
import icon4 from '../../assets/customer-support.svg';
import { useLanguage } from '../../context/LanguageContext';
/**
 * Features section component
 */
const FeaturesSection = ({ features = [], className = '' }) => {
  const { t } = useLanguage();
  const defaultFeatures = [
    {
      icon: icon1,
      title: t('features.fastShippingTitle'),
      description: t('features.fastShippingDescription'),
    },
    {
      icon: icon2,
      title: t('features.instantPaymentTitle'),
      description: t('features.instantPaymentDescription'),
    },
    {
      icon: icon3,
      title: t('features.exchangeReturnTitle'),
      description: t('features.exchangeReturnDescription'),
    },
    {
      icon: icon4,
      title: t('features.customerServiceTitle'),
      description: t('features.customerServiceDescription'),
    },
  ];

  const featuresToShow = features.length > 0 ? features : defaultFeatures;

  return (
    <Section padding="py-5 lg:py-12" className={className}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {featuresToShow.map((feature, idx) => {
          const featureData = typeof feature === 'object' ? feature : defaultFeatures[idx];
          const iconSrc = featureData.icon || defaultFeatures[idx]?.icon;

          return (
            <div key={idx} className="text-center group">
              <div className="flex justify-center mb-3 sm:mb-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                  <img
                    src={iconSrc || null}
                    alt={featureData.title}
                    className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 object-contain"
                  />
                </div>
              </div>
              <h3 className="font-semibold text-sm sm:text-base md:text-lg text-gray-900 mb-1 sm:mb-2">
                {featureData.title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                {featureData.description}
              </p>
            </div>
          );
        })}
      </div>
    </Section>
  );
};

export default FeaturesSection;

