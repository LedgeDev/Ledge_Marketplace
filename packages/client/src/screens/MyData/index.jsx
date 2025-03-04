import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import TabScreenWrapper from '../../components/TabScreenWrapper';
import { useTranslation } from '../../hooks/useTranslation';
import MyData from './MyData';
import MyBenefits from './MyBenefits';
import BottomSheet from '../../components/BottomSheet';
import Button from '../../components/Button';
import ExtImage from '../../components/ExtImage';
import { useExternalUrl } from '../../hooks/useExternalUrl';
import { useAnalytics } from '../../hooks/useAnalytics';

function MyDataScreen() {
  const { t, locale } = useTranslation();
  const { openExternalUrl } = useExternalUrl();
  const [currentBenefit, setCurrentBenefit] = useState({});
  const bottomSheetModalRef = useRef(null);
  const startTimestamp = useRef(null);
  const endTimestamp = useRef(null);
  const analytics = useAnalytics();

  const handleRedeem = useCallback(async () => {
    analytics.capture('Benefit redeem link clicked', {
      benefitId: currentBenefit.id,
      benefitName: currentBenefit.title,
      url: currentBenefit.redeemLink,
      type: 'benefitRedeemLinkPressed',
      details: {
        url: currentBenefit.redeemLink,
      }
    });
    // Copy code to clipboard
    await Clipboard.setStringAsync(currentBenefit.code);
    await openExternalUrl(currentBenefit.redeemLink, { benefitId: currentBenefit.id });
  }, [currentBenefit, openExternalUrl]);

  const handleBenefitPress = useCallback((benefit) => {
    setCurrentBenefit(benefit);
    bottomSheetModalRef.current?.show(true);
  }, []);

  return (
    <View className="relative">
      <TabScreenWrapper
        tab1Name="myData.myData"
        tab2Name="myData.myBenefits"
        Tab1Component={MyData}
        Tab2Component={MyBenefits}
        onBenefitPress={handleBenefitPress}
        currentBenefit={currentBenefit}
        t={t}
      />
      <BottomSheet onClosed={() => setCurrentBenefit(null)} ref={bottomSheetModalRef} snapPoints={['90%']} noScroll manageNavButton>
        {currentBenefit && (
          <View className="flex-1">
            <View className="flex flex-row items-center gap-4 mb-5">
                <ExtImage
                  mediaSource={currentBenefit.logo}
                  className="rounded-full w-14 h-14 bg-gray"
                  quality="thumbnail"
                />

              <View>
                <Text className="text-xl font-montserrat-alt-bold">
                  {currentBenefit.subtitle? currentBenefit.subtitle[locale] : ''}
                </Text>
                <Text className="text-gray-600">with {currentBenefit.title}</Text>
              </View>
            </View>
            <View className="mb-5">
              <ExtImage
                mediaSource={currentBenefit.image}
                className="h-56 bg-gray rounded-2xl"
              />
            </View>
            <View className="flex-1 mb-5">
              <Text className="font-montserrat-alt-bold mb-3">
                About {currentBenefit.title}
              </Text>
              <Text>{currentBenefit.description ? currentBenefit.description[locale] : ''}</Text>
            </View>
            <View className="w-full justify-self-end mb-10">
              <Button
                onPress={handleRedeem}
                color="blue"
                big
              >
                <Text className="text-white font-montserrat-alt-bold">
                  {t('myBrands.interactionLabels.redeem')}
                </Text>
              </Button>
            </View>
          </View>
        )}
      </BottomSheet>
    </View>
  );
}

export default MyDataScreen;
