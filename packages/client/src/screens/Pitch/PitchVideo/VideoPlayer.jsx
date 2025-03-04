import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StatusBar, Platform } from 'react-native';
const { useSelector } = require('react-redux');
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, Audio } from 'expo-av';
import mediaUrl from '../../../utils/media-url';
import HeaderInfo from './HeaderInfo';
import { useAnalytics } from '../../../hooks/useAnalytics';
import PlayPitch from './../../../assets/svg/playPitch.svg';
import PausePitch from './../../../assets/svg/pausePitch.svg';
import MutePitch from './../../../assets/svg/mutePitch.svg';
import UnmutePitch from './../../../assets/svg/unmutePitch.svg';
import SpeedPitch from './../../../assets/svg/speed-up-pitch.svg';
import EventBus from 'react-native-event-bus';

const VideoPlayer = ({
  videoRef,
  videoSource,
  setStatus,
  updateVideoValues,
  setVideoLayout,
  screenWidth,
  screenHeight,
  controlPanelHeight,
  showCaptions,
  currentCaption,
  brandName,
  founder,
  endVideo,
  isMuted,
  isSpeeded,
  onQuit = () => {},
}) => {
  const insets = useSafeAreaInsets();
  const analytics = useAnalytics();
  const user = useSelector((state) => state.users.data);
  const [isLoading, setIsLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState(null);
  const [pressCount, setPressCount] = useState(0);
  const [hasPlayedInitially, setHasPlayedInitially] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [showPauseIcon, setShowPauseIcon] = useState(false);
  const [showMuteIcon, setShowMuteIcon] = useState(null);
  const [showUnmuteIcon, setShowUnmuteIcon] = useState(false);
  const [showSpeedIcon, setShowSpeedIcon] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if ((process.env.NODE_ENV === 'development' || user?.superUser === true) && pressCount >= 5 ) {
      analytics.capture('Dev: pitch video skipped', {
        videoSource,
        type: 'devPitchVideoSkipped',
        details: {
          brandName,
        },
      });
      setPressCount(0);
      endVideo();
    }
  }, [pressCount]);

  useEffect(() => {
    const loadVideo = async () => {
      try {
        const url = await mediaUrl(videoSource);
        setVideoUrl(url);
        if (videoRef.current) {
          await videoRef.current.loadAsync({ uri: url }, { shouldPlay: true }, false);
        }
      } catch (error) {
        console.error('Error loading video:', error);
        setIsLoading(false);
      }
    };

    loadVideo();
    StatusBar.setBarStyle('light-content', true);
    return () => {
      StatusBar.setBarStyle('default', true);
    }
  }, [videoSource]);

  useEffect(() => {
    if(hasPlayedInitially) {
      if (isMuted) {
        setShowMuteIcon(true);
        setTimeout(() => setShowMuteIcon(false), 500);
      } else {
        setShowUnmuteIcon(true);
        setTimeout(() => setShowUnmuteIcon(false), 500);
      }
    }
  }, [isMuted]);

  useEffect(() => {
    if(hasPlayedInitially) {
      if (isSpeeded) {
        setShowSpeedIcon(true);
        setTimeout(() => setShowSpeedIcon(false), 500);
      }
    }
  }, [isSpeeded]);

  const onVideoLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    setVideoLayout({ width, height });
  };

  const onPlaybackStatusUpdate = (status) => {
    setStatus(status);
    if (status.isLoaded) {
      updateVideoValues();
      if (status.isPlaying) {
        EventBus.getInstance().fireEvent("hideBar", { show: false });
        setIsLoading(false);
      } else if (!status.isBuffering && !hasPlayedInitially) {
        videoRef.current?.playAsync();
        setHasPlayedInitially(true);
      }
      if (status.didJustFinish) {
        videoRef.current?.stopAsync();
        endVideo();
      }
    }
  };


  const videoHeight = Math.min(
    screenWidth * (16 / 9),
    screenHeight - controlPanelHeight,
  );

  const handleVideoLoad = useCallback(async () => {
    // play audio even when the phone is on silent mode
    if (Platform.OS === "ios") {
      Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    }
  }, []);

  const handlePress = async () => {
    if (isTransitioning || !videoRef.current) return;

    setIsTransitioning(true);

    try {
      const status = await videoRef.current.getStatusAsync();

      if (status.isPlaying) {
        await videoRef.current.pauseAsync();
        const newStatus = await videoRef.current.getStatusAsync();
        if (!newStatus.isPlaying && hasPlayedInitially) {
          setShowPauseIcon(true);
          setTimeout(() => setShowPauseIcon(false), 300);
        }
        EventBus.getInstance().fireEvent("hideBar", { show: true });

      } else {
        await videoRef.current.playAsync();
        const newStatus = await videoRef.current.getStatusAsync();
        if (newStatus.isPlaying && hasPlayedInitially) {
          setShowPlayIcon(true);
          setTimeout(() => setShowPlayIcon(false), 300);
        }
        EventBus.getInstance().fireEvent("hideBar", { show: false });
      }
    } catch (error) {
      console.error("Error handeling video:", error);
    } finally {
      setIsTransitioning(false);
    }
  };




  return (
    <View className="flex-1 relative">
      {isLoading && (
        <View
          className="absolute top-0 left-0 right-0 bottom-0 justify-center items-center bg-black bg-opacity-50 z-0"
          style={{
            width: screenWidth,
            height: videoHeight,
          }}
        >
          <ActivityIndicator size="large" color="#13476C" />
        </View>
      )}
      {videoUrl && (
        <TouchableOpacity onPress={handlePress} style={{ flex: 1 }}
          activeOpacity={1}
        >
          <Video
            ref={videoRef}
            style={{
              width: screenWidth,
              height: videoHeight,
            }}
            source={{ uri: videoUrl }}
            resizeMode="cover"
            onLayout={onVideoLayout}
            onPlaybackStatusUpdate={onPlaybackStatusUpdate}
            onLoad={handleVideoLoad}
            shouldPlay={true}
          />
          <View
            className="flex-1 w-full h-full absolute items-center justify-center"
          >
            {showPlayIcon && (
              <PlayPitch
                height={80}
                width={80}
                style={{ position: 'absolute', zIndex: showPauseIcon ? 1 : 2 }}
              />
            )}
            {showPauseIcon && (
              <PausePitch
                height={80}
                width={80}
                style={{ position: 'absolute', zIndex: showPlayIcon ? 1 : 2 }}
              />
            )}
            {showMuteIcon && (
              <MutePitch
                height={80}
                width={80}
                style={{ position: 'absolute', zIndex: showUnmuteIcon ? 1 : 2 }}
              />
            )}
            {showUnmuteIcon && (
              <UnmutePitch
                height={80}
                width={80}
                style={{ position: 'absolute', zIndex: showMuteIcon ? 2 : 1 }}
              />
            )}
            {showSpeedIcon && (
              <SpeedPitch
                height={100}
                width={100}
                style={{ position: 'absolute', zIndex: showSpeedIcon ? 2 : 1 }}
              />
            )}
          </View>
          {showCaptions && currentCaption.text && (
            <View className="absolute bottom-[3%] left-0 right-0 items-center z-50 bg-black bg-transparent p-2.5">
              <Text className="text-white text-base bg-blue opacity-80 px-2 max-w-[70%] text-center">
                {currentCaption.text}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.2)', 'rgba(0, 0, 0, 0)']}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: insets.top + 100
        }}
      />
      <HeaderInfo
        brandName={brandName}
        founder={founder}
        onPress={() => setPressCount(pressCount + 1)}
        onQuit={onQuit}
      />
    </View>
  );
};

export default VideoPlayer;
