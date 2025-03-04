import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import BrandList from '../brandList/BrandList';

const SearchResults = ({ loading, onBrandPress = () => {} }) => {
  const brands = useSelector((state) => state.brands.brands);
  const searchResults = useSelector((state) => state.brands.searchResults);
  const brandsStatus = useSelector((state) => state.brands.status);

  const handleBrandPress = (brand) => {
    onBrandPress(brand);
  };

  if (brandsStatus === 'loading' || loading) {
    return (
    <View className="z-10 h-full w-full flex justify-center items-center pb-20">
      <ActivityIndicator size="large" />
    </View>
    );
  }

  return (
    <View className="z-10 pt-6">
      <BrandList
        brands={searchResults?.length ? searchResults : brands}
        goToProfile={true}
        onBrandPress={handleBrandPress}
        parentTabName="Search"
        showFilters={false}
        showLikeButton={true}
      />
    </View>
  );
};

export default SearchResults;
