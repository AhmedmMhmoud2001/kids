import React from 'react';
import ProductsList from './ProductsList';
import { tx } from '../i18n/text';

const KidsProducts = () => {
    return <ProductsList audience="KIDS" title={tx('Kids Products', 'منتجات كيدز')} />;
};

export default KidsProducts;
