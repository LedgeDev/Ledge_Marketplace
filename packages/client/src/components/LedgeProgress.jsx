import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Image, Animated, LayoutAnimation, ActivityIndicator } from 'react-native';
import FlipCard from 'react-native-flip-card'
import Progress from '../assets/svg/progress.svg';
import levelColors from '../utils/level-colors';
import * as Haptics from 'expo-haptics';
import { AntDesign } from '@expo/vector-icons';

const CheckIcon = ({ color }) => (
  <AntDesign name="check" size={14} color={color} style={{ marginRight: 4 }} />
);

const ProgressStats = ({ user, colors, sidebar }) => (
  <>
    <ProgressRow
      achieved={user.levelQuestionnaireAnswerCount >= user.level.requiredAnswers}
      current={user.levelQuestionnaireAnswerCount}
      required={user.level.requiredAnswers}
      label="Questions Answered"
      colors={colors}
      sidebar={sidebar}
    />
    <ProgressRow
      achieved={user.brandsExplored >= user.level.requiredBrandsExplored}
      current={user.brandsExplored}
      required={user.level.requiredBrandsExplored}
      label="Brands Explored"
      colors={colors}
      sidebar={sidebar}
    />
  </>
);

const ProgressRow = ({ achieved, current, required, label, colors, sidebar }) => (
  <View className={`rounded-full ${sidebar ? 'px-2 py-0.5' : 'px-2 py-0.5'} ${label.includes('Questions') ? 'mb-1' : ''} self-start justify-center items-center`} style={{backgroundColor: colors.textBg}}>
    <View className="flex flex-row items-center">
      {achieved ? (
        <>
          <CheckIcon color={colors.dark} />
          <Text allowFontScaling={false} numberOfLines={1} className={`${sidebar ? 'text-sm' : 'text-base'}`} style={{color: colors.dark}}>
            All {label.toLowerCase()}
          </Text>
        </>
      ) : (
        <>
          <Text allowFontScaling={false} numberOfLines={1} className={`font-extrabold text-base ${sidebar ? '' : 'scale-125'}`} style={{color: colors.dark}}>{current}</Text>
          <Text allowFontScaling={false} numberOfLines={1} className={`${sidebar ? 'text-sm' : 'text-base'}`} style={{color: colors.dark}}> / {required} {label}</Text>
        </>
      )}
    </View>
  </View>
);

const BackSideContent = ({ user, colors, compact, sidebar }) => (
  <View>
    <Text allowFontScaling={false} className={`text-3xl font-montserrat-alt-bold mb-1 mt-1 text-white`}>
      {user.level.name}
    </Text>
    {user.foundersReached > 0 && (
      <Text maxFontSizeMultiplier={1.1} className="text-white mb-1">
        You already connected with <Text maxFontSizeMultiplier={1.1} className="font-bold text-2xl" style={{ color: colors.dark }}>{user.foundersReached}</Text> founders!
      </Text>
    )}
    {!compact && (
      <>
        <Text maxFontSizeMultiplier={1.1} className="text-white text-sm mb-1">
          {`${user.foundersReached > 0 ? "This means you're" : "You're"} in the top`} <Text style={{ color: colors.dark }}>{user.foundersReachedTopPercentage}%</Text> of the explorers
        </Text>
        {!sidebar && (
          <Text maxFontSizeMultiplier={1.1} className="text-white text-sm">
            Keep exploring and help the mission economy
          </Text>
        )}
      </>
    )}
  </View>
);

