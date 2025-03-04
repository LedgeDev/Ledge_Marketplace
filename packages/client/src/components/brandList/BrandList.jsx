import React, {
  useState,
  useMemo,
} from 'react';
import {
  View,
  LayoutAnimation,
  RefreshControl,
  Dimensions,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from '../../hooks/useTranslation';
import { useAnalytics } from '../../hooks/useAnalytics';
import ListLabels from './ListLabels';
import BrandItem from './BrandItem';
import TopBlur from '../TopBlur';

const BrandList = ({
  brands,
  myFavouriteIds,
  removeFavourite,
  addFavourite,
  showHeartIcon,
  showActionWarning,
  actionWarningText,
  actionWarningIcon,
  goToProfile,
  onRefresh = () => {},
  refreshing,
  onBrandPress,
  parentTabName = '',
}) => {
  const navigation = useNavigation();
  const { locale } = useTranslation();
  const analytics = useAnalytics();
  const screenWidth = Dimensions.get('window').width;
  const itemWidth = (screenWidth - 32) / 2; // 32 is the total horizontal padding (16 on each side)
  const [activeFilter, setActiveFilter] = useState(null);
  const labels = useMemo(() => {
    const brandLabels = Array.from(new Set(brands.map((brand) => brand.labels.map(label => label[locale])).flat()));
    const brandLabelsObjects = brandLabels.map((label) => ({ name: label }));
    return brandLabelsObjects;
  }, [brands, locale]);

  const filteredBrands = useMemo(() => {
    let filteredBrands = brands;
    if (activeFilter) {
      filteredBrands = brands.filter((brand) => brand.labels.some((label) => label[locale] === activeFilter));
    }
    // initiate layout animation
    LayoutAnimation.configureNext({
      duration: 250,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });
    return filteredBrands;
  }, [brands, activeFilter, locale]);

  const handleBrandPress = (brand) => {
    analytics.capture('Brand list item pressed', {
      brandId: brand.id,
      brandName: brand.name,
      origin: parentTabName,
      position: filteredBrands.indexOf(brand) + 1,
      type: 'brandListItemPressed',
      details: { 
        origin: parentTabName,
        position: filteredBrands.indexOf(brand) + 1
      },
    });
    if (goToProfile) {
      navigation.navigate('Brand Profile', { brand });
    } else {
      onBrandPress(brand);
    }
  };

  const renderItem = ({ item: brand }) => {
    return (
      <View className="px-3" style={{ width: itemWidth }}>
        <BrandItem
          brand={brand}
          onPress={handleBrandPress}
          showHeartIcon={showHeartIcon}
          myFavouriteIds={myFavouriteIds}
          removeFavourite={removeFavourite}
          addFavourite={addFavourite}
          showActionWarning={showActionWarning}
          actionWarningText={actionWarningText}
          actionWarningIcon={actionWarningIcon}
          isVisible={true}
        />
      </View>
    );
  };

  return (
    <View className="relative flex self-stretch overflow-visible">
      {/*
        the blur needs to be inside this component in order to be shown behind the labels
        but over the rest of the content 
      */}
      <TopBlur labels={true} />
      <View className="w-full pb-6 pt-2 px-7 z-20 overflow-hidden">
        <ListLabels
          type="filter"
          filterBy={setActiveFilter}
          labels={labels}
        />
      </View>
      <FlatList
        data={filteredBrands}
        renderItem={renderItem}
        keyExtractor={(item) => `${item.id}`}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        className="background-cream h-full overflow-visible px-4 z-10"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          refreshing !== undefined ?
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>
            : null
        }
      />
    </View>
  );
};

export default BrandList;
