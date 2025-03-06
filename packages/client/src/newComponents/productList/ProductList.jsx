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
import ProductItem from './ProductItem';

const ProductList = ({
  products,
  goToProfile = false,
  onRefresh = () => {},
  refreshing,
  onProductPress = () => {},
  parentTabName = '',
  showLikeButton = false,
  showFilters = false,
}) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const analytics = useAnalytics();
  const user = useSelector((state) => state.users.data);
  const [userLikes, setUserLikes] = useState(user?.likes || []);

  useEffect(() => {
    setUserLikes(user?.likes || []);
  }, [user]);

  const handleProductPress = (product) => {
    onProductPress(product);
    if (goToProfile) {
      navigation.navigate('Product Profile', { product });
    }
  };

  // const handleLikePress = useCallback(async (brand) => {
  //   const currentUserLikes = user?.likes || [];
  //   if (currentUserLikes.some((like) => like.brandId === brand.id)) {
  //     setUserLikes(currentUserLikes.filter((like) => like.brandId !== brand.id));
  //     dispatch(dislikeBrand(brand.id));
  //   } else {
  //     setUserLikes([...currentUserLikes, brand.id]);
  //     dispatch(likeBrand(brand.id));
  //   }
  // }, [dispatch, user]);

  const renderItem = ({ item: product, index }) => {
    return (
      <View className={`h-64 w-[50%] py-2.5 ${index % 2 === 0 ? 'pr-2.5' : 'pl-2.5'}`}>
        <ProductItem
          product={product}
          onPress={handleProductPress}
          // showLikeButton={showLikeButton}
          // onLikePress={handleLikePress}
          // liked={userLikes.some((like) => like.brandId === brand.id)}
        />
      </View>
    );
  };

  return (
    <View className="relative flex self-stretch overflow-hidden pt-2 border">
      <FlatList
        className="background-cream h-full overflow-visible px-6 z-10"
        maxToRenderPerBatch={6}
        ListHeaderComponentStyle={{ paddingBottom: 24 }}
        data={products}
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

export default ProductList;
