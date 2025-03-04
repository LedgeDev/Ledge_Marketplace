import React, { useEffect } from 'react';
import { View, Image, Text, Dimensions, TouchableOpacity, ImageBackground, StatusBar, Linking } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuthService } from '../../services/authService';
import { useDispatch, useSelector } from 'react-redux';
import { getOrCreateUser } from '../../store/models/users';
import Button from '../../components/Button';
import LogoWhite from '../../assets/logos/logo_white.png';
import GoogleLogin from '../../assets/logos/google.png';
import AppleLogin from '../../assets/logos/apple.png';
import { fetchRandomBackground } from '../../store/models/loginBackgroundImages';

function MobileLogin() {
  const { t, currentLanguage } = useTranslation();
  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;
  const { handleLogin, initializeAuth } = useAuthService();
  const dispatch = useDispatch();
  const { currentImage } = useSelector((state) => state.loginBackgroundImages);

  useEffect(() => {
    initializeAuth();
    dispatch(fetchRandomBackground());
  }, [dispatch]);

  const handleLoginPress = async () => {
    const [email, name] = await handleLogin();
    if (!email) return;
    try {
      dispatch(getOrCreateUser({ email: email, name: name }));
    } catch (error) {
      console.error('Error creating user', error);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={{ flex: 1, backgroundColor: 'black' }}>
        <ImageBackground
          source={typeof currentImage === 'string' ? { uri: currentImage } : currentImage}
          style={{
            width: windowWidth,
            height: windowHeight,
            position: 'absolute',
            top: 0,
            left: 0,
          }}
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

          <View style={{
            flex: 1,
            paddingHorizontal: 24,
            paddingBottom: 48,
            paddingTop: StatusBar.currentHeight + 64,
            justifyContent: 'space-around'
          }}>
            {/* Top section */}
            <View className="items-center">
              <Image
                source={LogoWhite}
                resizeMode="contain"
                className="w-40 h-16"
              />
            </View>

            {/* Bottom section with hashtag and buttons - moved up */}
            <View
              className="w-full space-y-12"
              style={{ marginTop: windowHeight * 0.35 }}
            >
              <Text className="text-white text-2xl font-montserrat-alt-bold text-left mb-8">#foundonledge</Text>
              <View className="w-full space-y-8">
                <Button
                  className="w-full mb-5"
                  color="blue"
                  big
                  onPress={handleLoginPress}
                >
                  <Text className="text-white font-montserrat-alt-bold">
                    {t('welcome.logIn')}
                  </Text>
                </Button>

                <Button
                  className="w-full"
                  color="white"
                  big
                  onPress={handleLoginPress}
                >
                  <Text className="font-montserrat-alt-bold" style={{ color: '#13476C' }}>
                    {t('welcome.createAccount')}
                  </Text>
                </Button>

                {/* Separator */}
                <View className="flex flex-row items-center mt-10 mb-6">
                  <View className="flex-1 h-px bg-white opacity-50"></View>
                  <Text className="text-white mx-4">{t('welcome.continueWith')}</Text>
                  <View className="flex-1 h-px bg-white opacity-50"></View>
                </View>

                {/* Social Login Buttons */}
                <View className="flex flex-row justify-center gap-4 mb-20">
                  <TouchableOpacity
                    onPress={handleLoginPress}
                    className="bg-black rounded-xl w-[60] h-[60] shadow-sm"
                    style={{ borderWidth: 1, borderColor: 'white' }}
                  >
                    <Image
                      source={AppleLogin}
                      resizeMode="contain"
                      className="w-8 h-8 mx-auto my-auto transform -translate-y-0.5"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleLoginPress}
                    className="bg-white rounded-xl w-[60] h-[60] shadow-sm"
                  >
                    <Image
                      source={GoogleLogin}
                      resizeMode="contain"
                      className="w-8 h-8 mx-auto my-auto transform -translate-y-0.5"
                    />
                  </TouchableOpacity>
                </View>

                {/* Terms Text */}
                <View className="text-center text-sm text-white opacity-70">
                  <Text style={{ color: 'white', textAlign: 'center' }}>
                    {t('welcome.termsText')
                      .split(currentLanguage === 'de' ? 'AGB' : 'Terms & Conditions')
                      .map((part, i) => {
                        if (i === 0) {
                          return (
                            <Text key={i} style={{ color: 'white', textAlign: 'center' }}>
                              {part}
                              <Text
                                className="font-bold"
                                style={{ color: 'white', textAlign: 'center' }}
                                onPress={() => Linking.openURL('https://www.ledge.eu/terms-and-conditions')}
                              >
                                {currentLanguage === 'de' ? 'AGB' : 'Terms & Conditions'}
                              </Text>
                            </Text>
                          );
                        }
                        return (
                          <Text key={i} style={{ color: 'white', textAlign: 'center' }}>
                            {part.split(currentLanguage === 'de' ? 'Datenschutzrichtlinien' : 'Privacy Policy').map((subPart, j) => {
                              if (j === 0) {
                                return (
                                  <Text key={j} style={{ color: 'white', textAlign: 'center' }}>
                                    {subPart}
                                    <Text
                                      className="font-bold"
                                      style={{ color: 'white', textAlign: 'center' }}
                                      onPress={() => Linking.openURL('https://www.ledge.eu/privacy-policy')}
                                    >
                                      {currentLanguage === 'de' ? 'Datenschutzrichtlinien' : 'Privacy Policy'}
                                    </Text>
                                  </Text>
                                );
                              }
                              return <Text key={j} style={{ color: 'white', textAlign: 'center' }}>{subPart}</Text>;
                            })}
                          </Text>
                        );
                    })}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ImageBackground>
      </View>
    </>
  );
}

export default MobileLogin;
