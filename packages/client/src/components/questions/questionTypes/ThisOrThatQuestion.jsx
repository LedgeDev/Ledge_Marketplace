import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import {
  GestureHandlerRootView,
  PanGestureHandler,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  withTiming,
  withDelay,
  interpolateColor,
  interpolate,
} from 'react-native-reanimated';
import { useSelector } from 'react-redux';
import mediaUrl from '../../../utils/media-url';
import ArrowBendDownLeftIcon from '../../../assets/svg/arrow-bend-down-left-white.svg';
import HandPointingIcon from '../../../assets/svg/hand-pointing-white.svg';
import { useTranslation } from '../../../hooks/useTranslation';

const { width, height } = Dimensions.get('window');

const ThisOrThatQuestion = ({ question, answer, onAnswersChange, isOnboarding }) => {
  const categoriesOnboarding = useSelector((state) => state.users.categoriesOnboarding);
  const usersStatus = useSelector((state) => state.users.status);

  const questionToPass = useMemo(() => {
    if (isOnboarding && categoriesOnboarding?.length > 0) {
      const options = categoriesOnboarding.map((category) => ({
        id: category.id,
        image: category.image,
        value: category.name,
        en: category.name.en,
        de: category.name.de,
      }));
      return {
        ...question,
        options,
      };
    }
    return question;
  }, [question, categoriesOnboarding, isOnboarding]);

  if (isOnboarding && categoriesOnboarding === null || usersStatus === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#999999" />
      </View>
    );
  }

  if (categoriesOnboarding?.length === 0) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>No brands available for you</Text>
      </View>
    );
  }

  return (
    <>
      {questionToPass?.options?.length > 0 && (
        <Cards
          question={questionToPass}
          answer={answer}
          onAnswersChange={onAnswersChange}
        />
      )}
    </>
  );
};

