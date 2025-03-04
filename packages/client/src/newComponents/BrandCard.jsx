import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  FlatList,
  LayoutAnimation,
  Platform,
  ActivityIndicator,
  Share,
} from 'react-native';
import ExtImage from './ExtImage';
import { Video } from 'expo-av';
import { BlurView } from 'expo-blur';
import { useLedgeTransitions } from '../hooks/useLedgeTransitions';
import { useAnalytics } from '../hooks/useAnalytics';
import { useTranslation } from '../hooks/useTranslation';
import mediaUrl from '../utils/media-url';
import getFounderNamesString from '../utils/founder-names-string';
import PlayIcon from '../assets/svg/play-white.svg';
import { useNavigation } from '@react-navigation/native';
import EventBus from 'react-native-event-bus';
import MuteButton from './MuteButton';
import NewDotIndicator from './NewDotIndicator';
import ShareBrand from '../assets/svg/shareBrand2.svg';
import { LANDING_PAGE_URL } from '@env';

const windowHeight = Dimensions.get('window').height;
const useBlur = Platform.OS === 'ios';


const BrandTeaser = ({ mediaSource, videoRef, shouldPlay, isMuted, preloadedUrl }) => {
  const [url, setUrl] = useState(preloadedUrl || null);
  const [isLoading, setIsLoading] = useState(!preloadedUrl);

  useEffect(() => {
    const loadMediaUrl = async () => {
      if (preloadedUrl) {
        setUrl(preloadedUrl);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const loadedUrl = await mediaUrl(mediaSource);
        setUrl(loadedUrl);
      } catch (error) {
        console.error('Error loading teaser URL:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMediaUrl();
  }, [mediaSource, preloadedUrl]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="small" color="#999999" />
      </View>
    );
  }

  return (
    <Video
      ref={videoRef}
      source={{ uri: url }}
      resizeMode="cover"
      shouldPlay={shouldPlay}
      isLooping
      useNativeControls={false}
      className="w-full h-full rounded-2xl"
      style={{ width: '100%', height: '100%' }}
      isMuted={isMuted}
    />
  );
};

const BrandCard = ({
  brand,
  shouldPlay,
  closeCard,
  isMuted,
  onMute = () => {},
  isNew,
  onBrandNamePress = () => {},
  parentTabName = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mediaWidth, setMediaWidth] = useState(0);
  const mediaGap = 30;
  const videoRef = useRef(null);
  const navigation = useNavigation();
  const { dotIndicatorTransition } = useLedgeTransitions();
  const { locale } = useTranslation();
  const analytics = useAnalytics();

  // Create media sources array with preloaded URLs
  let mediaSources = brand.images.map((image, index) => ({
    mediaSource: image,
    type: 'image',
    preloadedUrl: brand._preloadedUrls?.images?.[index]
  }));

  if (brand.teaser) {
    mediaSources.unshift({
      mediaSource: brand.teaser,
      type: 'teaser',
      preloadedUrl: brand._preloadedUrls?.teaser
    });
  }

  const textCondition = brand.shortDescription?.[locale] !== "";
  const mediaHeight = textCondition ? windowHeight * 0.53 : windowHeight * 0.6;

  useEffect(() => {
    if (shouldPlay) {
      videoRef.current?.playAsync();
    } else {
      videoRef.current?.pauseAsync();
    }
  }, [shouldPlay]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.setIsMutedAsync(isMuted);
    }
  }, [isMuted]);

  useLayoutEffect(() => {
    LayoutAnimation.configureNext(dotIndicatorTransition);
  }, [currentIndex]);

  const handlePlayIconClick = () => {
    if (closeCard) {
      closeCard();
    }
    navigation.navigate('Pitch', { brand: brand });
    analytics.capture("Pitch interaction: initiated", {
      brandId: brand.id,
      brandName: brand.name,
      origin: parentTabName,
    });
    EventBus.getInstance().fireEvent("navigating", { navigate: true });
  };

  const handleBrandPress = () => {
    onBrandNamePress();
    navigation.navigate('Brand Profile', { brand });
  };

  const handleShare = async () => {
    try {
      const shareUrl = `${LANDING_PAGE_URL}/brand/${brand.id}`;
      await Share.share({
        url: shareUrl,
        message: `Check out ${brand.name} on ledge!`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const renderMediaItem = ({ item, index }) => {
    return (
      <View className="relative h-full rounded-2xl overflow-hidden" style={{ width: mediaWidth }}>
        {item.type === 'teaser' ? (
          <BrandTeaser
            videoRef={videoRef}
            mediaSource={item.mediaSource}
            shouldPlay={shouldPlay}
            isMuted={isMuted}
            preloadedUrl={item.preloadedUrl}
          />
        ) : (
          <ExtImage
            mediaSource={item.mediaSource}
            resizeMode="cover"
            style={{ width: '100%', height: '100%' }}
            preloadedUrl={item.preloadedUrl}
            className="w-full h-full rounded-2xl"
          />
        )}
        {/* Play and mute buttons */}
        <View className="absolute top-0 right-0 bottom-0 left-0 flex justify-center items-center">
          <TouchableOpacity
            className="z-30 border border-cream w-16 h-16 rounded-full flex justify-center items-center overflow-hidden"
            onPress={handlePlayIconClick}
          >
            { useBlur ? (
              <BlurView
                className="absolute w-full h-full rounded-full"
                intensity={20}
                tint="light"
              />
            ) : (
              <View
                className="absolute w-full h-full bg-cream opacity-50 rounded-full"
              />
            )}
            <PlayIcon width={20} height={20} className="text-cream" />
          </TouchableOpacity>
          <MuteButton isMuted={isMuted} onMute={onMute} />
        </View>
      </View>
    );
  };

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  return (
    <View className="rounded-2xl h-full w-full">
      <View className="flex-row justify-between items-start">
        <TouchableOpacity
          className="flex-row items-center flex-1"
          onPress={handleBrandPress}
        >
          {brand.founders && brand.founders.length > 0 && (
            <ExtImage
              mediaSource={brand.founders[0].image}
              quality="thumbnail"
              className="w-[50] h-[50] rounded-full"
              preloadedUrl={brand._preloadedUrls?.founder}
            />
          )}
          <View className="ml-5 p-0">
            <View className="flex-row items-center gap-2">
              <Text maxFontSizeMultiplier={1.5} className="text-lg text-ledge-black font-montserrat-alt-bold">
                {brand.name}
              </Text>
              <NewDotIndicator className="mt-0.5" show={isNew} />
            </View>
            <Text maxFontSizeMultiplier={1.7} className="text-sm text-ledge-black font-inter-light pb-1.5">
              {getFounderNamesString(brand.founders.map(founder => founder.name))}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleShare} className="pt-2 pr-2 mr-2 mt-1">
          <ShareBrand width={26} height={26} />
        </TouchableOpacity>
      </View>

      {textCondition ? (
        <View className="mt-4 mb-5">
          <Text
            className="text-md text-ledge-black self-center text-justify font-inter-small w-full"
            numberOfLines={3}
          >
            {brand.shortDescription?.[locale]}
          </Text>
        </View>
      ) : <View className="mb-5" />}

      <View
        className="flex-1 relative flex justify-center items-center"
        onLayout={(event) => {
          setMediaWidth(event.nativeEvent.layout.width);
        }}
        style={{ height: mediaHeight }}
      >
        <FlatList
          className="overflow-visible"
          data={mediaSources}
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
          style={{ maxWidth: mediaWidth }}
          nestedScrollEnabled
        />
      </View>
      <View className="flex-row justify-center mt-2.5 items-center">
        {Array.from({ length: mediaSources.length }, (_, index) => (
          <View
            key={index}
            className={`rounded-full m-1.5 ${currentIndex === index ? 'bg-blue h-2 w-2' : 'bg-blue-light h-1.5 w-1.5'}`}
          />
        ))}
      </View>
    </View>
  );
};

export default BrandCard;