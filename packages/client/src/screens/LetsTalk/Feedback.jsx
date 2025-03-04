import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  LayoutAnimation,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { findExamples } from '../../store/models/feedback';
import Feedback from '../../components/Feedback';
import TopBlur from '../../components/TopBlur';
import FeedbackSent from './FeedbackSent';
import { useTranslation } from '../../hooks/useTranslation';


function FeedbackPage() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const feedbackExamples = useSelector((state) => state.feedback.examples);
  const feedbackStatus = useSelector((state) => state.feedback.status);
  const [loading, setLoading] = useState(!feedbackExamples);
  const [feedbackFinished, setFeedbackFinished] = useState(false);

  useEffect(() => {
    if (!feedbackExamples && feedbackStatus !== 'loading') {
      setLoading(true);
      dispatch(findExamples());
    } else if (feedbackStatus === 'succeeded') {
      setLoading(false);
    }
  }, [feedbackExamples, dispatch, feedbackStatus]);

  const handleMoreFeedback = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFeedbackFinished(false);
  }, []);

  const handleFeedbackSent = useCallback(async () => {
    await dispatch(findExamples()).unwrap();
  }, [dispatch]);

  const handleFeedbackFinished = useCallback(async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFeedbackFinished(true);
  }, [dispatch]);

  if (loading) {
    return (
      <View className="flex-1 relative">
        <TopBlur />
        <View className="relative flex-1 justify-center items-center h-full px-7 pt-4">
          <ActivityIndicator className="pb-20" color="#999999" />
        </View>
      </View>
    );
  }

  if (feedbackFinished) {
    return (
      <View className="flex-1 relative">
        <TopBlur />
        <FeedbackSent feedbackExamples={feedbackExamples} onSendFeedback={handleMoreFeedback} />
      </View>
    );
  }
  return (
    <View className="flex-1 relative">
      <TopBlur />
      <KeyboardAvoidingView className="flex-1" behavior="padding">
        <View className="relative flex-1 justify-center items-center h-full px-7 pt-4 pb-20">
          <Feedback onSent={handleFeedbackSent} onFinished={handleFeedbackFinished} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

export default FeedbackPage;
