import React from 'react';
import { View } from 'react-native';
import TabScreenWrapper from '../../components/TabScreenWrapper';
import News from './News';
import Feedback from './Feedback';
import { useTranslation } from '../../hooks/useTranslation';
import { useFocusEffect } from '@react-navigation/native';
import EventBus from 'react-native-event-bus';

function LetsTalkScreen({ route }) {
  const { t } = useTranslation();

  useFocusEffect(
    React.useCallback(() => {
      EventBus.getInstance().fireEvent("showButton", { value: true });
    }, [])
  );

  return (
    <View className="relative">
      <TabScreenWrapper
        tab1Name="letsTalk.news.tabName"
        tab2Name="letsTalk.connect.tabName"
        Tab1Component={News}
        Tab2Component={Feedback}
        t={t}
        onBrandPress={() => {}}
      />
    </View>
  );
};

export default LetsTalkScreen;
