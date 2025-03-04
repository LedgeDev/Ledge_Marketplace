import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Dimensions } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { useTranslation } from '../../../hooks/useTranslation';
import QuestionHeader from '../QuestionHeader';
import QuestionOption from '../QuestionOption';
import ExtImage from '../../ExtImage';
import mediaUrl from '../../../utils/media-url';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { debounce } from 'lodash';

const IMAGE_SIZE = 200;

const ProductImageComponent = ({ item }) => (
  <View
    style={{
      width: IMAGE_SIZE,
      height: IMAGE_SIZE,
      borderRadius: 20,
      overflow: 'hidden',
    }}
    className="relative"
  >
    <View
      style={{
        width: IMAGE_SIZE,
        height: IMAGE_SIZE,
        borderWidth: 1,
        borderColor: '#e6e6e6',
        borderRadius: 20,
        overflow: 'hidden',
      }}
    >
      <ExtImage
        source={{ uri: item.url }}
        style={{ width: IMAGE_SIZE, height: IMAGE_SIZE }}
        resizeMode="cover"
      />
    </View>

    <LinearGradient
      colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)']}
      start={{x: 1, y: 0.5}}
      end={{x: 1, y: 1}}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        opacity: 0.4,
      }}
    />

    <View
      className="absolute bottom-1 right-1 px-3 py-2 rounded"
    >
      <Text className="text-white font-bold text-3xl">
        €{item.price}
      </Text>
    </View>
  </View>
);

const PricingFeedbackQuestion = ({ question, answer, onAnswersChange }) => {
  const { locale } = useTranslation();
  const [selectedOptionId, setSelectedOptionId] = useState(answer?.value || null);
  const [imageUrls, setImageUrls] = useState([]);
  const [componentWidth, setComponentWidth] = useState(0);
  const [componentHeight, setComponentHeight] = useState(0);
  const carouselRef = useRef(null);

  useEffect(() => {
    if (answer && answer.value) {
      setSelectedOptionId(answer.value);
    }
  }, [answer]);

  useEffect(() => {
    const loadImageUrls = async () => {
      const urls = await Promise.all(
        question.products.map(async (product) => {
          const url = await mediaUrl(product.image);
          return { url, price: product.price };
        })
      );
      setImageUrls(urls);
    };

    loadImageUrls();
  }, [question.products]);

  const debouncedHandleSelectOption = useCallback(
    debounce((optionId) => {
      setSelectedOptionId(optionId);
      onAnswersChange({ value: optionId });
    }, 100),
    [onAnswersChange]
  );

  const handleSelectOption = useCallback((optionId) => {
    debouncedHandleSelectOption(optionId);
  }, [debouncedHandleSelectOption]);

  const options = [1, 2, 3, 4, 5];

  return (
    <View
      className="flex-1"
      onLayout={(event) => {
        setComponentWidth(event.nativeEvent.layout.width * 0.7);
        setComponentHeight(event.nativeEvent.layout.height);
      }}
    >
      <QuestionHeader question={question} />
      <View className="h-[250] justify-center items-center pt-20">
        <MaskedView
          style={{ width: '100%', height: 300 }}
          maskElement={
            <LinearGradient
              colors={['transparent', 'white', 'white', 'transparent']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              locations={[0, 0.05, 0.95, 1]}
              style={{ flex: 1 }}
            />
          }
        >
          <View className="justify-center items-center">
            { componentWidth > 0 && componentHeight > 0 && (
              <Carousel
                ref={carouselRef}
                loop={true}
                width={componentWidth}
                height={300}
                autoPlay={false}
                data={imageUrls}
                scrollAnimationDuration={1000}
                renderItem={({ item }) => <ProductImageComponent item={item} />}
                mode="parallax"
                modeConfig={{
                  parallaxScrollingScale: 0.8,
                }}
                style={{ overflow: 'visible' }}
              />
            )}
          </View>
        </MaskedView>
      </View>
      <View>
        <View className="flex flex-row justify-between items-center mb-4">
          <Text className="text-gray-600 text-sm">
            {question.scaleBottomLabel ? question.scaleBottomLabel[locale] : 'Too cheap'}
          </Text>
          <Text className="text-gray-600 text-sm">
            {question.scaleTopLabel ? question.scaleTopLabel[locale] : 'Too expensive'}
          </Text>
        </View>
        <View className="flex flex-row justify-between items-center">
          {options.map((option) => (
            <QuestionOption
              key={option}
              option={{ id: option, [locale]: option }}
              onSelect={() => handleSelectOption(option)}
              selected={selectedOptionId === option}
              className="shrink w-[60] h-[60] mx-0.5 rounded-xl flex justify-center items-center"
              centerText
            />
          ))}
        </View>
      </View>
    </View>
  );
};

export default PricingFeedbackQuestion;
