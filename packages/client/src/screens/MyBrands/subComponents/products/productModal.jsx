import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation } from 'react-native';
import ProductImageSwipperScreen from './productImageSwipper';
import { useExternalUrl } from '../../../../hooks/useExternalUrl';
import { useTranslation } from '../../../../hooks/useTranslation';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import HTMLView from 'react-native-htmlview';
import Button from '../../../../components/Button';

const ProductModal = ({ brand, product, unlocked, onClose, t, onConnect = () => {}}) => {
  const { openExternalUrl } = useExternalUrl();
  const { locale } = useTranslation();
  const analytics = useAnalytics();
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const handleRedeem = (brand, product) => {
    onClose();
    const url = product.purchaseUrl ? product.purchaseUrl : brand.website;
    analytics.capture('Brand product link clicked', {
      brandId: brand.id,
      brandName: brand.name,
      productId: product.id,
      productName: product.name,
      url: url,
      type: 'brandProductLinkPressed',
      details: {
        url: url,
      }
    });
    openExternalUrl(url, { brandId: brand.id, productId: product.id });
  }

  const toggleDescription = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDescriptionExpanded(!descriptionExpanded);
  }, [descriptionExpanded]);

  return (
    <View  className="flex flex-col h-full">
      <View className="flex-1">
        <ProductImageSwipperScreen product={product} />
      </View>
      <View>
        <Text className="font-montserrat-alt-bold font-black pb-3">
          {product.name}
        </Text>
        <View
          className="self-start flex flex-row items-baseline gap-2 pb-7"
        >
          { unlocked && (
            <Text
              className="font-montserrat-alt-bold text-s text-pink-dark"
            >
              €{product.dealPrice}
            </Text>
          )}
          <Text
            className={`font-montserrat-alt-normal text-s opacity-60 ${unlocked ? 'line-through' : ''}`}
          >
            €{product.regularPrice}
          </Text>
        </View>
        <View
          className="overflow-hidden"
          style={{ maxHeight: descriptionExpanded ? 'none' : 100 }}
        >
          {product.description && (
            <HTMLView
              value={product.description[locale]}
              stylesheet={htmlStyles}
              paragraphBreak={'\n'}
              lineBreak={'\n'}
              additionalStyles={{
                div: { marginBottom: 0, marginTop: 0 },
                span: { marginBottom: 0, marginTop: 0 },
              }}
            />
          )}
        </View>
        <TouchableOpacity onPress={toggleDescription}>
          <Text className="text-pink-dark text-sm font-bold pb-3">
            {descriptionExpanded ? t('brandProfile.productModal.readLess') : t('brandProfile.productModal.readMore')}
          </Text>
        </TouchableOpacity>
      </View>
      <View className="pb-10">
        {unlocked ? (
          <Button
            onPress={() => handleRedeem(brand, product)}
            className="w-full mt-4"
            color="pink"
            big
          >
            <Text className="color-[#C359AC] font-bold text-center">
              {t('brandProfile.deals.buttons.redeem')}
            </Text>
          </Button>
        ) : (
          <Button onPress={onConnect} color="gray" className="w-full mt-4" big>
            <Text className="font-montserrat-alt-bold text-sm color-[#C359AC]">
            {t('brandProfile.deals.buttons.connect')}
            </Text>
          </Button>
        )}
      </View>
    </View>
  );
};

const htmlStyles = StyleSheet.create({
  p: {
    textAlign: 'justify',
    marginBottom: 1,
  },
  strong: {
    fontWeight: 'bold',
    color: '#262C30'
  }
});

export default ProductModal;
