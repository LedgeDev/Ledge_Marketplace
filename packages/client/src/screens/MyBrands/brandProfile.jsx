import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ScrollView,
  View,
  Animated,
  Text,
  AppState,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ExtImage from '../../components/ExtImage';
import BrandDeal from './subComponents/BrandDeal';
import ImageSwipper from './subComponents/imageSwipper';
import ProductsView from './subComponents/products/productsView';
import AboutUs from './subComponents/aboutUs';
import Rating from './subComponents/brandRating';
import Divider from './subComponents/divider';
import BrandProfileStickyHeader from './subComponents/BrandProfileStickyHeader';
import CopyBlue from '../../assets/svg/copyBlue.svg';
import Heart from '../../assets/svg/V4Heart.svg';
import FeedbackList from './subComponents/FeedbackList';
import BottomSheet from '../../components/BottomSheet';
import ProductModal from './subComponents/products/productModal';
import Feedback from '../../components/Feedback';
import TopBlur from '../../components/TopBlur';
import { useTranslation } from '../../hooks/useTranslation';
import { addContentViews } from '../../store/models/users';
import EventBus from 'react-native-event-bus';
import { useAnalytics } from '../../hooks/useAnalytics';
import { checkBrandUnlocked } from '../../utils/brand-utils';
import { Share } from 'react-native';
import { LANDING_PAGE_URL } from '@env';

