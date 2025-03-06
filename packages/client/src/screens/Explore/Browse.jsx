import React, { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import ProductList from '../../newComponents/productList/ProductList';
import { fetchProducts } from '../../store/models/products';
import NoDataWarning from '../../components/NoDataWarning';
import Search from '../../newComponents/search/Search';

const Browse = ({ isActiveTab }) => {
  const products = useSelector((state) => state.products.products);
  const productsStatus = useSelector((state) => state.products.status);
  const [refreshing, setRefreshing] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    dispatch(fetchProducts());
  }, []);

  // Show loading state while preloading media
  if (!products || productsStatus === 'loading') {
    return <ActivityIndicator className="flex-1" size="large" color="#999999" />;
  }

  if (products && products.length === 0) {
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
      <Text className="text-lg font-bold px-4 pt-2 pb-1">
        User Uploaded Products
      </Text>
      <Search />
      <ProductList
        products={products}
        goToProfile={true}
        onRefresh={onRefresh}
        refreshing={refreshing}
        parentTabName="Browse"
        showLikeButton={true}
        showFilters={false}
        showUserInfo={true}
      />
    </View>
  );
};

export default Browse;