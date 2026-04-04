import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTopHeaderOffers } from '../api/settings';

const normalizeIds = (value) => {
  if (Array.isArray(value)) return value.map((v) => String(v));
  return String(value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
};

export const getProductOfferDiscountPercent = (offers, product) => {
  if (!product || !Array.isArray(offers)) return 0;
  const productId = product?.id != null ? String(product.id) : null;
  const productCategorySlug = String(
    product?.categorySlug || product?.category?.slug || ''
  )
    .toLowerCase()
    .trim();
  const productBrandSlug = String(
    product?.brandSlug || product?.brandRel?.slug || ''
  )
    .toLowerCase()
    .trim();
  let maxDiscount = 0;

  for (const offer of offers) {
    if (!offer || offer.isActive === false) continue;

    const ids = normalizeIds(offer.productIds);
    const offerCategorySlug = String(offer.categorySlug || '').toLowerCase().trim();
    const offerBrandSlug = String(offer.brandSlug || '').toLowerCase().trim();
    const matchesProduct = productId ? ids.includes(productId) : false;
    const matchesCategory = Boolean(
      offerCategorySlug && productCategorySlug && offerCategorySlug === productCategorySlug
    );
    const matchesBrand = Boolean(
      offerBrandSlug && productBrandSlug && offerBrandSlug === productBrandSlug
    );

    if (!matchesProduct && !matchesCategory && !matchesBrand) continue;

    const discount = Number(offer.discountPercent || 0);
    if (Number.isFinite(discount) && discount > maxDiscount) {
      maxDiscount = discount;
    }
  }

  return Math.max(0, maxDiscount);
};

export const useTopHeaderOffers = () => {
  return useQuery({
    queryKey: ['settings', 'top-header-offers'],
    queryFn: fetchTopHeaderOffers,
    staleTime: 60 * 1000,
  });
};

export const useProductOfferDiscount = (product) => {
  const { data: offers = [] } = useTopHeaderOffers();
  return useMemo(() => getProductOfferDiscountPercent(offers, product), [offers, product]);
};

