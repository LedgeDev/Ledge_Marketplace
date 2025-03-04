import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { LayoutAnimation } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import EventBus from 'react-native-event-bus';
import PitchPlayer from './PitchVideo/PitchPlayer';
import PitchQuestions from './PitchQuestions/PitchQuestions';
import { getUser } from '../../store/models/users';
import { fetchBrand } from '../../store/models/brands';
import { useSelector, useDispatch } from 'react-redux';
import { fetchExitQuestion, fetchPitchQuestions } from '../../store/models/questions';
import { useAnalytics } from '../../hooks/useAnalytics';
import getFounderNamesString from "../../utils/founder-names-string";
import { checkBrandUnlocked } from '../../utils/brand-utils';

const PitchScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const analytics = useAnalytics()
  const [brandWithData, setBrandWithData] = useState(null);
  const brandState = useSelector((state) => state.brands.status);
  const ExitQuestions = useSelector((state) => state.questions.exit);
  const pitchQuestions = useSelector((state) => state.questions.data);
  const [state, setState] = useState('pitchVideo');
  const [isNavigating, setIsNavigating] = useState(false);
  const user = useSelector((state) => state.users.data);
  const myFavouritesIds = useMemo(() => user.myFavourites || [], [user.myFavourites]);
  const userMyDealsIds = useMemo(() => user.dealCodes.map(deal => deal.brandId) || [], [user.dealCodes]);
  const { brand } = route.params;
  const hasSeenThisPitch = useMemo(() =>
    user?.viewedPitches && brand ?
      user.viewedPitches.includes(brand.id) : null,
    [user.viewedPitches, brand.id]
  );
  const videoRef = useRef(null);
  const pitchQuestionsStartTimestamp = useRef(null);

  useEffect(() => {
    // hide sidebar button and fetch info on mount
    EventBus.getInstance().fireEvent("showButton", { value: false });
    // if brand is already unlocked, skip pitch video
    if (checkBrandUnlocked(brand)) {
      setState('questions');
      pitchQuestionsStartTimestamp.current = new Date();
    } else {
      setState('pitchVideo');
    }
    if (!user.data) {
      dispatch(getUser());
    }
    dispatch(fetchExitQuestion(brand.id));
    dispatch(fetchPitchQuestions(brand.id));
  }, [dispatch, brand.id]);

  useEffect(() => {
    const checkFinished = async () => {
      if (
        state === 'pitchFlowEnded' &&
        brandState === 'succeeded' &&
        !isNavigating
      ) {
        videoRef.current?.unloadAsync();
        setIsNavigating(true);
        navigation.replace('Brand Profile', { brand: brandWithData, measureScreenTime: true });
      }
    };
    checkFinished();
  }, [state, brandState, brandWithData, navigation, isNavigating]);


  const handlePitchPlayerFinished = useCallback(async () => {
    analytics.capture("Pitch interaction: video finished", {
      brandId: brand.id,
      brandName: brand.name,
      type: "pitchInteractionVideoFinished",
    })
    // if brands is not unlocked, show questions
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (!myFavouritesIds.includes(brand.id) && !userMyDealsIds.includes(brand.id)) {
      setState('questions');
      pitchQuestionsStartTimestamp.current = new Date();
    } else {
      await dispatch(fetchBrand(brand.id)).unwrap();
      setState('pitchFlowEnded');
    }
  }, [brand, myFavouritesIds, userMyDealsIds, dispatch, analytics]);

  const handlePitchQuestionsFinished = useCallback(async () => {
    // get pitch questions duration in seconds
    const pitchQuestionsEndTimestamp = new Date();
    const pitchQuestionsDuration = (pitchQuestionsEndTimestamp - pitchQuestionsStartTimestamp.current) / 1000;
    analytics.capture("Pitch interaction: completed", {
      brandId: brand.id,
      brandName: brand.name,
      pitchQuestionsDuration,
      type: "pitchInteractionCompleted",
      details: {
        pitchQuestionsDuration,
      }
    })
    const updatedBrand = await dispatch(fetchBrand(brand.id)).unwrap();
    setBrandWithData(updatedBrand);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setState('pitchFlowEnded');
  }, [brand.id, dispatch, analytics]);

  const unloadAndGoBack = useCallback(() => {
    videoRef.current?.unloadAsync();
    setIsNavigating(true);
    EventBus.getInstance().fireEvent("showButton", { value: true });
    navigation.goBack();
  }, [navigation, videoRef.current]);

  const handlePitchVideoQuit = useCallback(() => {
    if (isNavigating) {
      return;
    }
    if (!hasSeenThisPitch) {
      analytics.capture("Pitch interaction: quitted", {
        brandId: brand.id,
        brandName: brand.name,
        type: "pitchInteractionQuitted",
      })
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setState('quit');
    } else {
      unloadAndGoBack();
    }
  }, [navigation, analytics, brand, hasSeenThisPitch, isNavigating]);

  return (
    <>
      {state === 'pitchVideo' && (
        <PitchPlayer
          videoRef={videoRef}
          videoSource={brand.pitchVideo}
          brandName={brand.name}
          founder={getFounderNamesString(brand.founders?.length ? brand.founders.map(founder => founder.name) : '')}
          captions={brand.pitchCaptions}
          sections={brand.pitchSections}
          endVideo={handlePitchPlayerFinished}
          onQuit={handlePitchVideoQuit}
        />
      )}
      {(state === 'questions' || state === 'pitchFlowEnded') && (
        <PitchQuestions
          brand={brand}
          toPitch={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setState('pitchVideo')
          }}
          endQuestions={handlePitchQuestionsFinished}
          questions={pitchQuestions}
          isExitQuestion={false}
          onQuit={unloadAndGoBack}
        />
      )}
      {state === 'quit' && (
        <PitchQuestions
          brand={brand}
          toPitch={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setState('pitchVideo')
          }}
          endQuestions={unloadAndGoBack}
          questions={ExitQuestions}
          isExitQuestion={true}
          onQuit={unloadAndGoBack}
        />
      )}
    </>
  );
};

export default PitchScreen;
