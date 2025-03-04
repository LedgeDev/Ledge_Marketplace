import React from 'react';
import TabScreenWrapper from '../../components/TabScreenWrapper';
import MyFavourites from './MyFavourites';
import MyDeals from './MyDeals';
import { useTranslation } from '../../hooks/useTranslation';

function MyBrandsScreen() {
  const { t } = useTranslation();

  return (
    <TabScreenWrapper
      tab1Name="myBrands.myFavourites"
      tab2Name="myBrands.myDeals"
      Tab1Component={MyFavourites}
      Tab2Component={MyDeals}
      t={t}
    />
  );
}

export default MyBrandsScreen;
