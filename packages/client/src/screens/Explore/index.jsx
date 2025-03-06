import React, { useState, useRef } from 'react';
import { View } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import TabScreenWrapper from '../../newComponents/layout/TabScreenWrapper';
import BottomSheet from '../../components/BottomSheet';
import BrandCard from '../../components/BrandCard';
import TutorialOverlay from '../../components/TutorialOverlay';
import Browse from './Browse';
import ForYou from './ForYou';
import { useTranslation } from '../../hooks/useTranslation';
import { toggleMute } from '../../store/models/brands';
import { useFocusEffect } from '@react-navigation/native';
import EventBus from 'react-native-event-bus';
import { useLedgeTransitions } from '../../hooks/useLedgeTransitions';

function ExploreScreen({ route }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { splashTransitionTime } = useLedgeTransitions();
  const isMuted = useSelector((state) => state.brands.isMuted);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const bottomSheetRef = useRef(null);
  const showTutorial = route?.params?.showTutorial;
  const hideSplashScreenOnLoad = route?.params?.hideSplashScreenOnLoad;
  const [tutorialVisible, setTutorialVisible] = useState(showTutorial ? true : false);

  useFocusEffect(
    React.useCallback(() => {
      EventBus.getInstance().fireEvent("showButton", { value: true });
    }, [])
  );

  const closeBottomSheet = async (showNavButton) => {
    await bottomSheetRef.current?.close(showNavButton ? true : false);
    setSelectedBrand(null);
  };

  const handleMuteToggle = () => {
    dispatch(toggleMute());
  };

  return (
    <View className="relative">
      <TabScreenWrapper
        tabs={[{
          component: ForYou,
          name: "Upload",
          fullscreen: true
        }, {
          component: Browse,
          name: t("explore.browse"),
          fullscreen: false
        }]}
        // tab1Name="explore.forYou"
        // tab2Name="explore.discovery"
        // Tab1Component={ForYou}
        // Tab2Component={Discovery}
        // t={t}
        // onBrandPress={handleBrandPress}
        // showOpeningAnimation={true}
        // onTab1Load={async () => {
        //   if (hideSplashScreenOnLoad) {
        //     // wait for the splash screen to be hidden before showing the opening animation
        //     EventBus.getInstance().fireEvent("hideSplashScreen");
        //     await new Promise((resolve) => setTimeout(resolve, splashTransitionTime));
        //   }
        // }}
      />
      <BottomSheet ref={bottomSheetRef} snapPoints={['90%']} className="bg-cream" noScroll manageNavButton>
        {selectedBrand && (
          <View className="px-1 pb-7">
            <BrandCard
              brand={selectedBrand}
              shouldPlay={true}
              closeCard={() => closeBottomSheet(false)}
              onMute={handleMuteToggle}
              isMuted={isMuted}
              onBrandNamePress={closeBottomSheet}
              parentTabName="Browse" // this bottom sheet only opens from the Browse tab
            />
          </View>
        )}
      </BottomSheet>
      {tutorialVisible && (
        <View className="absolute h-full w-full">
          <TutorialOverlay onFinished={() => setTutorialVisible(false)} />
        </View>
      )}
    </View>
  );
};

export default ExploreScreen;