function BrandProfile({ route }) {
  const { brand } = route.params;
  const unlocked = useMemo(() => checkBrandUnlocked(brand), [brand]);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [isImageFixed, setIsImageFixed] = useState(false);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [showAddedToMyFavourites, setAddedToMyFavourites] = useState(false);
  const [added, setAdded] = useState(brand.inMyFavourites);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [selectedProduct, setSelectedProduct] = useState(null);
  const bottomSheetRef = useRef(null);
  const feedbackModalRef = useRef(null);
  const { t } = useTranslation();
  const foundersAmount = brand.founders.length;
  const navigation = useNavigation();
  const startTime = useRef(null);
  const analytics = useAnalytics();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const sendScreenTime = useCallback((startTimestamp) => {
    if (!startTimestamp) {
      return;
    }
    const endTimestamp = new Date();
    const durationInSeconds = Math.floor((endTimestamp - startTimestamp) / 1000);
    analytics.capture('Time in brand profile', {
      duration: durationInSeconds,
      brand: brand.name,
      type: 'timeInBrandProfile',
      brandId: brand.id,
      details: {
        duration: durationInSeconds,
      }
    });
  }, [analytics, brand.name]);

  useFocusEffect(
    useCallback(() => {
      EventBus.getInstance().fireEvent("showButton", { value: false });

      // add brand profile visit to user's content views (for you brands rotation)
      dispatch(addContentViews([{
        section: 'brandProfile',
        contentId: brand.id,
        contentType: 'brand',
        increment: 1,
      }]));

      // measure screen time and send the event to analytics provider
      startTime.current = new Date();

      const appStateListener = AppState.addEventListener(
        'change',
        (nextAppState) => {
          if (nextAppState === 'background') {
            sendScreenTime(startTime.current);
            startTime.current = null;
          } else if (nextAppState === 'active') {
            startTime.current = new Date();
          }
        },
      );

      return () => {
        appStateListener.remove();
        sendScreenTime(startTime.current);
        startTime.current = null;
      };
    }, [brand.id])
  );

  const handleShare = async () => {
    try {
      // Use the web URL for sharing - it will handle both app and non-app users
      const shareUrl = `${LANDING_PAGE_URL}/brand/${brand.id}`;

      await Share.share({
        url: shareUrl,
        message: `Check out ${brand.name} on ledge!`,
      });

      // Ideally notify to analytics provider that the user shared the brand after this
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleGoBack = () => {
    EventBus.getInstance().fireEvent("showButton", { value: true });
    if (unlocked) {
      navigation.navigate('My Brands');
    } else {
      navigation.navigate('Explore');
    }
  };

  const handleUnlock = () => {
    bottomSheetRef.current?.close();
    navigation.replace('Pitch', { brand: brand });
    analytics.capture("Pitch interaction: initiated", {
      type: "pitchInteractionInitiated",
      details: {
        origin: 'brandProfile',
      },
      brandId: brand.id,
      brandName: brand.name,
      origin: 'brandProfile',
    });
    EventBus.getInstance().fireEvent("navigating", { navigate: true });
    EventBus.getInstance().fireEvent("showButton", { value: false });
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        setIsImageFixed(offsetY >= 470);
      },
    },
  );

  const handleFadeOut = (condition) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      condition ? setShowCopiedMessage(false) : setAddedToMyFavourites(false);
    });
  };

  const showCopy = (condition) => {
    condition ? setShowCopiedMessage(true) : setAddedToMyFavourites(true);

    const fadeOutAfterDelay = () => {
      setTimeout(() => handleFadeOut(condition), 500);
    };

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start(fadeOutAfterDelay);
  };

  const handleLike = (condition) => {
    setAdded(condition);
    showCopy(false);
  };

  const showBottomSheet = (product) => {
    setSelectedProduct(product);
    bottomSheetRef.current?.show();
  };

  const closeBottomSheet = () => {
    bottomSheetRef.current?.close();
    setSelectedProduct(null);
  };


  const renderStickyLogo = () => {
    return (
      <>
        <TopBlur noTranslation labels />
        <View
          className="w-[40%] relative mx-auto z-30"
          style={{ paddingTop: insets.top }}
        >
          <ExtImage
            mediaSource={brand.brandLogo}
            resizeMode="contain"
            className="w-full h-[90] bg-transparent"
            quality="medium"
            transparent
          />
        </View>
      </>
    )
  };

  return (
    <View className="flex-1 relative">
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        stickyHeaderIndices={[1]}
        className="self-center overflow-visible bg-cream flex-1 w-full"
        showsVerticalScrollIndicator={true}
      >
        <ImageSwipper brand={brand}/>
        {renderStickyLogo()}
        <View className="px-7 pb-10">
          <BrandDeal
            brand={brand}
            unlocked={unlocked}
            onUnlock={handleUnlock}
            onCopy={() => showCopy(true)}
            founders={foundersAmount}
          />
          { brand.products?.length > 0 && (
            <>
              <Divider title={t('brandProfile.divider.products')} />
              <ProductsView
                brand={brand}
                unlocked={unlocked}
                onUnlock={handleUnlock}
                showBottomSheet={showBottomSheet}
                t={t}
              />
            </>
          )}
          <Divider title={t('brandProfile.divider.about')} />
          <AboutUs brand={brand}/>
          <Divider title={t('brandProfile.divider.advocates')} />
          <FeedbackList brand={brand} t={t} />
          <Rating
            brand={brand}
            t={t}
            foundersAmount={foundersAmount}
            bottomSheetRef={feedbackModalRef}
            founders={brand.founders}
            unlocked={unlocked}
          />
        </View>
      </ScrollView>
      <BrandProfileStickyHeader
        brand={brand}
        onLike={(condition) => handleLike(condition)}
        onShare={handleShare}
        onBack={handleGoBack}
        unlocked={unlocked}
      />
      {showCopiedMessage && (
        <Animated.View
          style={[{ opacity: fadeAnim }]}
          className="items-center absolute flex-row justify-center top-[50%] gap-[5] bg-[#F1F1F1] left-[25%] rounded-2xl w-[50%] h-[10%] z-10"
        >
          <CopyBlue width={16} height={16} />
          <Text style={{ color: '#13476C', marginLeft: 5 }}>
            {t('brandProfile.popUps.copied')}
          </Text>
        </Animated.View>
      )}
      {showAddedToMyFavourites && (
        <Animated.View
          style={[{ opacity: fadeAnim }]}
          className="items-center absolute flex-row justify-center top-[50%] gap-[5] bg-[#FBEDED] left-[20%] rounded-2xl w-[60%] h-[10%] z-10"
        >
          {added ? (
            <>
              <Heart width={16} height={16} />
              <Text className="color-[#C359AC]">{t('brandProfile.popUps.added')}</Text>
            </>
          ) : (
            <Text className="color-[#C359AC]">{t('brandProfile.popUps.removed')}</Text>
          )}
        </Animated.View>
      )}
      <BottomSheet ref={feedbackModalRef} enableDynamicSizing useFullWindowOverlay>
        <View className="pb-20">
          <Feedback
            onFinished={() => feedbackModalRef.current.close()}
            brand={brand}
            insideBottomSheet
          />
        </View>
      </BottomSheet>
      <BottomSheet ref={bottomSheetRef} snapPoints={['90%']} noScroll useFullWindowOverlay>
        {selectedProduct && (
          <ProductModal
            brand={brand}
            product={selectedProduct}
            unlocked={unlocked}
            onClose={closeBottomSheet}
            t={t}
            onConnect={handleUnlock}
          />
        )}
      </BottomSheet>
    </View>
  );
}

export default BrandProfile;
