import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, Animated, Keyboard, Platform, TouchableWithoutFeedback } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile } from '../../store/models/users';
import Button from '../../components/Button';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useTranslation } from '../../hooks/useTranslation';
import { useAvatar } from '../../utils/avatarGenerator/useAvatar';
import { AvatarCanvas } from '../../utils/avatarGenerator/AvatarCanvas';
import UploadIcon from '../../assets/svg/upload.svg';
import ShuffleIcon from '../../assets/svg/shuffle.svg';
import PencilIcon from '../../assets/svg/pencil.svg';
import AvatarIcon from '../../assets/svg/avatar.svg';
import * as ImagePicker from 'expo-image-picker';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

const ProfileSetupView = ({ onComplete }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const userData = useSelector((state) => state.users.data);
  const locationFromStore = useSelector((state) => state.users.locationAnswer);
  const [name, setName] = useState(userData?.name || '');
  const [location, setLocation] = useState(locationFromStore || '');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [activeInput, setActiveInput] = useState(null);
  const translateY = useRef(new Animated.Value(0)).current;
  const nameInputOpacity = useRef(new Animated.Value(1)).current;
  const locationInputOpacity = useRef(new Animated.Value(1)).current;
  const locationInputTranslateY = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(1)).current;
  const inputsContainerTranslateY = useRef(new Animated.Value(0)).current;
  const finishButtonOpacity = useRef(new Animated.Value(1)).current;
  const titleOpacity = useRef(new Animated.Value(1)).current;
  const googlePlacesRef = useRef(null);

  const {
    avatar,
    uploadedImage,
    avatarCanvasRef,
    handleRandomizeAvatar,
    handleImageUpload,
  } = useAvatar();

  useEffect(() => {
    if (googlePlacesRef.current && locationFromStore) {
      googlePlacesRef.current.setAddressText(locationFromStore);
    }
  }, [locationFromStore]);

  const handleLocationSelect = (data, details) => {
    setLocation(data.description);
    setSelectedLocation(data.description);
  };

  const handleNext = async () => {
    let profilePicture;

    if (uploadedImage) {
      profilePicture = {
        type: 'image',
        uri: uploadedImage
      };
    } else {
      profilePicture = {
        type: 'avatar',
        data: avatar
      };
    }

    try {
      await dispatch(updateUserProfile({
        name,
        location: selectedLocation || location,
        profilePicture,
      }));
      onComplete(profilePicture);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        handleImageUpload(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const handleInputFocus = (inputType) => {
    setActiveInput(inputType);

    Animated.parallel([
      // Move entire screen up with different values for name and location
      Animated.timing(translateY, {
        toValue: inputType === 'location' ? -140 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      // Handle name input opacity
      Animated.timing(nameInputOpacity, {
        toValue: inputType === 'location' ? 0 : 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Handle location input opacity and position
      Animated.timing(locationInputOpacity, {
        toValue: inputType === 'name' ? 0 : 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Move location input up when name is focused or when location is focused
      Animated.timing(locationInputTranslateY, {
        toValue: inputType === 'location' ? -64 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      // Fade out buttons
      Animated.timing(buttonsOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      // Move inputs container closer to image
      Animated.timing(inputsContainerTranslateY, {
        toValue: -70,
        duration: 300,
        useNativeDriver: true,
      }),
      // Fade out finish button
      Animated.timing(finishButtonOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      // Fade out title and subtitle only for location input
      Animated.timing(titleOpacity, {
        toValue: inputType === 'location' ? 0 : 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handleInputBlur = () => {
    setActiveInput(null);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(nameInputOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(locationInputOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(locationInputTranslateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      // Fade in buttons
      Animated.timing(buttonsOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Move inputs container back to original position
      Animated.timing(inputsContainerTranslateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      // Fade in finish button
      Animated.timing(finishButtonOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Fade in title and subtitle
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handleOutsidePress = () => {
    Keyboard.dismiss();
    handleInputBlur();
  };

  return (
    <ScreenWrapper>
      <TouchableWithoutFeedback onPress={handleOutsidePress}>
        <Animated.View className="flex-1 w-full h-full px-7" style={{ transform: [{ translateY }] }}>
          <Animated.View className="mt-12" style={{ opacity: titleOpacity }}>
            <Text className="font-montserrat-alt-bold text-2xl text-center mb-3">
              {t('profile.setup.title')}
            </Text>
            <Text className="text-center text-md mb-2 text-gray-600">
              {t('profile.setup.subtitle')}
            </Text>
          </Animated.View>

          <View className="flex-1 items-center justify-start pt-12">
            <View className="items-center">
              <View className="w-80 h-80 rounded-full overflow-hidden mb-5">
                {uploadedImage ? (
                  <Image
                    source={{ uri: uploadedImage }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <AvatarCanvas ref={avatarCanvasRef} {...avatar} />
                )}
              </View>

              <Animated.View style={{ opacity: buttonsOpacity }} className="flex-row justify-center gap-4">
                <Button color="gray" onPress={handleImagePick} small>
                  <View className="flex-row items-center gap-2 px-2">
                    <Text className="text-m">Upload</Text>
                    <UploadIcon width={16} height={16} />
                  </View>
                </Button>
                <Button
                  color="gray"
                  onPress={() => {
                    if (uploadedImage) {
                      handleImageUpload(null); // Clear the uploaded image
                    }
                    handleRandomizeAvatar();
                  }}
                  className="w-[120px]"
                  small
                >
                  <View className="flex-row items-center gap-2 px-2">
                    <Text className="text-m">{uploadedImage ? 'Avatar' : 'Shuffle'}</Text>
                    {uploadedImage ? (
                      <AvatarIcon width={16} height={16} className="text-gray-700" />
                    ) : (
                      <ShuffleIcon width={16} height={16} className="text-gray-700" />
                    )}
                  </View>
                </Button>
              </Animated.View>
            </View>

            <Animated.View
              style={{
                transform: [{ translateY: inputsContainerTranslateY }],
                width: '100%'
              }}
              className="space-y-6 mt-8 relative"
            >
              <Animated.View
                style={{
                  opacity: nameInputOpacity,
                  position: 'absolute',
                  width: '100%',
                  zIndex: 1
                }}
                className="bg-white rounded-4xl p-4 flex-row items-center shadow-sm mb-2"
              >
                <TextInput
                  ref={(input) => { this.nameInput = input; }}
                  value={name}
                  onChangeText={setName}
                  placeholder="Name"
                  className="flex-1 font-montserrat-alt-bold text-center"
                  onFocus={() => handleInputFocus('name')}
                  onBlur={handleInputBlur}
                />
                <TouchableOpacity
                  onPress={() => this.nameInput?.focus()}
                >
                  <PencilIcon width={14} height={14} />
                </TouchableOpacity>
              </Animated.View>

              <Animated.View
                style={{
                  opacity: locationInputOpacity,
                  transform: [{ translateY: locationInputTranslateY }],
                  position: 'absolute',
                  width: '100%',
                  top: 64,
                  zIndex: 2
                }}
                className="bg-white rounded-4xl p-4 flex-row items-center shadow-sm"
                keyboardShouldPersistTaps="handled"
              >
                <GooglePlacesAutocomplete
                  ref={googlePlacesRef}
                  placeholder="Location"
                  onPress={(data, details = null) => {
                    handleLocationSelect(data, details);
                    handleInputBlur();
                  }}
                  listViewDisplayed={false}
                  query={{
                    key: process.env.GOOGLE_MAPS_API_KEY,
                    language: 'en',
                    types: '(cities)',
                  }}
                  fetchDetails={true}
                  enablePoweredByContainer={false}
                  styles={{
                    container: {
                      flex: 1,
                      marginHorizontal: -8,
                      marginTop: 6,
                      height: 14,
                    },
                    textInput: {
                      textAlign: 'center',
                      backgroundColor: 'transparent',
                      fontSize: 14,
                      marginTop: -18,

                    },
                    clearButton: {
                      padding: 40,
                      marginTop: -40,
                      marginRight: 45,
                    },
                    listView: {
                      position: 'absolute',
                      top: 45,
                      left: 0,
                      right: 0,
                      backgroundColor: '#ffffff',
                      borderRadius: 8,
                      zIndex: 2,
                      maxHeight: 124,
                    },
                    row: {
                      padding: 13,
                      height: 30,
                      flexDirection: 'row',
                    },
                    separator: {
                      height: 1,
                      backgroundColor: '#e5e7eb',
                    },
                  }}
                  textInputProps={{
                    className: "rounded-lg font-montserrat-alt-regular text-base",
                    multiline: false,
                    underlineColorAndroid: 'transparent',
                    onFocus: () => handleInputFocus('location'),
                    onBlur: handleInputBlur,
                    ref: (input) => { this.locationTextInput = input; }
                  }}
                  onFail={(error) => console.error('Places API Error:', error)}
                />
                {activeInput !== 'location' && (
                  <TouchableOpacity
                    onPress={() => this.locationTextInput?.focus()}
                  >
                    <PencilIcon width={14} height={14} />
                  </TouchableOpacity>
                )}
              </Animated.View>
            </Animated.View>
          </View>

          <Animated.View
            className="mb-8"
            style={{ opacity: finishButtonOpacity }}
          >
            <Button color="blue" onPress={handleNext} big>
              <Text className="text-white font-montserrat-alt-bold">Finish</Text>
            </Button>
          </Animated.View>
        </Animated.View>
      </TouchableWithoutFeedback>
    </ScreenWrapper>
  );
};

export default ProfileSetupView;
