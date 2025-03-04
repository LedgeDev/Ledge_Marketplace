import React, { useState, useEffect } from 'react';
import { View, LayoutAnimation } from 'react-native';
import { useLedgeTransitions } from '../hooks/useLedgeTransitions';

function NewDotIndicator({ className, show }) {
  const [big, setBig] = useState(show ? true : false);
  const [visible, setVisible] = useState(show ? true : false);
  const { dotIndicatorTransition } = useLedgeTransitions();

  useEffect(() => {
    let timeout1;
    let timeout2;
    if (show) {
      LayoutAnimation.configureNext(dotIndicatorTransition);
      setVisible(true);
      setBig(true);
    } else {
      timeout1 = setTimeout(() => {
        LayoutAnimation.configureNext(dotIndicatorTransition);
        setBig(false);
      }, 3000);
      timeout2 = setTimeout(() => {
       setVisible(false);
     }, dotIndicatorTransition.duration + 3000);
    }
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    }
  }, [show])

  if (visible) {
    return (
      <View className={`flex justify-center items-center ${className}`} style={{ width: 7, height: 7 }}>
        <View
          style={{
            width: big ? 7 : 0,
            height: big ? 7 : 0,
          }}
          className="items-center justify-center rounded-full bg-pink"
        />
      </View>
    )
  }
}

export default NewDotIndicator;