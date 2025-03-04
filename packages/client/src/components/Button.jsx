import React, { useState, useMemo } from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';

function Button({ onPress, disabled = false, loading = false, prependIcon, appendIcon, children, big = false, className = '', color }) {
  const [pressed, setPressed] = useState(false);

  let buttonColor = '';
  let pressedColor = '';
  let disabledColor = '';
  let activityIndicatorColor = '';
  switch (color) {
    case 'gray':
      buttonColor = '#F1F1F1';
      pressedColor = '#D4D4D4';
      disabledColor = '#F1F1F14D';
      activityIndicatorColor = '#999999';
      break;
    case 'dark':
      buttonColor = '#262C30';
      pressedColor = '#1A1E21';
      disabledColor = '#262C304D';
      activityIndicatorColor = 'white';
      break;
    case 'red':
      buttonColor = '#F95252';
      pressedColor = '#C24040';
      disabledColor = '#F952524D';
      activityIndicatorColor = '#C24040';
      break;
    case 'blue':
      buttonColor = '#13476C';
      pressedColor = '#0D304A';
      disabledColor = '#13476C4D';
      activityIndicatorColor = 'white';
      break;
    case 'transparent':
      buttonColor = 'transparent';
      pressedColor = 'rgba(0,0,0,0.1)';
      disabledColor = 'transparent';
      activityIndicatorColor = '#999999';
      break;
    case 'white':
      buttonColor = '#FFFFFF';
      pressedColor = '#F5F5F5';
      disabledColor = '#FFFFFF4D';
      activityIndicatorColor = '#262C30';
      break;
    case 'pink':
      buttonColor = '#FBEDED';
      pressedColor = '#F7DADB';
      disabledColor = '#FBEDED';
      activityIndicatorColor = '#C359AC';
      break;
    default:
      buttonColor = '#FBEDED';
      pressedColor = '#F7DADB';
      disabledColor = '#FBEDED';
      activityIndicatorColor = '#C359AC';
      break;
  }

  const calculatedColor = useMemo(() => {
    if (disabled) {
      return disabledColor;
    } else if (pressed) {
      return pressedColor;
    } else {
      return buttonColor;
    }
  }
  , [disabled, pressed]);

  return (
    <View className={`rounded-2xl ${className}`}>
      <Pressable
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        disabled={disabled || loading}
        className="rounded-2xl"
      >
        <View
          className={`flex flex-row items-center justify-between px-6 rounded-2xl ${big ? ('py-6') : ('py-3')}`}
          style={{
            backgroundColor: calculatedColor,
          }}
        >
          { loading && (
            <View className="w-full">
              <ActivityIndicator size="small" color={activityIndicatorColor} />
            </View>
          )}
          { !loading && (
            <>
              <View className={`${disabled? 'opacity-50' : ''}`}>
                { prependIcon? prependIcon : <View></View> }
              </View>
              <View className={`${disabled? 'opacity-50' : ''} ${prependIcon? 'pl-3' : ''} ${appendIcon? 'pr-3' : ''}`}>
                { children }
              </View>
              <View className={`${disabled? 'opacity-50' : ''}`}>
                { appendIcon? appendIcon : <View></View> }
              </View>
            </>
          ) }
        </View>
      </Pressable>
    </View>
  );
}

export default Button;
