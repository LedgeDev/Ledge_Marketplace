import React, { useState, useEffect, useRef } from 'react';
import { 
  Animated,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import CloseIcon from '../../../assets/svg/x-white.svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EventBus from 'react-native-event-bus';

const HeaderInfo = ({ brandName, founder, onPress = () => {}, onQuit = () => {} }) => {
  const insets = useSafeAreaInsets();
  const [headerVisible, setHeaderVisible] = useState(true);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: headerVisible ? 1 : 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [headerVisible]);

    useEffect(() => {
      const listener = EventBus.getInstance().addListener("hideBar", (data) => {
        setHeaderVisible(data.show);
      });

      return () => {
        EventBus.getInstance().removeListener(listener);
      };
    }, []);
  const handleClose = () => {
    onQuit();
  }

  return (
    <Pressable
      className="absolute top-[-2.5%] left-0 pl-5 z-30 flex flex-1 w-full flex-wrap flex-row"
      style={{ paddingTop: insets.top + 25 }}
      onPress={onPress}
    >
      <Animated.View
        style={{ opacity }}
        className="absolute top-0 left-0 right-0 h-full"
      >
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0)']}
          style={{
            height: 200,
          }}
        />
      </Animated.View>
      <Animated.View
        style={{
          opacity,}}
        className="flex-row items-center gap-7 flex-1"
      >
        <TouchableOpacity
          onPress={handleClose}
          className="bg-blue bg-opacity-50 rounded-full p-2 h-50 w-[30px] h-[30px] my-auto"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.8, shadowRadius: 3 }}
        >
          <CloseIcon className="z-40" />
        </TouchableOpacity>
        <View style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.8, shadowRadius: 3 }}>
          <Text
            className="typography-title3-emphasized text-cream"
            style={styles.shadow}>
            {brandName}
          </Text>
          <Text
            className="typography-subtitle-regular text-cream"
            style={styles.shadow}
          >
            By {founder}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
};
const styles = StyleSheet.create({
  shadow: {
    textShadowColor: 'rgba(0, 0, 0, 0.05)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5,
  }

})
export default HeaderInfo;
