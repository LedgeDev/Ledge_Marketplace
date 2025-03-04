import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import ExtImage from './ExtImage';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const ProgressPicture = ({ size, strokeWidth, progress, imageUrl }) => {
  const offset = size * 0.15 ;
  const circumferenceRadius = (size - strokeWidth) / 2;
  const circumferenceLength = circumferenceRadius * 2 * Math.PI;
  const progressAnimation = useRef(new Animated.Value(0)).current;

  const imageSize = Math.floor(size - offset - strokeWidth);

  useEffect(() => {
    Animated.timing(progressAnimation, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [progress]);

  const strokeDashoffset = progressAnimation.interpolate({
    inputRange: [0, 100],
    outputRange: [circumferenceLength, 0],
    extrapolate: 'clamp',
  });

  return (
    <View className="relative rounded-full" style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          stroke="#F2C2C3"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={circumferenceRadius}
          strokeWidth={strokeWidth}
          opacity={0.3}
        />
        <AnimatedCircle
          stroke="#F2C2C3"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={circumferenceRadius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumferenceLength}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View
        className="absolute items-center justify-center"
        style={{
          width: size,
          height: size,
        }}
      >
        <ExtImage
          mediaSource={imageUrl}
          quality="medium"
          style={{
            width: imageSize,
            height: imageSize,
          }}
          className="rounded-full"
        />
      </View>
    </View>
  );
};

export default ProgressPicture;
