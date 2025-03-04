import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Dimensions, Animated, Easing } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import VideoPlayer from './VideoPlayer';
import ControlPanel from './ControlPanel';
import { throttle } from 'lodash';

const PitchPlayer = ({
  videoRef,
  videoSource,
  brandName,
  founder,
  captions,
  sections,
  endVideo,
  onQuit = () => {},
}) => {
  const [componentReloadKey, setComponentReloadKey] = useState(0);
  const [videoLayout, setVideoLayout] = useState({ width: 0, height: 0 });
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const navigation = useNavigation();
  const [status, setStatus] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const [showCaptions, setShowCaptions] = useState(false);
  const [isSpeeded, setIsSpeeded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentSection, setCurrentSection] = useState({
    start: 0,
    end: 0,
    text: null,
    index: -1,
  });
  const [currentCaption, setCurrentCaption] = useState({
    start: 0,
    end: 0,
    text: null,
    index: -1,
  });
  const [controlPanelHeight, setControlPanelHeight] = useState(120);
  const [hasSetControlPanelHeight, setHasSetControlPanelHeight] = useState(false);
  const [actualControlPanelHeight, setActualControlPanelHeight] = useState(120);
  const [animatedProgress] = useState(new Animated.Value(0));
  const animationRef = useRef(null);
  const [isRewindDisabled, setIsRewindDisabled] = useState(false);

  // Reload component when screen regains focus to prevent video playback issues
  useFocusEffect(
    useCallback(() => {
      setComponentReloadKey(prevKey => prevKey + 1);
    }, [])
  );

  const calculateAnimationDuration = useCallback((currentTime, totalDuration) => {
    const baseDuration = 250;
    const remainingTime = totalDuration - currentTime;
    return Math.min(Math.max(baseDuration, remainingTime / 10), 2000);
  }, []);

  useEffect(() => {
    if (status.isLoaded && !status.error) {
      const newProgress = status.positionMillis / status.durationMillis;
      setProgress(newProgress);

      if (status.isPlaying) {
        if (animationRef.current) {
          animationRef.current.stop();
        }

        const animationDuration = calculateAnimationDuration(status.positionMillis, status.durationMillis);

        animationRef.current = Animated.timing(animatedProgress, {
          toValue: newProgress,
          duration: animationDuration,
          easing: Easing.linear,
          useNativeDriver: false,
        });

        animationRef.current.start();
      }
    }
  }, [status, calculateAnimationDuration]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (status.isPlaying && videoRef.current) {
        videoRef.current.getStatusAsync().then((currentStatus) => {
          const currentProgress = currentStatus.positionMillis / currentStatus.durationMillis;
          animatedProgress.setValue(currentProgress);
        });
      }
    }, 33);

    return () => clearInterval(intervalId);
  }, [status.isPlaying]);

  useEffect(() => {
    if (!hasSetControlPanelHeight && videoLayout.height) {
      setControlPanelHeight(Math.max(120, screenHeight - videoLayout.height));
      setHasSetControlPanelHeight(true);
    }
  }, [videoLayout, screenHeight, hasSetControlPanelHeight]);

  const updateCaption = (positionMillis) => {
    const currentSeconds = positionMillis / 1000;
    if (currentSeconds >= captions[currentCaption.index + 1]?.start) {
      setCurrentCaption({
        ...captions[currentCaption.index + 1],
        index: currentCaption.index + 1,
      });
    } else if (currentSeconds < captions[currentCaption.index]?.start) {
      setCurrentCaption({
        ...captions[currentCaption.index - 1],
        index: currentCaption.index - 1,
      });
    }
  };

  const updateSection = (positionMillis) => {
    const currentSeconds = positionMillis / 1000;
    if (currentSeconds >= sections[currentSection.index + 1]?.start) {
      setCurrentSection({
        ...sections[currentSection.index + 1],
        index: currentSection.index + 1,
      });
    } else if (currentSeconds < sections[currentSection.index]?.start) {
      setCurrentSection({
        ...sections[currentSection.index - 1],
        index: currentSection.index - 1,
      });
    }
  };

  const updateVideoValues = () => {
    if (status.isLoaded && !status.error) {
      updateCaption(status.positionMillis);
      updateSection(status.positionMillis);
      setCurrentTime(status.positionMillis);
      setDuration(status.durationMillis);
    }
  };

  const handleClose = () => {
    if (!isNavigating) {
      videoRef.current?.unloadAsync();
      setIsNavigating(true);
      navigation.goBack();
    }
  };

  const handleQuit = () => {
    onQuit();
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.setIsMutedAsync(!isMuted);
      if (!isMuted && !showCaptions) {
        toggleCaptions();
      }
      setIsMuted(!isMuted);
    }
  };

  const rewind10Seconds = useCallback(
    throttle(() => {
      if (videoRef.current && status.positionMillis > 0) {
        setIsRewindDisabled(true); // Disable button

        const newPosition = Math.max(0, status.positionMillis - 10000);

        if (newPosition !== status.positionMillis) {
          videoRef.current
            .setPositionAsync(newPosition)
            .catch((error) => {
              console.warn("Seek interrupted or failed:", error);
            })
            .finally(() => {
              setIsRewindDisabled(false); // Re-enable button after seeking
            });
        } else {
          setIsRewindDisabled(false); // Re-enable button if no seeking
        }
      }
    }, 1000), // Allow rewinding only once every 1000ms
    [videoRef, status.positionMillis]
  );

  const toggleCaptions = () => {
    if (showCaptions && isMuted) {
      toggleMute();
    }
    setShowCaptions(!showCaptions);
  };

  const toggleSpeed = () => {
    if (isSpeeded) {
      videoRef.current?.setRateAsync(1, true);
    } else {
      videoRef.current?.setRateAsync(1.25, true);
    }
    setIsSpeeded(!isSpeeded);
  };

  return (
    <View key={componentReloadKey} className="flex-1 bg-black">
      <VideoPlayer
        videoRef={videoRef}
        videoSource={videoSource}
        setStatus={setStatus}
        updateVideoValues={updateVideoValues}
        setVideoLayout={setVideoLayout}
        screenWidth={screenWidth}
        screenHeight={screenHeight}
        controlPanelHeight={actualControlPanelHeight - 20}
        showCaptions={showCaptions}
        currentCaption={currentCaption}
        brandName={brandName}
        founder={founder}
        endVideo={endVideo}
        isMuted={isMuted}
        isSpeeded={isSpeeded}
        onQuit={handleQuit}
      />
      <View
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          setActualControlPanelHeight(height);
        }}
      >
        <ControlPanel
          currentSection={currentSection}
          isMuted={isMuted}
          toggleMute={toggleMute}
          rewind10Seconds={rewind10Seconds}
          showCaptions={showCaptions}
          toggleCaptions={toggleCaptions}
          isSpeeded={isSpeeded}
          toggleSpeed={toggleSpeed}
          currentTime={currentTime}
          duration={duration}
          progress={progress}
          animatedProgress={animatedProgress}
          controlsHeight={controlPanelHeight}
        />
      </View>
    </View>
  );
};

export default PitchPlayer;
