import React, { useState, useRef, useEffect } from 'react';
import {
  Dimensions,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  LayoutAnimation,
  Platform,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import Animated, { useAnimatedStyle, withTiming, useSharedValue, Easing } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLedgeTransitions } from '../hooks/useLedgeTransitions';
import { useTranslation } from '../hooks/useTranslation';
import LedgeProgress from '../components/LedgeProgress';
import BadgeIndicator from '../components/BadgeIndicator';
import CrossIcon from '../assets/svg/close-gray.svg';
import BurgerMenuWhiteIcon from '../assets/svg/burger-menu-white.svg';
import BurgerMenuGrayIcon from '../assets/svg/burger-menu-gray.svg';
import SettingsIcon from '../assets/svg/SettingsIcon.svg';
import MyDataIcon from '../assets/svg/MyDataIcon.svg';
import MyBrandsIcon from '../assets/svg/MyBrandsIcon.svg';
import ExploreIcon from '../assets/svg/ExploreIcon.svg';
import NewsIcon from '../assets/svg/NewsIcon.svg';
import EventBus from 'react-native-event-bus';

const screenWidth = Dimensions.get('window').width;
const drawerWidth = screenWidth * 0.65;

function NavbarItem({ name, icon, isSelected, screenName, badgeCount }) {
  const navigation = useNavigation();

  const handleNavigation = () => {
    navigation.navigate(screenName);
    // Close the navbar after navigating
    EventBus.getInstance().fireEvent("showNavbar", { value: false });
  };

  const underline = () => {
    return (
      <View
        className="absolute bottom-3 left-0 right-0 h-2 bg-pink-light rounded-lg"
        style={{ zIndex: -1 }}
      />
    );
  };

  return (
    <TouchableOpacity
      onPress={handleNavigation}
      className="relative flex flex-row items-center"
    >
      {icon}
      <Text
        maxFontSizeMultiplier={1.5}
        className={`text-ledge-black m-3 ${isSelected ? 'font-montserrat-alt-bold text-xl' : 'font-montserrat-alt text-lg'}`}
      >
        {name}
      </Text>
      {badgeCount > 0 && (
        <View className="absolute top-[5] right-[2]">
          <BadgeIndicator count={badgeCount} />
        </View>
      )}
      {isSelected && underline()}
    </TouchableOpacity>
  );
}

