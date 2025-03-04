import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { View, Animated } from 'react-native';
import BrandListMyDeals from '../../components/brandList/BrandListMyDeals';
import { fetchMyDeals } from '../../store/models/brands';
import {
  removeMyFavourite,
  addMyFavourite,
  optimisticRemoveMyFavourite,
  optimisticAddMyFavourite,
  getUser,
} from '../../store/models/users';
import NoDataWarning from '../../components/NoDataWarning';
import { useAnalytics } from '../../hooks/useAnalytics';

const MyDeals = ({ isActiveTab, setNotification, t }) => {
  const myDeals = useSelector((state) => state.brands.myDeals) || [];
  const myFavouriteIds =
    useSelector((state) => state.users.data?.myFavourites) || [];
  const [newFavourites, setNewFavourites] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [opacity] = useState(new Animated.Value(1));
  const [showNoData, setShowNoData] = useState(false);
  const dispatch = useDispatch();
  const analytics = useAnalytics();

  const fetchData = useCallback(() => {
    return Promise.all([dispatch(fetchMyDeals()).unwrap(), dispatch(getUser()).unwrap()]);
  }, [dispatch]);

  useEffect(() => {
    setNewFavourites(0);
    if (!isActiveTab) {
      onRefresh();
    }
  }, [isActiveTab, onRefresh]);

  useEffect(() => {
    if (myDeals.length === 0 && !showNoData) {
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
    } else if (myDeals.length > 0 && showNoData) {
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
  }, [myDeals, showNoData, opacity]);

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
    const brand = myDeals.find((brand) => brand.id === brandId);
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

  const addFavourite = async (brandId) => {
    const brand = myDeals.find((brand) => brand.id === brandId);
    analytics.capture('brand added to my favourites', {
      brand : brand.name,
      type: 'brandAddedToFavourites',
      brandId: brand.id,
    })
    dispatch(optimisticAddMyFavourite(brandId));
    await dispatch(addMyFavourite(brandId))
      .unwrap()
      .catch(() => {
        dispatch(optimisticRemoveMyFavourite(brandId));
      });
    fetchData();
    setNotification('myBrands.myFavourites', newFavourites + 1);
    setNewFavourites(newFavourites + 1);
  };

  return (
    <View className="overflow-visible" style={{ flex: 1 }}>
      <Animated.View style={{ opacity, flex: 1 }}>
        {showNoData ? (
          <NoDataWarning
            component="MyDeals"
            onRefresh={onRefresh}
            refreshing={refreshing}
          />
        ) : (
          <BrandListMyDeals
            brands={myDeals}
            myFavouriteIds={myFavouriteIds}
            removeFavourite={removeFavourite}
            addFavourite={addFavourite}
            showHeartIcon={true}
            showActionWarning={true}
            showMyFavourites={false}
            actionWarningText="4 days left"
            actionWarningIcon="PinkTimer"
            labelsType="sort"
            goToProfile={true}
            onRefresh={onRefresh}
            refreshing={refreshing}
          />
        )}
      </Animated.View>
    </View>
  );
};

export default MyDeals;