function LedgeProgress ({ compact, user, staggerTime = 2000, border = false, forcedPercentage, hideRocket, sidebar }) {
  const [perc, setPerc] = useState(0);
  const [colors, setColors] = useState({});
  const [frontCardHeight, setFrontCardHeight] = useState(0);
  const translateYCoverPercentage = useRef(new Animated.Value(0)).current;

  const answersWeight = 0.4;
  const brandsWeight = 0.6;
  const percOffset = 0;
  const animationTime = 1000;

  const calculateProgress = () => {
    if (forcedPercentage) return forcedPercentage;

    const brandsProgress = Math.min((parseInt(user.brandsExplored) / parseInt(user.level.requiredBrandsExplored)) * 100, 100);
    const answersProgress = Math.min((parseInt(user.levelQuestionnaireAnswerCount) / parseInt(user.level.requiredAnswers)) * 100, 100);
    return Math.round(brandsProgress * brandsWeight + answersProgress * answersWeight);
  };

  useEffect(() => {
    if (!user) return;

    const newPerc = calculateProgress();
    setPerc(newPerc);

    Animated.timing(translateYCoverPercentage, {
      toValue: -newPerc - percOffset,
      duration: animationTime,
      useNativeDriver: true,
    }).start();

    setColors(levelColors(user.level.order));
  }, [user, forcedPercentage, frontCardHeight]);

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [compact]);

  if (!user) {
    return (
      <View className={`relative items-start justify-between rounded-2xl ${compact? 'h-24' : 'h-36'} w-full overflow-visible ${ border ? 'border border-2 border-white px-3 py-2' : 'px-4 py-3'}`}>
        <ActivityIndicator color="#999999" />
      </View>
    );
  }

  return (
    <FlipCard
      className="py-6"
      flipHorizontal={true}
      flipVertical={false}
      onFlipStart={() => {
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft), 200);
      }}
    >
      {/* Face Side */}
      <View
        className={`relative items-start justify-between rounded-3xl ${compact? 'h-24' : 'h-42'} w-full overflow-visible ${ border ? 'border border-2 border-white px-3 py-2' : 'px-5 py-3'}`}
        style={{backgroundColor: colors.dark, outline: '1px solid white'}}
        onLayout={(event) => setFrontCardHeight(event.nativeEvent.layout.height)}
      >
        <Animated.View
          className={`z-10 absolute top-0 left-0 right-0 bottom-0 overflow-hidden ${border ? 'rounded-2xl' : 'rounded-3xl'}`}
        >
          <Animated.View
            className="z-10 absolute top-0 left-0 right-0 bottom-0"
            style={{
              transform: [{ translateY: translateYCoverPercentage.interpolate({ inputRange: [0, 100], outputRange: [0, frontCardHeight] }) }],
            }}
          >
            <Progress style={{ color: colors.bg }} />
          </Animated.View>
        </Animated.View>
        { !hideRocket && (
          <Image
            className={`z-20 absolute top-0 ${compact ? 'right-3 w-32' : '-right-5 w-48'} object-contain h-full overflow-visible`}
            source={require("../assets/images/rocket.png")}
          />
        )}
        <View className="z-20">
          <Text allowFontScaling={false} className="text-3xl font-montserrat-alt-bold mb-1 mt-1 text-white">
            {user?.level?.name}
          </Text>
          {user?.nextLevelName && (
            <View className={`rounded-full px-2 py-0.5 max-h-7 justify-center`} style={{backgroundColor: colors.textBg}}>
              <Text allowFontScaling={false} numberOfLines={1} className={`${sidebar ? 'text-md' : 'text-xs'}`} style={{color: colors.dark}}>
                {perc}% to become {user.nextLevelName}
              </Text>
            </View>
          )}
        </View>
        {!compact && (
          <View className="z-20">
            <ProgressStats user={user} colors={colors} sidebar={sidebar} />
          </View>
        )}
      </View>

      {/* Back Side */}
      <View
        className={`relative items-start justify-between rounded-3xl ${compact? 'h-24' : 'h-42'} w-full overflow-hidden px-5 py-3`}
        style={{backgroundColor: colors.bg}}
      >
        <BackSideContent user={user} colors={colors} compact={compact} sidebar={sidebar} />
      </View>
    </FlipCard>
  );
}

export default LedgeProgress;
