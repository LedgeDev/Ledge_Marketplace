import React from 'react';
import { View, Text, Image, Share, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Button from '../../components/Button';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useTranslation } from '../../hooks/useTranslation';
import { AvatarCanvas } from '../../utils/avatarGenerator/AvatarCanvas';
import ShareIcon from '../../assets/svg/share.svg';
import ValiProfilePicture from '../../assets/images/founderImages/valiProfilePicture.png';
import ZachProfilePicture from '../../assets/images/founderImages/zachProfilePicture.png';
import { LANDING_PAGE_URL } from '@env';

const FriendsInviteView = ({ profilePicture }) => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const userData = useSelector((state) => state.users.data);

  console.log('userData', userData);

  const handleStartExploring = () => {
    navigation.replace('Explore', { showTutorial: true, hideSplashScreenOnLoad: true });
  };

  const handleShare = async () => {
    try {
      const shareUrl = `${LANDING_PAGE_URL}/share/${userData.friendCode}`;

      await Share.share({
        url: shareUrl,
        message: `Join me on ledge! Use my friend code: ${userData.friendCode}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const renderProfilePicture = () => {
    if (profilePicture?.type === 'image') {
      return (
        <Image
          source={{ uri: profilePicture.uri }}
          style={{ width: 294, height: 294 }}
          resizeMode="cover"
          className="rounded-full"
        />
      );
    } else if (profilePicture?.type === 'avatar') {
      return (
        <AvatarCanvas {...profilePicture.data} size={200} containerSize={142} offsetX={12} />
      );
    }
    return null;
  };

  const renderSmallProfilePicture = () => {
    if (profilePicture?.type === 'image') {
      return (
        <Image
          source={{ uri: profilePicture.uri }}
          style={{ width: 40, height: 40 }}
          resizeMode="cover"
          className="rounded-full"
        />
      );
    } else if (profilePicture?.type === 'avatar') {
      return (
        <AvatarCanvas {...profilePicture.data} size={100} containerSize={35} offsetX={5} />
      );
    }
    return null;
  };

  const renderFriendCard = (name, location, profileImage) => (
    <View className="bg-white p-2">
      <View className="flex-row items-center">
        <Image
          source={profileImage}
          style={{ width: 48, height: 48 }}
          resizeMode="cover"
          className="rounded-full"
        />
        <View className="ml-3">
          <Text className="font-montserrat-alt-bold text-base">{name}</Text>
          <Text className="text-gray-600 text-sm">{location}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScreenWrapper>
      <View className="flex-1 w-full h-full px-7">
        <View className="flex-1 justify-center items-center">
          {renderProfilePicture()}

          <Text className="font-montserrat-alt-bold text-2xl text-center mb-3 mt-6">
            {t('friends.invite.title')}
          </Text>
          <Text className="text-center text-md mb-8">
            {t('friends.invite.subtitle')}
          </Text>

          <View className="w-full mb-4">
            <Text className="font-montserrat-alt-bold text-lg mb-4">My friends</Text>
            <View className="flex-col border border-[#F1F1F1] rounded-2xl overflow-hidden">
              <View className="bg-white p-4 border-b border-[#F1F1F1]">
                <View className="flex-row items-center">
                  <Image
                    source={ValiProfilePicture}
                    style={{ width: 48, height: 48 }}
                    resizeMode="cover"
                    className="rounded-full"
                  />
                  <View className="ml-3">
                    <Text className="font-montserrat-alt-bold text-base">Vali</Text>
                    <Text className="text-gray-600 text-sm">ledge co-founder · Munich, Germany</Text>
                  </View>
                </View>
              </View>
              <View className="bg-white p-4">
                <View className="flex-row items-center">
                  <Image
                    source={ZachProfilePicture}
                    style={{ width: 48, height: 48 }}
                    resizeMode="cover"
                    className="rounded-full"
                  />
                  <View className="ml-3">
                    <Text className="font-montserrat-alt-bold text-base">Zachi</Text>
                    <Text className="text-gray-600 text-sm">ledge co-founder · Munich, Germany</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <TouchableOpacity
            className="w-full"
            onPress={handleShare}
          >
            <View className="w-full bg-white rounded-2xl p-4 border border-[#13476c]">
              <View className="flex-row items-center">
                {renderSmallProfilePicture()}
                <View className="flex-1 ml-3">
                  <Text className="font-montserrat-alt-bold text-lg">{t('friends.invite.shareCode')}</Text>
                  <Text className="font-montserrat-alt-regular text-lg text-black mt-1">{userData.friendCode}</Text>
                </View>
                <ShareIcon width={24} height={24} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View className="w-full px-2 pb-8">
          <Button color="blue" onPress={handleStartExploring} big>
            <Text className="text-white font-montserrat-alt-bold">{t('friends.invite.startExploring')}</Text>
          </Button>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default FriendsInviteView;