const Cards = ({ question, answer, onAnswersChange }) => {
  const maxCards = Math.min(7, question.options.length);
  const { locale } = useTranslation();
  const options = question.options;

  const likeOpacity = options.map(() => useSharedValue(0));
  const nopeOpacity = options.map(() => useSharedValue(0));
  const translateX = options.map(() => useSharedValue(0));
  const rotate = options.map(() => useSharedValue(0));
  const overlayColors = options.map(() => useSharedValue(0));

  const [cardIndexes, setCardIndexes] = useState(
    Array.from({ length: maxCards }, (_, i) => i),
  );

  const [disabledHandlers, setDisabledHandlers] = useState(
    Array(options.length).fill(false),
  );
  const zIndexes = options.map((_, index) => useSharedValue(maxCards - index));
  const opacity = options.map(() => useSharedValue(1));

  const [localAnswers, setLocalAnswers] = useState(() => {
    const initialAnswers = {};
    options.forEach(option => {
      initialAnswers[option.id] = { answer: null, value: option.value };
    });
    return initialAnswers;
  });

  const [showOverlay, setShowOverlay] = useState(true);
  const overlayOpacity = useSharedValue(1);
  const handPosition = useSharedValue(0);
  const [imageUrls, setImageUrls] = useState({});

  useEffect(() => {
    const loadImageUrls = async () => {
      const urls = {};
      for (let option of options) {
        urls[option.id] = await mediaUrl(option.image);
      }
      setImageUrls(urls);
    };
    loadImageUrls();
  }, [options]);

  useEffect(() => {
    const timer = setTimeout(() => {
      overlayOpacity.value = withTiming(0, { duration: 500 }, () => {
        runOnJS(setShowOverlay)(false);
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showOverlay) {
      startHandAnimation();
    }
  }, [showOverlay]);

  const handStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: handPosition.value }],
  }));

  const likeStyles = cardIndexes.map((_, index) =>
    useAnimatedStyle(() => ({
      opacity: likeOpacity[index].value,
      position: 'absolute',
      bottom: '20%',
      left: '10%',
      zIndex: 10,
    })),
  );

  const nopeStyles = cardIndexes.map((_, index) =>
    useAnimatedStyle(() => ({
      opacity: nopeOpacity[index].value,
      position: 'absolute',
      bottom: '20%',
      right: '10%',
      zIndex: 10,
    })),
  );

  const overlayStyles = cardIndexes.map((_, index) =>
    useAnimatedStyle(() => {
      const backgroundColor = interpolateColor(
        overlayColors[index].value,
        [-1, 0, 1],
        ['rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0)', 'rgba(255, 255, 255, 0.4)']
      );
      
      return {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor,
        zIndex: 1,
      };
    }),
  );

  const startHandAnimation = () => {
    handPosition.value = withTiming(-100, { duration: 500 }, () => {
      handPosition.value = withTiming(100, { duration: 1000 }, () => {
        handPosition.value = withTiming(0, { duration: 500 });
      });
    });
  };

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const updateCardIndex = (index, newIndex) => {
    setCardIndexes((prevIndexes) => {
      const updatedIndexes = [...prevIndexes];
      updatedIndexes[index] = newIndex;
      return updatedIndexes;
    });
  };

  const updatedZIndexes = (index) => {
    setTimeout(() => {
      zIndexes.forEach((zIndex, i) => {
        zIndex.value = i === index ? 1 : zIndex.value + 1;
      });
    }, 200);
  };

  const toggleHandlerEnabled = (index, enabled) => {
    setDisabledHandlers((prev) => {
      const updated = [...prev];
      updated[index] = !enabled;
      return updated;
    });
    if (!enabled) {
      setTimeout(() => {
        setDisabledHandlers((prev) => {
          const updated = [...prev];
          updated[index] = enabled;
          return updated;
        });
      }, 1000);
    }
  };

  const updateAnswers = (optionId, answer) => {
    const updatedAnswers = { ...localAnswers };
    updatedAnswers[optionId] = answer;
    setLocalAnswers(updatedAnswers);
    onAnswersChange(updatedAnswers);
  };

  const gestureHandlers = cardIndexes.map((_, index) =>
    useAnimatedGestureHandler({
      onStart: (_, context) => {
        context.startX = translateX[index].value;
      },
      onActive: (event, context) => {
        translateX[index].value = context.startX + event.translationX;
        rotate[index].value =
          -Math.sign(translateX[index].value) *
          (translateX[index].value / width) *
          15;

        if (translateX[index].value > 0) {
          overlayColors[index].value = Math.min(
            Math.abs(translateX[index].value) / (width / 2),
            1
          );
          likeOpacity[index].value =
            Math.min(translateX[index].value / (width / 2.5), 1) * 1;
          nopeOpacity[index].value = 0;
        } else {
          overlayColors[index].value = Math.min(
            Math.abs(translateX[index].value) / (width / 2),
            1
          ) * -1;
          nopeOpacity[index].value =
            Math.min(Math.abs(translateX[index].value) / (width / 2.5), 1) * 1;
          likeOpacity[index].value = 0;
        }
      },
      onEnd: () => {
        if (Math.abs(translateX[index].value) > width / 2.5) {
          const optionId = options[cardIndexes[index]].id;
          const data = {
            answer: translateX[index].value > 0,
            value: options[cardIndexes[index]].value,
          };

          runOnJS(updateAnswers)(optionId, data);
          runOnJS(toggleHandlerEnabled)(index, false);
          const newIndex = cardIndexes[index] + maxCards;
          runOnJS(updateCardIndex)(index, newIndex);

          translateX[index].value = withSpring(
            width * Math.sign(translateX[index].value),
            {},
            () => {
              translateX[index].value = 0;
              rotate[index].value = 0;
              likeOpacity[index].value = 0;
              nopeOpacity[index].value = 0;
              overlayColors[index].value = 0;
              runOnJS(toggleHandlerEnabled)(index, true);
            },
          );

          runOnJS(updatedZIndexes)(index);

          if (newIndex >= options.length) {
            opacity[index].value = withDelay(
              500,
              withTiming(0, { duration: 0 }),
            );
          }
        } else {
          translateX[index].value = withSpring(0);
          rotate[index].value = withSpring(0);
          likeOpacity[index].value = withTiming(0);
          nopeOpacity[index].value = withTiming(0);
          overlayColors[index].value = withTiming(0);
        }
      },
    }),
  );

  const cardStyles = cardIndexes.map((_, index) =>
    useAnimatedStyle(() => ({
      transform: [
        { translateX: translateX[index].value },
        { rotate: `${rotate[index].value}deg` },
      ],
      zIndex: zIndexes[index].value,
      opacity: opacity[index].value,
    })),
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="mb-10" style={styles.titlesContainer}>
        <Text maxFontSizeMultiplier={1.5} className="font-montserrat-alt-bold text-ledge-black text-2xl">
          {question.question[locale]}
        </Text>
        <Text maxFontSizeMultiplier={1.5} className="font-inter-light text-ledge-black opacity-70 text-base">
          {question.subtitle[locale]}
        </Text>
      </View>
      <View style={styles.container}>
        <View style={styles.cardContainer}>
          {cardIndexes.map((cardIndex, index) => (
            <React.Fragment key={index}>
              <PanGestureHandler
                onGestureEvent={gestureHandlers[index]}
                enabled={!disabledHandlers[index]}
              >
                <Animated.View style={[styles.card, cardStyles[index]]}>
                  {showOverlay && index === 0 && (
                    <Animated.View style={[styles.overlay, overlayStyle]}>
                      <View className="w-2/3 mx-auto">
                        <Text className="font-montserrat-alt-bold text-white text-2xl text-center">
                          Swipe right for yes & left for no.
                        </Text>
                        <View className="flex-row justify-center mt-4">
                          <ArrowBendDownLeftIcon
                            width={30}
                            height={30}
                            style={{ marginRight: 25 }}
                          />
                          <ArrowBendDownLeftIcon
                            width={30}
                            height={30}
                            style={{
                              transform: [{ scaleX: -1 }],
                              marginLeft: 25,
                            }}
                          />
                        </View>
                        <View className="items-center">
                          <Animated.View style={handStyle}>
                            <HandPointingIcon width={40} height={40} />
                          </Animated.View>
                        </View>
                      </View>
                    </Animated.View>
                  )}
                  <ImageBackground
                    source={{
                      uri: imageUrls[options[cardIndex % options.length].id],
                    }}
                    style={{ flex: 1, width: '100%', height: '100%' }}
                  >
                    <Animated.View style={overlayStyles[index]} />
                    <View style={styles.textContainer}>
                      <Text className="font-montserrat-alt text-[#234669]">
                        {options[cardIndex % options.length][locale]}
                      </Text>
                    </View>
                    <Animated.View
                      style={[styles.likeText, likeStyles[index]]}
                    >
                      <Text style={styles.like}>Like</Text>
                    </Animated.View>
                    <Animated.View
                      style={[styles.dislikeText, nopeStyles[index]]}
                    >
                      <Text style={styles.dislike}>Nope</Text>
                    </Animated.View>
                  </ImageBackground>
                </Animated.View>
              </PanGestureHandler>
            </React.Fragment>
          ))}
        </View>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  titlesContainer: {
    alignItems: 'flex-start',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  textContainer: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    backgroundColor: '#FCFBF8',
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 10,
    maxWidth: '90%',
  },
  cardContainer: {
    width: width - 55,
    height: height / 2,
    position: 'relative',
    backgroundColor: 'transparent',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e8e8e8',
    overflow: 'hidden',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  dislikeText: {
    zIndex: 10,
    color: '#D9D9D9',
    borderColor: '#D9D9D9',
    borderWidth: 5,
    borderRadius: 10,
    padding: 5,
  },
  dislike: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#D9D9D9',
  },
  likeText: {
    zIndex: 10,
    color: '#234669',
    borderColor: '#234669',
    borderWidth: 5,
    borderRadius: 10,
    padding: 5,
  },
  like: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#234669',
  },
});

export default ThisOrThatQuestion;
