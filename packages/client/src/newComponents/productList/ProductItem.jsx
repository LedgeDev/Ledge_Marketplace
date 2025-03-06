import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { LinearTransition, FadeIn, FadeOut } from 'react-native-reanimated';
import { useTranslation } from '../../hooks/useTranslation';
import ExtImage from '../ExtImage';
import HeartOutlineIcon from '../../assets/svg/heart-outline-white';
import HeartFilledIcon from '../../assets/svg/heart-white';

const ProductItem = ({
  product,
  onPress = () => {},
  showLikeButton = false,
  onLikePress = () => {},
  liked = false,
}) => {
  const { locale } = useTranslation();

  return (
    <View
      className="w-full h-full"
    >
      <TouchableOpacity
        onPress={() => onPress(product)}
        className="relative w-full h-full rounded-2xl overflow-hidden"
      >
        {/* image */}
        <View className="absolute top-0 left-0 w-full h-full">
          <ExtImage
            className="w-full h-full"
            resizeMode="cover"
            mediaSource={product.images[0]}
          />
        </View>
        <View className="absolute top-0 left-0 w-full h-full">
          <LinearGradient
            colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.3)']}
            style={{ width: '100%', height: '100%' }}
          />
        </View>
        {/* like button */}
        {showLikeButton && (
          <TouchableOpacity
            className="absolute top-0 right-0 p-3 rounded-full"
            onPress={() => {
              Haptics.selectionAsync();
              onLikePress(product);
            }}
          >
            {liked ? (
              <HeartFilledIcon width={28} height={28} />
            ) : (
              <HeartOutlineIcon width={28} height={28} />
            )}
          </TouchableOpacity>
        )}
        {/* name and message */}
        <View className="absolute bottom-0 left-0 w-full h-full p-2 flex flex-col justify-end items-stretch">
          <Text className="font-montserrat-alt-bold text-white text-lg ">€{product.dealPrice}</Text>
          <Text className="font-inter-regular text-white text-lg">{product.name}</Text>
          <Text className="font-inter-regular text-white text-sm">{product.brand?.name}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}



// const ProductItem = React.memo(
//   ({
//     brand,
//     onPress,
//     showHeartIcon,
//     myFavouriteIds,
//     removeFavourite,
//     addFavourite,
//     showActionWarning,
//     isVisible,
//   }) => {
//     const opacity = useRef(new Animated.Value(isVisible ? 1 : 0)).current;
//     const { locale } = useTranslation();
//     const handleLikePress = useCallback(() => {
//       Haptics.selectionAsync();
//       myFavouriteIds.some((entry) => entry.brandId === brand.id)
//         ? removeFavourite(brand.id)
//         : addFavourite(brand.id);
//     }, [removeFavourite, addFavourite, myFavouriteIds])
//     const adventGroup = useMemo(() => getBrandAdventGroup(brand), [brand]);

//     useEffect(() => {
//       const animation = Animated.timing(opacity, {
//         toValue: isVisible ? 1 : 0,
//         duration: 300,
//         useNativeDriver: true,
//       });

//       animation.start();

//       return () => {
//         animation.stop();
//       };
//     }, [isVisible, opacity]);

//     return (
//       <Animated.View
//         className="mb-6"
//         style={[
//           { opacity },
//           !isVisible && {
//             position: 'absolute',
//             top: 0,
//             left: 0,
//             right: 0,
//             bottom: 0,
//             zIndex: -1,
//           },
//         ]}
//         pointerEvents={isVisible ? 'auto' : 'none'}
//       >
//         <TouchableOpacity onPress={() => onPress(brand)}>
//           <View className="mb-3 relative">
//             {brand.image ? (
//               <ExtImage
//                 className="w-full aspect-[11/19] rounded-2xl"
//                 resizeMode="cover"
//                 mediaSource={brand.image}
//                 alt={brand.name}
//               />
//             ) : (
//               <View className="w-full aspect-[11/19] bg-gray-200 rounded-2xl" />
//             )}
//             {showHeartIcon && (
//               <TouchableOpacity
//                 className="absolute top-0 right-0 p-4 rounded-full"
//                 onPress={handleLikePress}
//               >
//                 {myFavouriteIds.some((entry) => entry.brandId === brand.id) ? (
//                   <HeartIcon size={20} />
//                 ) : (
//                   <HeartIconOutline size={20} />
//                 )}
//               </TouchableOpacity>
//             )}
//             {adventGroup && (
//               <Image
//                 source={Ribbon}
//                 className="absolute top-0 left-0 w-28 h-28"
//                 resizeMode="cover"
//               />
//             )}
//             {brand.adventCalendarDay && (
//               <View className="absolute bottom-8 left-0 w-11 flex- flex-row justify-center bg-red-dark py-0.5 rounded-e-full pr-1 overflow-hidden">
//                 <Image
//                   source={Snow}
//                   className="absolute left-0 top-0 w-full h-full"
//                   resizeMode="cover"
//                 />
//                 <Text className="text-white font-montserrat-alt-light text-md">
//                   #{brand.adventCalendarDay}
//                 </Text>
//               </View>
//             )}
//           </View>
//           {showActionWarning && brand.interactionLabel && (
//             <View className="mb-2">
//               <BrandInteractionLabel label={brand.interactionLabel} />
//             </View>
//           )}
//           <Text className="font-montserrat-alt-bold text-bold">{brand.name}</Text>
//           <Text className="text-gray-600 font-inter text-sm">
//             {brand.category?.name[locale]}
//           </Text>
//         </TouchableOpacity>
//       </Animated.View>
//     );
//   },
// );

export default ProductItem;
