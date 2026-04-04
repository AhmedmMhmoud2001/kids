import React from 'react';
import OrdersList from './OrdersList';
import { tx } from '../i18n/text';

const NextOrders = () => {
    return <OrdersList audience="NEXT" title={tx('Next Orders', 'طلبات نكست')} />;
};

export default NextOrders;
