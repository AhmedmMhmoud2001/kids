import React from 'react';
import ProductsList from './ProductsList';
import { tx } from '../i18n/text';

const NextProducts = () => {
    return <ProductsList audience="NEXT" title={tx('Next Products', 'منتجات نكست')} />;
};

export default NextProducts;
