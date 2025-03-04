import React, { useRef, useState, useEffect } from 'react';
import { View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';


function TopBlur({ headerComponentRef = null }) {
  const [compHeight, setCompHeight] = useState(0);
  const [compTranslateY, setCompTranslateY] = useState(0);
  const compRef = useRef(null);

  useEffect(() => {
    let additionalHeight = 0;
    if (headerComponentRef && headerComponentRef.current) {
      headerComponentRef.current.measure((x, y, width, height, pageX, pageY) => {
        additionalHeight = height;
      });
    }
    if (compRef.current) {
      compRef.current.measure((x, y, width, height, pageX, pageY) => {
        setCompHeight(pageY + additionalHeight);
        setCompTranslateY(-(pageY));
      });
    }
  }, [headerComponentRef, compRef]);

  return (
    <View
      ref={compRef}
      className="absolute top-0 left-0 w-full z-40"
      style={{ 
        height: compHeight,
        transform: [{ translateY: compTranslateY }],
      }}
    >
      <LinearGradient
        colors={['#FCFBF8', '#FCFBF8E6', '#FCFBF8CC', '#FCFBF899', '#FCFBF880', '#FCFBF84D', '#FCFBF800']}
        style={{
          position: 'absolute',
          height: '100%',
          width: '100%',
        }}
      />
      <BlurView
        className="absolute top-0 left-0 w-full h-full"
        tint="light"
        intensity={10}
      />
    </View>
  );
}

export default TopBlur;