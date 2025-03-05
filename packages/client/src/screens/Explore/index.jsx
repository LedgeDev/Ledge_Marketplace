import React from 'react';
import { View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import EventBus from 'react-native-event-bus';

function ExploreScreen() {
  useFocusEffect(
    React.useCallback(() => {
      // Keep the event that shows the button
      EventBus.getInstance().fireEvent("showButton", { value: true });
    }, [])
  );

  // Return an empty view that takes up the full screen
  return (
    <View className="flex-1" />
  );
}

export default ExploreScreen;
