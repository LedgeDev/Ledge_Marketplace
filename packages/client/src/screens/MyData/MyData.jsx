import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { findSortedAnswers } from '../../store/models/answers';
import { getUser } from '../../store/models/users';
import { markIdAsSeen } from '../../store/models/questionnaires';
import QuestionnaireButton from '../../components/QuestionnaireButton';
import SortedAnswersMenu from './SortedAnswersMenu';
import LedgeProgress from '../../components/LedgeProgress';
import TopBlur from '../../components/TopBlur';

function MyData({ setBadge = () => {} }) {
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const user = useSelector((state) => state.users.data);
  const userStatus = useSelector((state) => state.users.status);
  const answers = useSelector((state) => state.answers.answers);
  const answersStatus = useSelector((state) => state.answers.status);
  const questionnaire = useSelector(
    (state) => state.questionnaires.questionnaire,
  );
  const questionnaireStatus = useSelector(
    (state) => state.questionnaires.status,
  );
  const questionnaireSeenIds = useSelector((state) => state.questionnaires.questionnaireSeenIds);
  const questionnaireBadgeCount = useSelector((state) => state.questionnaires.questionnaireBadgeCount);
  const [questionnaireLoading, setQuestionnaireLoading] =
    useState(!questionnaire); // loading only with visual purposes

  // we update dot indicator when the questionnaire changes
  useEffect(() => {
    setBadge(questionnaireBadgeCount);
  }, [questionnaireBadgeCount]);

  useEffect(() => {
    if (!answers && answersStatus !== 'loading') {
      dispatch(findSortedAnswers());
    } else if (answersStatus === 'succeeded') {
      setTimeout(() => setRefreshing(false), 1000);
    }
  }, [answersStatus, dispatch, answers]);

  useEffect(() => {
    if (!user && userStatus !== 'loading') {
      dispatch(getUser({}));
    } else if (userStatus === 'succeeded') {
      setTimeout(() => setRefreshing(false), 1000);
    }
  }, [userStatus, dispatch, user]);

  useEffect(() => {
    // fetch questionnaire if not already fetched
    if (!questionnaire && questionnaireStatus !== 'loading') {
      setQuestionnaireLoading(true);
    } else if (questionnaireStatus === 'succeeded') {
      setQuestionnaireLoading(false);
      setTimeout(() => setRefreshing(false), 1000);
    }
  }, [questionnaireStatus, dispatch, questionnaire]);


  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // dispatch get actions
    dispatch(findSortedAnswers());
    dispatch(getUser({}));
  }, []);

  return (
    <View className="relative flex-1">
      <TopBlur />
      <ScrollView
        className="h-full overflow-visible"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingLeft: 28, paddingRight: 28 }}
      >
        <View className="h-48 mb-6">
          <LedgeProgress
            className="overflow-visible"
            compact={false}
            user={user}
          />
        </View>
        <View className="mb-6">
          {!questionnaireLoading ? (
            <QuestionnaireButton
              onNavigate={() => {
                dispatch(markIdAsSeen(questionnaire.id));
              }}
              questionnaire={questionnaire}
              showDotIndicator={!questionnaireSeenIds.includes(questionnaire.id)}
            />
          ) : (
            <ActivityIndicator color="#999999" />
          )}
        </View>
        <SortedAnswersMenu sortedAnswers={answers ? answers : []} />
      </ScrollView>
    </View>
  );
}

export default MyData;
