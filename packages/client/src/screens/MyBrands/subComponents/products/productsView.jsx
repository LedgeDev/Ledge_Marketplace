import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  Text,
  Dimensions,
} from 'react-native';
import ProductBox from './ProductBox';
import Button from '../../../../components/Button';
import { useExternalUrl } from '../../../../hooks/useExternalUrl';
import { useAnalytics } from '../../../../hooks/useAnalytics';

const { width: screenWidth } = Dimensions.get('window');
const pageWidth = screenWidth - 28 * 2; // 28px padding on each side
// this is set manually, because in android the width of the component is not calculated correctly
// due to the fact that the component is contained in a scrollview in the parent
const pageGap = 28;

function ProductsView({ brand, unlocked, showBottomSheet, t, onUnlock = () => {} }) {
  const { openExternalUrl } = useExternalUrl();
  const products = brand.products.slice(0, 8);
  const [currentIndex, setCurrentIndex] = useState(0);
  const analytics = useAnalytics();
  const eventSentRef = useRef(false);

  const productPages = useMemo(() => {
    const chunkSize = 4;
    const results = [];
    for (let i = 0; i < products.length; i += chunkSize) {
      results.push(products.slice(i, i + chunkSize));
    }
    results.push([{}]); // Add an extra chunk for the "View all products" button
    return results;
  }, [products]);

  const handleRedeem = (brand) => {
    analytics.capture('Brand see all products link clicked', { 
      brandId: brand.id,
      brandName: brand.name,
      url: brand.website,
      type: 'brandSeeAllProductsLinkPressed',
      details: {
        url: brand.website,
      }
    });
    openExternalUrl(brand.website, {brandId: brand.id });
  }

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const newCurrentIndex = viewableItems[0].index;
      setCurrentIndex(newCurrentIndex);
      if (brand.products.length >= 4 && newCurrentIndex !== 0 && !eventSentRef.current) {
        analytics.capture('Brand profile products swiped', {
          brandId: brand.id,
          brand: brand.name,
          type: 'brandProfileProductsSwiped',
        });
        eventSentRef.current = true;
      }
    }
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const renderProductPage = ({ item, index }) => {
    if (index === productPages.length - 1) {
      return (
        <View style={{ width: pageWidth }} className="justify-center items-center">
          <Text className="font-montserrat-alt-bold text-center w-40 text-xl">
            {t('brandProfile.allProducts')}
          </Text>
          <Button
            onPress={() => unlocked ? handleRedeem(brand) : onUnlock()}
            className="mt-8 w-[80%]"
            big
            color={unlocked ? 'pink' : 'gray'}
          >
            <Text className="text-pink-dark font-bold">
              {unlocked ? t('brandProfile.deals.buttons.redeem') : t('brandProfile.deals.buttons.connect')}
            </Text>
          </Button>
        </View>
      );
    }
    return (
      <View style={{ width: pageWidth }} className="flex-row flex-wrap justify-between items-center gap-4">
        {item.map((product, index) => (
          <View key={product.id || index} className="w-[47%] h-[280]">
            <ProductBox
              product={product}
              unlocked={unlocked}
              handleProductPress={() => showBottomSheet(product)}
            />
          </View>
        ))}
      </View>
    )
  };

  return (
    <View className="w-full justify-center items-center">
      <FlatList
        className="overflow-visible"
        data={productPages}
        renderItem={renderProductPage}
        ItemSeparatorComponent={() => <View style={{ width: pageGap }} />}
        keyExtractor={(item, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={pageWidth + pageGap}
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        style={{ maxWidth: pageWidth }}
        removeClippedSubviews={false}
      />
      <View className="mt-4 flex-row self-center justify-center h-[24px] w-[24px]">
        {productPages.map((_, index) => (
          <View
            key={index}
            // Set size of the point based on if it's activated
            style={[
              { opacity: index === currentIndex ? 1 : 0.3 },
              { height: index === currentIndex ? 12 : 8 },
              { width: index === currentIndex ? 12 : 8 },
            ]}
            className="h-[8px] w-[8px] self-center rounded-full bg-blue m-2"
          />
        ))}
      </View>
    </View>
  );
}

export default ProductsView;
