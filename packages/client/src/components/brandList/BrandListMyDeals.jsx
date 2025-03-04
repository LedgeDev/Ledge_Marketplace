import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Dimensions,
  ScrollView,
  Animated,
  Easing,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import ListLabels from './ListLabels';
import BrandItem from './BrandItem';
import TopBlur from '../TopBlur';


const BrandListMyDeals = ({
  brands,
  myFavouriteIds,
  addFavourite,
  removeFavourite,
  showHeartIcon,
  showActionWarning,
  actionWarningText,
  actionWarningIcon,
  labelsType,
  labels = [],
  goToProfile,
  onBrandPress,
  onRefresh = () => {},
  refreshing,
}) => {
  const navigation = useNavigation();
  const [sortType, setSortType] = useState(null);
  const [filterType, setFilterType] = useState(null);
  const screenWidth = Dimensions.get('window').width;
  const itemWidth = (screenWidth - 32) / 2;
  const [deletedItems, setDeletedItems] = useState([]);
  const animatedValues = useRef({});
  const [itemHeight, setItemHeight] = useState(0);
  const [localBrands, setLocalBrands] = useState(brands);
  const [isFavoriteActionDisabled, setIsFavoriteActionDisabled] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setLocalBrands(brands);
      setDeletedItems([]);
    }, [brands])
  );

  const handleSort = useCallback((type) => {
    setSortType(type);
  }, []);

  const handleFilter = useCallback((type) => {
    setFilterType(type);
  }, []);

  const handleBrandPress = (brand) => {
    if (goToProfile) {
      navigation.navigate('Brand Profile', { brand });
    } else {
      onBrandPress(brand);
    }
  };

  const visibleBrands = useMemo(() => {
    if (!Array.isArray(localBrands) || !filterType) {
      return localBrands.map((brand) => ({ ...brand, isVisible: true }));
    }

    return localBrands.map((brand) => ({
      ...brand,
      isVisible: brand.labels.some((label) => label.name === filterType),
    }));
  }, [localBrands, filterType]);

  const sortedBrands = useMemo(() => {
    if (!sortType) return visibleBrands;

    return [...visibleBrands].sort((a, b) => {
      const aDealCode = a.dealCodeGroups?.find(group => group.dealCodes.length > 0)?.dealCodes[0];
      const bDealCode = b.dealCodeGroups?.find(group => group.dealCodes.length > 0)?.dealCodes[0];
      if (sortType === 'latest') {
        return new Date(bDealCode.unlockedAt) - new Date(aDealCode.unlockedAt);
      } else if (sortType === 'timeLeft') {
        const today = new Date();
        const timeLeftA = new Date(aDealCode.userExpireDate) - today;
        const timeLeftB = new Date(bDealCode.userExpireDate) - today;
        return timeLeftA - timeLeftB;
      }
      return 0;
    });
  }, [visibleBrands, sortType]);

  useEffect(() => {
    sortedBrands.forEach((brand) => {
      if (!animatedValues.current[brand.id]) {
        animatedValues.current[brand.id] = new Animated.ValueXY();
      }
      animatedValues.current[brand.id].setValue({ x: 0, y: 0 });
    });
  }, [sortedBrands]);

  const handleAnimationFinish = useCallback((brandId) => {
    setDeletedItems(prev => [...prev, brandId]);
    setLocalBrands(prev => prev.filter(brand => brand.id !== brandId));
  }, []);

  const deleteBrandFromScreen = (brandId) => {
    Animated.timing(animatedValues.current[brandId], {
      toValue: { x: -screenWidth, y: 0 },
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
      useNativeDriver: true,
    }).start(() => handleAnimationFinish(brandId));

    const deletedIndex = sortedBrands.findIndex(brand => brand.id === brandId);
    sortedBrands.forEach((brand, index) => {
      if (index > deletedIndex) {
        const newPosition = calculateNewPosition(index);
        Animated.timing(animatedValues.current[brand.id], {
          toValue: newPosition,
          duration: 350,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
          useNativeDriver: true,
        }).start();
      }
    });
  };

  const calculateNewPosition = (currentIndex) => {
    const rowSize = 2;
    const currentColumn = currentIndex % rowSize;

    if (currentColumn == 1) {
      return { x: -itemWidth, y: 0 };
    } else {
      return { x: itemWidth, y: -itemHeight };
    }
  };

  const handleRefresh = useCallback(() => {
    onRefresh();
    setLocalBrands(brands);
  }, [onRefresh, brands]);

  const handleAddFavourite = useCallback((id) => {
    if (isFavoriteActionDisabled) return;

    setIsFavoriteActionDisabled(true);
    addFavourite(id);
    deleteBrandFromScreen(id);

    setTimeout(() => {
      setIsFavoriteActionDisabled(false);
    }, 300);
  }, [isFavoriteActionDisabled, addFavourite, deleteBrandFromScreen]);

  const handleRemoveFavourite = useCallback((id) => {
    if (isFavoriteActionDisabled) return;

    removeFavourite(id);
  }, [isFavoriteActionDisabled, removeFavourite]);

  return (
    <View className="flex self-stretch overflow-visible">
      <TopBlur labels />
      <View className="w-full pb-6 pt-2 px-7 z-30">
        <ListLabels
          type={labelsType}
          sortBy={handleSort}
          filterBy={handleFilter}
          labels={labels}
        />
      </View>
      <ScrollView
        className="background-cream h-full px-4 overflow-visible"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh}/>
        }
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {sortedBrands.map((brand) => {
            if (!brand.isVisible || deletedItems.includes(brand.id)) return null;

            const animatedStyle = {
              transform: animatedValues.current[brand.id]?.getTranslateTransform(),
            };

            return (
              <Animated.View
                key={brand.id}
                className="px-3"
                style={[{ width: itemWidth }, animatedStyle]}
                onLayout={(event) => {
                  const { height } = event.nativeEvent.layout;
                  setItemHeight(height);
                }}
              >
                <BrandItem
                  brand={brand}
                  onPress={handleBrandPress}
                  showHeartIcon={showHeartIcon}
                  myFavouriteIds={myFavouriteIds}
                  addFavourite={handleAddFavourite}
                  removeFavourite={handleRemoveFavourite}
                  showActionWarning={showActionWarning}
                  actionWarningText={actionWarningText}
                  actionWarningIcon={actionWarningIcon}
                  isVisible={brand.isVisible}
                />
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export default React.memo(BrandListMyDeals);
