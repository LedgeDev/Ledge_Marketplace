import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Animated, Image } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from '../../hooks/useTranslation';
import ExtImage from '../ExtImage';
import HeartIcon from '../../assets/svg/heart-white';
import HeartIconOutline from '../../assets/svg/heart-outline-white';
import BrandInteractionLabel from './BrandInteractionLabel';

const BrandItem = React.memo(
  ({
    brand,
    onPress,
    showHeartIcon,
    myFavouriteIds,
    removeFavourite,
    addFavourite,
    showActionWarning,
    isVisible,
  }) => {
    const opacity = useRef(new Animated.Value(isVisible ? 1 : 0)).current;
    const { locale } = useTranslation();
    const handleLikePress = useCallback(() => {
      Haptics.selectionAsync();
      myFavouriteIds.some((entry) => entry.brandId === brand.id)
        ? removeFavourite(brand.id)
        : addFavourite(brand.id);
    }, [removeFavourite, addFavourite, myFavouriteIds])

    useEffect(() => {
      const animation = Animated.timing(opacity, {
        toValue: isVisible ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      });

      animation.start();

      return () => {
        animation.stop();
      };
    }, [isVisible, opacity]);

    return (
      <Animated.View
        className="mb-6"
        style={[
          { opacity },
          !isVisible && {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: -1,
          },
        ]}
        pointerEvents={isVisible ? 'auto' : 'none'}
      >
        <TouchableOpacity onPress={() => onPress(brand)}>
          <View className="mb-3 relative">
            {brand.image ? (
              <ExtImage
                className="w-full aspect-[11/19] rounded-2xl"
                resizeMode="cover"
                mediaSource={brand.image}
                alt={brand.name}
              />
            ) : (
              <View className="w-full aspect-[11/19] bg-gray-200 rounded-2xl" />
            )}
            {showHeartIcon && (
              <TouchableOpacity
                className="absolute top-0 right-0 p-4 rounded-full"
                onPress={handleLikePress}
              >
                {myFavouriteIds.some((entry) => entry.brandId === brand.id) ? (
                  <HeartIcon size={20} />
                ) : (
                  <HeartIconOutline size={20} />
                )}
              </TouchableOpacity>
            )}
          </View>
          {showActionWarning && brand.interactionLabel && (
            <View className="mb-2">
              <BrandInteractionLabel label={brand.interactionLabel} />
            </View>
          )}
          <Text className="font-montserrat-alt-bold text-bold">{brand.name}</Text>
          <Text className="text-gray-600 font-inter text-sm">
            {brand.category?.name[locale]}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  },
);

export default BrandItem;
