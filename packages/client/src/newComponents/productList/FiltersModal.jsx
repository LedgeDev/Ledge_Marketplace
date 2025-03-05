import React, { useCallback, useEffect } from 'react';
import {
  View,
  Modal,
  Text,
  SafeAreaView,
  Pressable,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  LinearTransition
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Button from '../Button';
import CloseIcon from '../../assets/svg/close-gray.svg';

const screenHeight = Dimensions.get('window').height;

const FiltersModal = ({
  title = '',
  brands = [],
  visible = false,
  setModalVisible = () => {},
  children,
  onClear = () => {},
  onDone = () => {},
}) => {
  const cardTranslateY = useSharedValue(screenHeight);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const handleClear = useCallback(() => {
    Haptics.selectionAsync();
    onClear();
  }, [onClear]);

  const handleDone = useCallback(() => {
    onDone();
  }, [onDone]);

  useEffect(() => {
    if (visible) {
      cardTranslateY.value = withTiming(0, { easing: Easing.out(Easing.quad) });
    } else {
      cardTranslateY.value = withTiming(screenHeight, { easing: Easing.in(Easing.quad) });
    }
  }, [visible]);

  return (
    <Modal
      animationType="fade"
      visible={visible}
      transparent={true}
      onRequestClose={() => setModalVisible(false)}
    >
      <Pressable
        className="w-full h-full"
        onPressIn={() => setModalVisible(false)}
      >
        <SafeAreaView className="w-full h-full bg-black-600">
          <View className="w-full h-full px-6 justify-center items-center">
            <TouchableWithoutFeedback>
              <Animated.View
                className="w-full"
                style={cardAnimatedStyle}
              >
                <Animated.View
                  className="w-full bg-white rounded-3xl p-4"
                  layout={LinearTransition}
                >
                  <Animated.View
                    className="flex-row justify-between items-center pb-5"
                    layout={LinearTransition}
                  >
                    <Text className="text-xl font-montserrat-medium">{title}</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                      <CloseIcon width={20} height={20} />
                    </TouchableOpacity>
                  </Animated.View>
                  <Animated.View className="w-full" layout={LinearTransition}>
                    {children}
                  </Animated.View>
                  <Animated.View
                    className="flex-row pt-5 gap-2"
                    layout={LinearTransition}
                  >
                    <Button color="gray" className="flex-1" onPress={handleClear}>
                      <Text className="text-base font-montserrat-medium">Clear all</Text>
                    </Button>
                    <Button color="darkGray" className="flex-1" onPress={handleDone}>
                      <Text className="text-white font-montserrat-medium">Done</Text>
                    </Button>
                  </Animated.View>
                </Animated.View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </SafeAreaView>
      </Pressable>
    </Modal>
  )
};

export default FiltersModal;