function Navbar({
  setIsNavbarVisibleParent,
  isNavbarVisible,
  currentRoute,
}) {
  const [selectedItem, setSelectedItem] = useState('Explore');
  const [isButtonShown, setIsButtonShown] = useState(false);
  const [isButtonTransparent, setIsButtonTransparent] = useState(false);
  const buttonBackgroundOpacity = useSharedValue(isNavbarVisible ? 1 : 0);
  const buttonTranslate = useSharedValue(0);
  const buttonBorderColor = useSharedValue('white');
  const slideAnim = useSharedValue(isNavbarVisible ? 0 : drawerWidth);
  const user = useSelector((state) => state.users.data);
  const insets = useSafeAreaInsets();
  const bottomInset = Platform.OS === 'android' ? insets.bottom : 0;
  const forYouBadgeCount = useSelector((state) => state.brands.forYouBadgeCount);
  const benefitsBadgeCount = useSelector((state) => state.benefits.levelBenefitsBadgeCount);
  const postsBadgeCount = useSelector((state) => state.posts.postsBadgeCount);
  const questionnaireBadgeCount = useSelector((state) => state.questionnaires.questionnaireBadgeCount);
  const { easeOut } = useLedgeTransitions();
  const { t } = useTranslation();

  useEffect(() => {
    if (currentRoute !== selectedItem) {
      setSelectedItem(currentRoute);
    }
  }, [currentRoute]);

  const toggleNavbar = () => {
    setIsNavbarVisibleParent((prev) => {
      EventBus.getInstance().fireEvent("setRoundedCorners", { value: !prev });
      return !prev
    });
  };

  useEffect(() => {
    const showButtonListener = EventBus.getInstance().addListener("showButton", (data) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      // Only update isButtonShown if the navbar is not visible
      setIsButtonShown(data.value);
    });

    const showNavbarListener = EventBus.getInstance().addListener("showNavbar", (data) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsNavbarVisibleParent(data.value);
      // Ensure the button is shown when the navbar is visible
      setIsButtonShown(true);
      EventBus.getInstance().fireEvent("setRoundedCorners", data);
    });

    const showButtonTransparentListener = EventBus.getInstance().addListener("setNavbarButtonTransparent", (data) => {
      setIsButtonTransparent(data.value);
    });

    // Cleanup listeners on component unmount
    return () => {
      EventBus.getInstance().removeListener(showButtonListener);
      EventBus.getInstance().removeListener(showNavbarListener);
      EventBus.getInstance().removeListener(showButtonTransparentListener);
    };
  }, [isNavbarVisible, setIsNavbarVisibleParent, easeOut]);

  const slideAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(slideAnim.value, { duration: 250, easing: Easing.out(Easing.quad) }) }],
  }));

  const buttonAnimatedStyles = useAnimatedStyle(() => ({
    transform: [
      { translateX: withTiming(buttonTranslate.value, { duration: 250, easing: Easing.out(Easing.quad) }) },
      { translateY: withTiming(buttonTranslate.value, { duration: 250, easing: Easing.out(Easing.quad) }) },
    ],
    borderColor: withTiming(buttonBorderColor.value, { duration: 250, easing: Easing.out(Easing.quad) }),
  }));

  const buttonBackgroundAnimatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(buttonBackgroundOpacity.value, { duration: 250, easing: Easing.out(Easing.quad) }),
  }));

  useEffect(() => {
    slideAnim.value = isNavbarVisible ? 0 : drawerWidth;
    buttonBackgroundOpacity.value = isButtonTransparent && !isNavbarVisible ? 0 : 1;
    buttonTranslate.value = isButtonShown ? 0 : 200;
    buttonBorderColor.value = isNavbarVisible || !isButtonTransparent ? '#262C300D' : '#F1F1F133';
  }, [isButtonShown, isNavbarVisible, isButtonTransparent]);

  return (
    <>
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: insets.top,
            bottom: insets.bottom,
            right: 0,
            width: drawerWidth,
          },
          slideAnimatedStyle,
        ]}
        className="relative pl-3 pr-6 pt-16 bg-white z-10 flex flex-col justify-start"
      >
        <View>
          <Text
            className="font-inter-small text-ledge-black text-md"
            numberOfLines={1}
          >
            {`${t("sidebar.welcome")} ${user?.level?.name ? user.level.name : ''}`}
          </Text>
          <Text
            className="font-montserrat-bold text-ledge-black text-md"
            numberOfLines={1}
          >
            {user?.name ? user.name : ''}
          </Text>
        </View>
        <View className="h-56">
          {user?.level && (
            <LedgeProgress
              user={user}
              hideRocket
              sidebar
            />
          )}
        </View>
        <View className="flex-1 flex-col justify-between items-start pb-20">
          <View className="flex flex-col items-start gap-3">
            <NavbarItem
              name="Explore"
              screenName="Explore"
              icon={<ExploreIcon width={20} height={20} style={styles.icon} />}
              isSelected={selectedItem === 'Explore'}
              badgeCount={forYouBadgeCount}
            />
            <NavbarItem
              name="My Brands"
              screenName="My Brands"
              icon={<MyBrandsIcon width={20} height={20} style={styles.icon} />}
              isSelected={selectedItem === 'My Brands'}
            />
            <NavbarItem
              name="My Data"
              screenName="My Data"
              icon={<MyDataIcon width={20} height={20} style={styles.icon} />}
              isSelected={selectedItem === 'My Data'}
              badgeCount={questionnaireBadgeCount + benefitsBadgeCount}
            />
          </View>
          <View>
            <View className="justify-self-end items-start relative">
              <NavbarItem
                name="Let's Talk"
                screenName="LetsTalk"
                icon={<NewsIcon width={20} height={20} style={[styles.icon, { transform: [{ scale: 1.2 }] }]} />}
                isSelected={selectedItem === 'LetsTalk'}
                badgeCount={postsBadgeCount}
              />
            </View>
            <View className="justify-self-end relative">
              <NavbarItem
                name={t('sidebar.settings')}
                screenName="Settings"
                icon={<SettingsIcon width={20} height={20} style={styles.icon} />}
                isSelected={selectedItem === 'Settings'}
              />
            </View>
          </View>
        </View>
      </Animated.View>
      <Animated.View
        className="absolute z-20 rounded-full border border-1 overflow-hidden"
        style={[
          styles.buttonContainer,
          buttonAnimatedStyles,
        ]}
      >
        <View className="absolute w-full h-full bg-black opacity-25"/>
        <BlurView
          intensity={10}
          tint="dark"
          className="absolute w-full h-full rounded-full"
        />
        <Animated.View className="absolute w-full h-full bg-white" style={[buttonBackgroundAnimatedStyle]} />
        <TouchableOpacity
          className="relative w-full h-full"
          onPress={toggleNavbar}
          style={[
            styles.button,
          ]}
        >
          {isNavbarVisible ? (
            <CrossIcon width={24} height={24} />
          ) : (isButtonTransparent ? (
              <BurgerMenuWhiteIcon width={24} height={24} />
            ) : (
              <BurgerMenuGrayIcon width={24} height={24} />
            )
          )}
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  bold: {
    fontWeight: 'bold',
  },
  messageBox: {
    padding: 10,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    marginBottom: 20,
  },
  newsTitle: {
    color: '#13476C', // blue
    fontWeight: 'bold',
    fontSize: 12,
  },
  newsContent: {
    fontWeight: '300',
    fontSize: 14,
    marginTop: 5,
  },
  selectedButton: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  buttonShadow: {
    shadowColor: '#000',
    shadowRadius: 3.84,
    elevation: 1,
  },
  buttonContainer: {
    bottom: -83,
    right: -83,
  },
  button: {
    padding: 35,
    paddingRight: 105,
    paddingBottom: 105,
  },
  icon: {
    marginRight: 8,
  },
});

export default Navbar;
