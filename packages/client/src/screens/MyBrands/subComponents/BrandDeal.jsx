import React, { useMemo, useCallback } from 'react';
import { View, Text } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import PurpleCopy from '../../../assets/svg/purpleCopy.svg';
import RedCopy from '../../../assets/svg/red-copy.svg';
import Button from '../../../components/Button';
import FounderImages from './FounderImages';
import { useExternalUrl } from '../../../hooks/useExternalUrl';
import { useTranslation } from '../../../hooks/useTranslation';
import { useAnalytics } from '../../../hooks/useAnalytics';

function BrandDeal({brand, unlocked, onUnlock, onCopy}) {
  const { openExternalUrl } = useExternalUrl();
  const { t, locale } = useTranslation();
  const analytics = useAnalytics();

  // the backend returns only the dealcodes of the user (currently 1 max)
  const userDealGroups = brand.dealCodeGroups.filter(group => group.dealCodes.length > 0);
  let userDealCodes = [];
  for (const group of userDealGroups) {
    for (const dealCode of group.dealCodes) {
      userDealCodes.push({
        code: dealCode.code,
        description: group.description? group.description[locale] : t('brandProfile.deals.unlocked.description'),
        shortDescription: group.shortDescription? group.shortDescription[locale] : t('brandProfile.deals.buttons.copy'),
      });
    }
  }

  const dealTitle = useMemo(() => {
    if (unlocked) {
      return t('brandProfile.deals.unlocked.title');
    } else {
      return t('brandProfile.deals.locked.title');
    }
  }, [brand]);

  const dealDescription = useMemo(() => {
    if (unlocked && userDealCodes[0]) {
      return userDealCodes[0].description;
    } else {
      return t('brandProfile.deals.locked.description');
    }
  }, [brand]);

  const copyToClipboard = async (dealCode) => {
    await Clipboard.setStringAsync(dealCode);
    onCopy();
  };

  const handleRedeem = useCallback(() => {
    analytics.capture('Brand redeem link clicked', {
      brandId: brand.id,
      brandName: brand.name,
      url: brand.website,
      type: 'brandRedeemLinkPressed',
      details: {
        url: brand.website,
      }
     });
    openExternalUrl(brand.website, { brandId: brand.id })
  }, [brand, openExternalUrl, analytics]);

  return (
    <View
      className="w-full self-center justify-center items-center rounded-xl p-8 bg-white border border-1 border-gray"
    >
      <View className="flex-row justify-stretch items-stretch w-full gap-4 mb-8">
        <View className="flex-1">
          <FounderImages brand={brand} showNames showChristmasHat={false} />
        </View>
        <View className="w-[70%] min-h-20">
          <Text className="font-montserrat-alt-bold text-s mb-2">
            {dealTitle}
          </Text>
          <Text className="font-inter-light text-sm">
          {dealDescription}
          </Text>
        </View>
      </View>
      {unlocked && userDealCodes.map((dealCode, index) => (
        <Button
          key={index}
          onPress={() => copyToClipboard(dealCode.code)}
          className="w-full mb-2"
          color="gray"
        >
          <View className="flex-row items-center gap-3 max-w-full">
            <Text
              className={`font-inter-light text-md text-pink-dark max-w-[90%]`}
              numberOfLines={1}
            >
              {dealCode.shortDescription}
            </Text>
            <PurpleCopy width={17} height={17} />
          </View>
        </Button>
      ))}
      {unlocked ? (
        <Button
          onPress={handleRedeem}
          className="w-full"
          color="pink"
          big
        >
          <Text className="font-montserrat-alt-bold text-sm text-pink-dark">
            {brand.isCharity ? t('brandProfile.deals.buttons.charityRedeem') : t('brandProfile.deals.buttons.redeem')}
          </Text>
        </Button>
      ) : (
        <Button
          style={{ elevation: 2 }}
          className="w-full"
          color="gray"
          onPress={onUnlock}
          big
        >
          <Text className="font-montserrat-alt-bold text-sm text-pink-dark">
            {t('brandProfile.deals.buttons.connect')}
          </Text>
        </Button>
      )}
    </View>
  );
};

export default BrandDeal;
