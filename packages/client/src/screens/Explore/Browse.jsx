import React, { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import BrandList from '../../newComponents/brandList/BrandList';
import { getBrands } from '../../store/models/brands';
import NoDataWarning from '../../components/NoDataWarning';
import TopBlur from '../../newComponents/TopBlur';
import Search from '../../newComponents/search/Search';
import { browseInitialOrder } from '../../utils/brand-utils';
import { usePreloadMedia } from '../../hooks/usePreloadMedia';

const Browse = ({ isActiveTab }) => {
  const brands = useSelector((state) => state.brands.brands);
  const user = useSelector((state) => state.users.data);
  const [sortedBrands, setSortedBrands] = useState(brands?.length ? browseInitialOrder(brands, user) : []);
  const brandsStatus = useSelector((state) => state.brands.status);
  const [refreshing, setRefreshing] = useState(false);
  const dispatch = useDispatch();

  // Use the preloading hook
  const { isPreloading } = usePreloadMedia(sortedBrands);

  useEffect(() => {
    if (!brands && brandsStatus !== 'loading') {
      dispatch(getBrands());
    } else if (brandsStatus === 'succeeded') {
      setTimeout(() => setRefreshing(false), 1000);
    }
  }, [brandsStatus, dispatch]);

  // randomize brands when inactive
  useEffect(() => {
    if (!isActiveTab && brands?.length) {
      setSortedBrands(browseInitialOrder(brands, user))
    }
  }, [isActiveTab, brands]);

  useEffect(() => {
    if (brands?.length) {
      setSortedBrands(browseInitialOrder(brands, user))
    }
  }, [brands]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    dispatch(getBrands());
  }, []);

  // Show loading state while preloading media
  if (!brands || isPreloading) {
    return <ActivityIndicator className="flex-1" size="large" color="#999999" />;
  }

  if (brands && brands.length === 0) {
    return (
      <NoDataWarning
        component="Browse"
        onRefresh={onRefresh}
        refreshing={refreshing}
      />
    );
  }


  return (
    <View className="flex-1 overflow-visible">
      <Search />
      <BrandList
        brands={sortedBrands}
        goToProfile={true}
        onRefresh={onRefresh}
        refreshing={refreshing}
        parentTabName="Browse"
        showLikeButton={true}
        showFilters={true}
      />
    </View>
  );
};

export default Browse;