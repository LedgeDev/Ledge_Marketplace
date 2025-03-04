import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { View, Animated } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import BrandListMyFavorites from '../../components/brandList/BrandListMyFavorites';
import { fetchMyFavourites } from '../../store/models/brands';
import NoDataWarning from '../../components/NoDataWarning';
import {
  removeMyFavourite,
  optimisticRemoveMyFavourite,
  optimisticAddMyFavourite,
  getUser,
} from '../../store/models/users';
import { useAnalytics } from '../../hooks/useAnalytics';

const MyFavourites = ({ isActiveTab, t }) => {
  const navigation = useNavigation();
  const brands = useSelector((state) => state.brands.myFavourites) || [];
  const myFavouriteIds =
    useSelector((state) => state.users.data?.myFavourites) || [];
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [opacity] = useState(new Animated.Value(1));
  const [showNoData, setShowNoData] = useState(false);
  const analytics = useAnalytics();
  const { locale } = useTranslation();
  const labels = useMemo(() => {
    const brandLabels = Array.from(new Set(brands.map((brand) => brand.labels.map(label => ({ name: label[locale] }))).flat()));
    return brandLabels;
  }, [brands, locale]);

  const fetchData = useCallback(() => {
    return Promise.all([dispatch(fetchMyFavourites()).unwrap(), dispatch(getUser()).unwrap()]);
  }, [dispatch]);

  useEffect(() => {
    if (!isActiveTab) {
      onRefresh();
    }
  }, [isActiveTab, onRefresh]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  useEffect(() => {
    if (brands.length === 0 && !showNoData) {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowNoData(true);
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    } else if (brands.length > 0 && showNoData) {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowNoData(false);
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [brands, showNoData, opacity]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    const startTime = Date.now();

    fetchData().finally(() => {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(1000 - elapsedTime, 0);

      setTimeout(() => {
        setRefreshing(false);
      }, remainingTime);
    });
  }, [fetchData]);

  const removeFavourite = async (brandId) => {
    const brand = brands.find((brand) => brand.id === brandId);
    analytics.capture('brand removed from favourites', {
      brand: brand.name,
      type: 'brandRemovedFromFavourites',
      brandId: brand.id,
    });
    dispatch(optimisticRemoveMyFavourite(brandId));
    await dispatch(removeMyFavourite(brandId))
      .unwrap()
      .catch(() => {
        dispatch(optimisticAddMyFavourite(brandId));
      });
    fetchData();
  };

  const handleBrandPress = (brand) => {
    if (brand.interactionLabel?.id === 'feedback') {
      navigation.navigate('Product Feedback', { brand });
    } else {
      navigation.navigate('Brand Profile', { brand });
    }
  };

  return (
    <View className="overflow-visible" style={{ flex: 1 }}>
      <Animated.View style={{ opacity, flex: 1 }}>
        {showNoData ? (
          <NoDataWarning
            component="MyFavourites"
            onRefresh={onRefresh}
            refreshing={refreshing}
          />
        ) : (
          <BrandListMyFavorites
            brands={brands}
            myFavouriteIds={myFavouriteIds}
            removeFavourite={removeFavourite}
            showHeartIcon={true}
            showActionWarning={true}
            actionWarningText="Redeem your deal"
            actionWarningIcon="PinkTag"
            labelsType="myFavourites"
            labels={labels}
            goToProfile={false}
            onBrandPress={handleBrandPress}
            onRefresh={onRefresh}
            refreshing={refreshing}
          />
        )}
      </Animated.View>
    </View>
  );
};

export default MyFavourites;
