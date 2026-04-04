import React from 'react';
import OrdersList from './OrdersList';
import { tx } from '../i18n/text';

const KidsOrders = () => {
    return <OrdersList audience="KIDS" title={tx('Kids Orders', 'طلبات كيدز')} />;
};

export default KidsOrders;
