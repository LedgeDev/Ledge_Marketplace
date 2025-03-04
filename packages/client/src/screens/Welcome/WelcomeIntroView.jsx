import React from 'react';
import { View, Text, ImageBackground, StatusBar, Image } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import Button from '../../components/Button';
import LogoWhite from '../../assets/logos/logo_white.png';
import ArrowRightWhite from '../../assets/svg/arrow-right-white.svg';

function WelcomeIntroView({ onGetStarted }) {
  const { t } = useTranslation();

  return (
    <>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ImageBackground
        source={require('../../assets/images/welcome/pinkLamp.jpeg')}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        {/* Dark overlay */}
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.3)'
        }} />

        {/* Ledge logo overlay */}
        <View className="absolute left-0 right-0 items-center" style={{ paddingTop: StatusBar.currentHeight + 64 }}>
          <Image
            source={LogoWhite}
            resizeMode="contain"
            className="w-40 h-16"
          />
        </View>

        {/* Bottom content */}
        <View className="absolute bottom-0 left-0 right-0 px-6 pt-10 pb-12 bg-white rounded-t-[32px] h-[30%]">
          <Text className="font-montserrat-alt-bold text-2xl mb-3 text-black">
            {t('welcome.introTitle')}
          </Text>
          <Text className="text-base mb-6 text-[#666666]">
            {t('welcome.introDescription')}
          </Text>
          <Button
            className="w-full"
            color="blue"
            big
            onPress={onGetStarted}
          >
            <View className="flex-row items-center justify-center space-x-2">
              <Text className="text-white font-montserrat-alt-bold">
                {t('welcome.getStarted')}
              </Text>
              <ArrowRightWhite width={20} height={20} />
            </View>
          </Button>
        </View>
      </ImageBackground>
    </>
  );
}

export default WelcomeIntroView;
