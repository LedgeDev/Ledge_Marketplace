import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import GoBack from '../../../assets/svg/goBack.svg';
import HeartPink from '../../../assets/svg/V4Heart.svg';
import HeartWhite from '../../../assets/svg/newProfileHeart.svg';
import ShareBrand from '../../../assets/svg/shareBrand.svg';
import { useDispatch } from 'react-redux';
import { addMyFavourite, removeMyFavourite } from '../../../store/models/users';
import { useAnalytics } from '../../../hooks/useAnalytics';

const BrandProfileStickyHeader = ({ brand, onLike, onShare, onBack = () => {}, unlocked }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const analytics = useAnalytics();
  const [condition, setCondition] = useState(brand.inMyFavourites);
  const brandId = brand.id;

  const addOrRemoveBrand = (brand, condition) => {
    Haptics.selectionAsync();
    if (condition) {
      dispatch(removeMyFavourite(brandId));
      analytics.capture('brand removed from favourites', {
        brand: brand.name,
        type: 'brandRemovedFromFavourites',
        brandId: brand.id,
      });
      onLike(false, condition);
    } else {
      dispatch(addMyFavourite(brandId));
      analytics.capture('brand added to my favourites', {
        brand: brand.name,
        type: 'brandAddedToFavourites',
        brandId: brand.id,
      });
      onLike(true, condition);
    }
    setCondition(!condition);
  };

  return (
    <View
      className="absolute top-0 left-0 right-0 bg-transparent z-30 h-24 flex flex-row items-center px-5"
      style={{ marginTop: insets.top }}
    >
      <TouchableOpacity onPress={onBack}>
        <GoBack width={32} height={32} />
      </TouchableOpacity>

      <View className="flex-1 flex flex-row justify-end gap-4">
        <TouchableOpacity onPress={onShare}>
          <ShareBrand width={32} height={32} />
        </TouchableOpacity>

        {unlocked && (
          <TouchableOpacity onPress={() => addOrRemoveBrand(brand, condition)}>
            {condition ? (
              <HeartPink width={32} height={32} />
            ) : (
              <HeartWhite width={32} height={32} />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default BrandProfileStickyHeader;
