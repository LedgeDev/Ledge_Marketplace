import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
} from 'react-native';
import ExtImage from '../../../../components/ExtImage';

function ProductImageSwipper({ product }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mediaWidth, setMediaWidth] = useState(0);
  const mediaGap = 30;

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }, []);

  const renderMediaItem = ({ item, index }) => {
    return (
      <View className="relative rounded-2xl overflow-hidden" style={{ width: mediaWidth }}>
        <ExtImage
          mediaSource={item}
          resizeMode="cover"
          style={{ width: '100%', height: '100%' }}
        />
      </View>
    );
  };

  return (
    <View
      className="pb-10"
      onLayout={(event) => {
        setMediaWidth(event.nativeEvent.layout.width);
      }}
    >
      <FlatList
        className="overflow-visible"
        data={product.images}
        renderItem={renderMediaItem}
        ItemSeparatorComponent={() => <View style={{ width: mediaGap }} />}
        keyExtractor={(item, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={mediaWidth + mediaGap}
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        nestedScrollEnabled
      />
      <View className="flex-row justify-center mt-2.5 items-center">
        {Array.from({ length: product.images.length }, (_, index) => (
          <View
            key={index}
            className={`rounded-full m-1.5 ${currentIndex === index ? 'bg-blue h-2 w-2' : 'bg-blue-light h-1.5 w-1.5'}`}
          />
        ))}
      </View>
    </View>
  );
};

export default ProductImageSwipper;
