import React, {
  useCallback,
  useEffect,
  useState,
  useRef,
} from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { fetchBenefits, markIdAsSeen } from '../../store/models/benefits';
import BenefitsList from './BenefitsList';
import TopBlur from '../../components/TopBlur';
import LedgeProgress from '../../components/LedgeProgress';

function MyBenefits({ onBenefitPress, setBadge = () => {}, currentBenefit }) {
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const benefits = useSelector((state) => state.benefits.levelBenefits);
  const nextBenefits = useSelector((state) => state.benefits.nextLevelBenefits);
  const benefitsStatus = useSelector((state) => state.benefits.status);
  const benefitsSeenIds = useSelector((state) => state.benefits.levelBenefitsSeenIds);
  const benefitsBadgeCount = useSelector((state) => state.benefits.levelBenefitsBadgeCount);
  const user = useSelector((state) => state.users.data);
  const currentBenefitTimeout = useRef(null);

  useEffect(() => {
    setBadge(benefitsBadgeCount);
  }, [benefitsBadgeCount])

  useEffect(() => {
    if ((!benefits || !nextBenefits) && benefitsStatus !== 'loading') {
      dispatch(fetchBenefits());
    } else if (benefitsStatus === 'succeeded') {
      setTimeout(() => setRefreshing(false), 1000);
    }
  }, [benefitsStatus, dispatch, benefits, nextBenefits]);

  // if a benefits stays on screen for 3 seconds, we mark it as seen
  useEffect(() => {
    if (currentBenefitTimeout.current) {
      clearTimeout(currentBenefitTimeout.current);
    }
    if (currentBenefit) {
      currentBenefitTimeout.current = setTimeout(() => {
        handleBenefitSeen(currentBenefit.id);
      }, 3000);
    }
  }, [currentBenefit]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // dispatch get actions
    dispatch(fetchBenefits({}));
  }, []);

  // when a benefit is seen, we remove it from the new items to decrease the badge count
  const handleBenefitSeen = useCallback(async (benefitId) => {
    if (!benefitsSeenIds.includes(benefitId)) {
      dispatch(markIdAsSeen(benefitId));
    }
  }, [benefitsSeenIds]);
  

  if (!benefits) {
    return (
      <View className="flex items-center justify-center h-full">
        <ActivityIndicator color="#999999" />
      </View>
    );
  }

  return (
    <View className="flex-1 relative">
      <TopBlur />
      <ScrollView
        className="h-full overflow-visible"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingLeft: 28, paddingRight: 28 }}
      >
        <View className="h-32">
          <LedgeProgress
            className="overflow-visible"
            compact={true}
            user={user}
          />
        </View>
        <BenefitsList
          benefits={benefits}
          nextBenefits={nextBenefits}
          setCurrentBenefit={onBenefitPress}
        />
      </ScrollView>
    </View>

  );
}

export default MyBenefits;
