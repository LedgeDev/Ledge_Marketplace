import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView,LayoutAnimation } from 'react-native';
import HTMLView from 'react-native-htmlview';
import { useTranslation } from '../../../hooks/useTranslation';
import { useAnalytics } from '../../../hooks/useAnalytics';
import ExtImage from '../../../components/ExtImage';
import LineUp from '../../../assets/svg/arrow-line-up-grey.svg';
import LineDown from '../../../assets/svg/arrow-line-down-grey.svg';

function AboutUsScreen({ brand }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { locale } = useTranslation();
  const analytics = useAnalytics();

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
    analytics.capture("Read more button pressed", {
      value: brand.id,
      brand: brand.name,
      type: "readMoreButtonPressed",
      brandId: brand.id,
    })

  };

  return (
    <View className="w-full">
      <ExtImage
        className="rounded-2xl aspect-[2/1] mb-2 w-full"
        mediaSource={brand.teamPicture}
      />
      <Text className="font-montserrat-alt-bold text-2xl py-2 w-full">
        {brand.mainPhrase}
      </Text>
      { brand.description?.[locale]?.length > 0 && (
        <>
          <HTMLView
            value={isExpanded ? brand.description[locale] : brand.description[locale].substring(0, 200) + '...'}
            stylesheet={htmlStyles}
            paragraphBreak={'\n'}
            lineBreak={'\n'}
            additionalStyles={{
              div: { marginBottom: 0, marginTop: 0 },
              span: { marginBottom: 0, marginTop: 0 },
            }}
          />
          <TouchableOpacity
            onPress={handleToggle}
            className="mt-4 self-center justify-center items-center bg-gray rounded-3xl p-3"
          >
            <View
              style={styles.buttonContent}
              className="flex-row items-center gap-3 mx-4"
            >
              {isExpanded ? <LineUp style={styles.icon} /> : <LineDown style={styles.icon} />}
              <Text className="font-montserrat text-normal text-[#262C30] opacity-[0.6]">
                {isExpanded ? 'Show Less' : 'Read More'}
              </Text>
            </View>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const htmlStyles = StyleSheet.create({
  p: {
    textAlign: 'justify',
    marginBottom: 1,
    fontFamily: 'Montserrat-alt',

  },
  strong: {
    fontWeight: 'bold',
    color: '#262C30'
  }
});

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
});

export default AboutUsScreen;
