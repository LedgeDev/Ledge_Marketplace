import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, Pressable, Animated, Image } from 'react-native';
import PitchRewind from './../../../assets/images/pitch-rewind-button.png';
import PitchRewindPressed from './../../../assets/images/pitch-rewind-button-active.png';
import PitchMute from './../../../assets/images/pitch-mute-button.png';
import PitchMutePressed from './../../../assets/images/pitch-mute-button-active.png';
import PitchCaptions from './../../../assets/images/pitch-captions-button.png';
import PitchCaptionsPressed from './../../../assets/images/pitch-captions-button-active.png';
import PitchSpeed from './../../../assets/images/pitch-speed-button.png';
import PitchSpeedPressed from './../../../assets/images/pitch-speed-button-active.png';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EventBus from 'react-native-event-bus';
import * as Haptics from 'expo-haptics';

const formatTime = (milliseconds) => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const buttonSize = 45;

const ControlPanel = ({
  currentSection,
  isMuted,
  toggleMute = () => {},
  rewind10Seconds = () => {},
  showCaptions,
  toggleCaptions = () => {},
  isSpeeded,
  toggleSpeed = () => {},
  currentTime,
  duration,
  progress,
}) => {
  const insets = useSafeAreaInsets();
  const [bottomInset, setBottomInset] = useState(0);
  const [mutePressed, setMutePressed] = useState(false);
  const [rewindPressed, setRewindPressed] = useState(false);
  const [captionsPressed, setCaptionsPressed] = useState(false);
  const [speedPressed, setSpeedPressed] = useState(false);

  const backgroundColor = useRef(new Animated.Value(0)).current; // 0 for black, 1 for white

  useEffect(() => {
    if (insets.bottom > bottomInset) {
      setBottomInset(insets.bottom);
    }
  }, [insets]);

  useEffect(() => {
    const listener = EventBus.getInstance().addListener('hideBar', (data) => {
      Animated.timing(backgroundColor, {
        toValue: data.show ? 0 : 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      EventBus.getInstance().removeListener(listener);
    };
  }, [backgroundColor]);

  const interpolatedBackgroundColor = backgroundColor.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FCFBF8', '#262C3099'],
  });

  const handlePressIn = useCallback((button) => {
    Haptics.selectionAsync();
    if (button === 'mute') {
      setMutePressed(true);
    } else if (button === 'rewind') {
      setRewindPressed(true);
    } else if (button === 'captions') {
      setCaptionsPressed(true);
    } else if (button === 'speed') {
      setSpeedPressed(true);
    }
  }, []);

  const handlePressOut = useCallback((button) => {
    Haptics.selectionAsync();
    if (button === 'mute') {
      setMutePressed(false);
    } else if (button === 'rewind') {
      setRewindPressed(false);
    } else if (button === 'captions') {
      setCaptionsPressed(false);
    } else if (button === 'speed') {
      setSpeedPressed(false);
    }
  }, []);

  return (
    <View className="bg-cream flex flex-col px-6 py-6 gap-6 rounded-t-3xl">

      <View className="flex-row items-center justify-between h-12">
        <Text numberOfLines={2} className="font-montserrat-alt-bold">
          {currentSection.title}
        </Text>
      </View>

      <View className="flex-row justify-center gap-4">
        <Pressable
          onPress={rewind10Seconds}
          className="rounded-full relative"
          onPressIn={() => handlePressIn('rewind')}
          onPressOut={() => handlePressOut('rewind')}
        >
          { rewindPressed ? (
            <Image
              source={PitchRewindPressed}
              style={{ height: buttonSize, width: buttonSize, transform: [{scale: 0.95}] }}
            />
          ) : (
            <Image
              source={PitchRewind}
              style={{ height: buttonSize, width: buttonSize }}
            />
          )}
        </Pressable>
        <Pressable
          onPress={toggleMute}
          className="rounded-full relative"
          onPressIn={() => handlePressIn('mute')}
          onPressOut={() => handlePressOut('mute')}
        >
          {(isMuted || mutePressed) ? (
            <Image
              source={PitchMutePressed}
              style={{ height: buttonSize, width: buttonSize, transform: [{scale: 0.95}] }}
            />
          ) : (
            <Image
              source={PitchMute}
              style={{ height: buttonSize, width: buttonSize }}
            />
          )}
        </Pressable>
        <Pressable
          onPress={toggleCaptions}
          className="rounded-full relative"
          onPressIn={() => handlePressIn('captions')}
          onPressOut={() => handlePressOut('captions')}
        >
          {(showCaptions || captionsPressed) ? (
            <Image
              source={PitchCaptionsPressed}
              style={{ height: buttonSize, width: buttonSize, transform: [{scale: 0.95}] }}
            />
          ) : (
            <Image
              source={PitchCaptions}
              style={{ height: buttonSize, width: buttonSize }}
            />
          )}
        </Pressable>
        <Pressable
          onPress={toggleSpeed}
          className="rounded-full relative"
          onPressIn={() => handlePressIn('speed')}
          onPressOut={() => handlePressOut('speed')}
        >
          {(isSpeeded || speedPressed) ? (
            <Image
              source={PitchSpeedPressed}
              style={{ height: buttonSize, width: buttonSize, transform: [{scale: 0.95}] }}
            />
          ) : (
            <Image
              source={PitchSpeed}
              style={{ height: buttonSize, width: buttonSize }}
            />
          )}
        </Pressable>
      </View>

      <View className="flex-row items-center justify-between w-full px-3">
        <Text className="text-xs text-black">
          {formatTime(currentTime)}
        </Text>
        <View className="flex-1 h-2.5 rounded overflow-hidden mx-2.5">
          <View className="absolute top-[3px] left-0 w-full h-[30%] bg-ledge-black opacity-30" />
          <Animated.View
            style={{ width: `${progress * 100}%`, backgroundColor: interpolatedBackgroundColor }}
            className="h-[30%] my-auto  opacity-90"
          />
        </View>
        <Text className="text-xs text-black">{formatTime(duration)}</Text>
      </View>

    </View>
  );
};

export default ControlPanel;
