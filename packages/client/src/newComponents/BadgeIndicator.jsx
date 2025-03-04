import React, { useState, useEffect } from 'react';
import { View, Text, LayoutAnimation } from 'react-native';
import { useLedgeTransitions } from '../hooks/useLedgeTransitions';

function BadgeIndicator({ count }) {
  const [big, setBig] = useState(count > 0 ? true : false);
  const [visible, setVisible] = useState(count > 0 ? true : false);
  const { dotIndicatorTransition } = useLedgeTransitions();

  useEffect(() => {
    let timeout;
    if (count > 0) {
      LayoutAnimation.configureNext(dotIndicatorTransition);
      setVisible(true);
      setBig(true);
    } else {
      LayoutAnimation.configureNext(dotIndicatorTransition);
      setBig(false);
      timeout = setTimeout(() => {
        setVisible(false);
      }, dotIndicatorTransition.duration);
    }
    return () => {
      clearTimeout(timeout);
    }
  }, [count])

  if (visible) {
    return (
      <View className="flex justify-center items-center" style={{ width: 17, height: 17 }}>
        <View
          className="bg-pink rounded-full flex items-center justify-center"
          style={{
            width: big ? 17 : 0,
            height: big ? 17 : 0,
          }}
        >
          {count > 9 ? (
            <Text className="text-ledge-pink text-xs font-bold" style={{ transform: [{scale: 0.9}]}}>
              9+
            </Text>
          ) : (
            <Text className="text-ledge-pink text-xs font-bold">
              {count}
            </Text>
          )}
        </View>
      </View>
    );
  }
}

export default BadgeIndicator;
