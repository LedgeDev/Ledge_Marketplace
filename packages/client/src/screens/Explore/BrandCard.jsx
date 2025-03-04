import React, { useEffect } from 'react';
import { useEvent } from 'expo';
import { View, Text, TouchableOpacity } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import ExtImage from '../../components/ExtImage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../../hooks/useTranslation';
import { getVideoSource } from '../../utils/media-url';
import getFounderNamesString from '../../utils/founder-names-string';
import Actions from '../../assets/svg/actions.svg';

const Message = ({ brand }) => {
  const { locale } = useTranslation();
  return (
    <View className="w-full h-10 rounded-xl bg-white opacity-50"></View>
  );
};

const Labels = ({ brand }) => {
  const { locale } = useTranslation();
  return (
    <View className="flex flex-row items-center gap-4">
      {brand.labels.map((label, index) => (
        <View key={index} className="py-1 px-3 bg-white rounded-lg">
          <Text className="font-montserrat-alt text-black text-sm">{label[locale]}</Text>
        </View>
      ))}
    </View>
  );
};

const Media = ({ brand, shouldPlay = false, isMuted = false, onMute = () => {} }) => {

  const player = useVideoPlayer(getVideoSource(brand.teaser), player => {
    player.loop = true;
    player.muted = isMuted;
  });

  useEffect(() => {
    if (shouldPlay) {
      player.play();
    } else {
      player.pause();
    }
  }, [shouldPlay]);

  useEffect(() => {
    player.muted = isMuted;
  }, [isMuted]);

  return (
    <View className="absolute top-0 left-0 right-0 bottom-0 bg-blue">
      {brand.teaser ? (
        <VideoView
          style={{ width: '100%', height: '100%' }}
          player={player}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
          nativeControls={false}
          contentFit="cover"
        />
      ) : (
        <ExtImage
          mediaSource={brand.image}
          className="w-full h-full"
          resizeMode="cover"
        />
      )}
      <View className="absolute top-0 left-0 right-0 bottom-0">
        <LinearGradient
          colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.5)']}
          style={{ width: '100%', height: '100%' }}
        />
      </View>
    </View>
  );
};

const CardInfo = ({ brand, onNamePress = () => {} }) => {
  const { t, locale } = useTranslation();
  return (
    <View className="w-full gap-3 pb-20">
      <TouchableOpacity
        className="flex flex-row justify-between items-center"
        onPress={() => {
          onNamePress(brand);
        }}
      >
        <View className="flex flex-row items-center gap-2">
          <ExtImage
            mediaSource={brand.founders[0].image}
            className="w-16 h-16 rounded-full"
            resizeMode="cover"
          />
          <View>
            <Text className="font-inter text-white text-xl">{brand.name}</Text>
            <Text className="font-inter text-white text-sm opacity-60">{getFounderNamesString(brand.founders.map(founder => founder.name))}</Text>
          </View>
        </View>
        <TouchableOpacity>
          <Actions />
        </TouchableOpacity>
      </TouchableOpacity>
      <Text className="font-inter text-white text-sm ">{brand.shortDescription[locale]}</Text>
      <Labels brand={brand} />
      {/* <Message brand={brand} /> */}
    </View>
  );
};

const BrandCard = ({
  brand,
  shouldPlay = false,
  isMuted = false,
  onMute = () => {},
  // isNew = false,
  onNamePress = () => {},
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View className="relative flex-1 w-full">
      <Media brand={brand} shouldPlay={shouldPlay} isMuted={isMuted} onMute={onMute} />
      <View
        className="absolute flex flex-col justify-end items-center px-7"
        style={insets}
      >
        <CardInfo brand={brand} onNamePress={onNamePress} />
      </View>
    </View>
  );
};

export default BrandCard;