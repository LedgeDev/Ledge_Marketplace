import React, {
  useState,
  useCallback,
  useEffect,
} from 'react';
import {
  View,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { likeBrand, dislikeBrand } from '../../store/models/users';
import { useAnalytics } from '../../hooks/useAnalytics';
import Filters from './Filters';
import BrandItem from './BrandItem';

const BrandList = ({
  brands,
  goToProfile = false,
  onRefresh = () => {},
  refreshing,
  onBrandPress = () => {},
  parentTabName = '',
  showLikeButton = false,
  showFilters = false,
}) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const analytics = useAnalytics();
  const user = useSelector((state) => state.users.data);
  const [filteredBrands, setFilteredBrands] = useState(brands);
  const [userLikes, setUserLikes] = useState(user?.likes || []);

  useEffect(() => {
    setUserLikes(user?.likes || []);
  }, [user]);

  const handleBrandPress = (brand) => {
    analytics.capture('Brand list item pressed', {
      brandId: brand.id,
      brandName: brand.name,
      origin: parentTabName,
      position: filteredBrands.map(b => b.id).indexOf(brand.id) + 1,
      type: 'brandListItemPressed',
      details: { 
        origin: parentTabName,
        position: filteredBrands.map(b => b.id).indexOf(brand.id) + 1
      },
    });
    onBrandPress(brand);
    if (goToProfile) {
      navigation.navigate('Brand Profile', { brand });
    }
  };

  const handleLikePress = useCallback(async (brand) => {
    const currentUserLikes = user?.likes || [];
    if (currentUserLikes.some((like) => like.brandId === brand.id)) {
      setUserLikes(currentUserLikes.filter((like) => like.brandId !== brand.id));
      dispatch(dislikeBrand(brand.id));
    } else {
      setUserLikes([...currentUserLikes, brand.id]);
      dispatch(likeBrand(brand.id));
    }
  }, [dispatch, user]);

  const renderItem = ({ item: brand, index }) => {
    return (
      <View className={`h-64 w-[50%] py-2.5 ${index % 2 === 0 ? 'pr-2.5' : 'pl-2.5'}`}>
        <BrandItem
          brand={brand}
          onPress={handleBrandPress}
          showLikeButton={showLikeButton}
          onLikePress={handleLikePress}
          liked={userLikes.some((like) => like.brandId === brand.id)}
        />
      </View>
    );
  };

  return (
    <View className="relative flex self-stretch overflow-hidden pt-2">
      <FlatList
        className="background-cream h-full overflow-visible px-6 z-10"
        maxToRenderPerBatch={6}
        ListHeaderComponent={
          showFilters ?
            <Filters
              brands={brands}
              setFilteredBrands={setFilteredBrands}
            />
            : null
        }
        ListHeaderComponentStyle={{ paddingBottom: 24 }}
        data={filteredBrands}
        renderItem={renderItem}
        keyExtractor={(item) => `${item.id}`}
        numColumns={2}
        showsVerticalScrollIndicator={false}
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
