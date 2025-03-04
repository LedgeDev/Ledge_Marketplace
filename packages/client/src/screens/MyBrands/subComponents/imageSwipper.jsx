import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Dimensions, Text, Pressable, FlatList } from 'react-native';
import ExtImage from '../../../components/ExtImage';
import { useAnalytics } from '../../../hooks/useAnalytics';

const { width } = Dimensions.get('window');

function ImageSwiper({ brand }) {
  const flatlistRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const eventSent = useRef(false);
  const analytics = useAnalytics();

  useEffect(() => {
    if (currentIndex !== 0 && brand.images.length > 1 && !eventSent.current) {
      console.log('Brand profile images swiped')
      analytics.capture('Brand profile images swiped', {
        value: brand.id,
        brand: brand.name,
        type: 'brandProfileImagesSwiped',
        brandId: brand.id,
      });
      eventSent.current = true;
    }
  }, [currentIndex, brand, analytics]);

  const handleImagePress = useCallback((event, index) => {
    const { locationX } = event.nativeEvent;
    const halfWidth = width / 2;

    if (locationX < halfWidth) {
      // Left side pressed -> go backward
      if (index > 0) {
        flatlistRef.current.scrollToOffset({
          offset: (index - 1) * width,
          animated: true,
        });
      }
    } else {
      // Right side pressed -> go forward
      if (index < brand.images.length - 1) {
        flatlistRef.current.scrollToIndex({
          index: index + 1,
          animated: true,
        });
      }
    }
  }, [brand.images, flatlistRef]);

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }, []);
  
  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const renderMediaItem = ({ item, index }) => {
    return (
      <Pressable onPress={(event) => handleImagePress(event, index)} className="h-full" style={{width}}>
        <ExtImage
          quality="original"
          mediaSource={item}
          className="h-full"
          style={{width}}
        />
      </Pressable>
    )
  };

  return (
    <View className="relative h-[500] w-full">
      <FlatList
        ref={flatlistRef}
        data={brand.images || []}
        renderItem={renderMediaItem}
        keyExtractor={(item, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={width}
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
      <Text className="absolute bottom-0 left-0 p-6 text-white text-xl shadow">
        {currentIndex + 1} / {brand.images.length}
      </Text>
    </View>
  );
}

export default ImageSwiper;
