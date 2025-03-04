import { Dimensions, Platform } from 'react-native';

export const isIPhoneSE = () => {
  const { width, height } = Dimensions.get('window');
  const isIOS = Platform.OS === 'ios';

  // iPhone SE (1st and 2nd gen) have 4-inch display (320 x 568 points)
  const isOlderSEResolution = (width === 320 && height === 568) || (width === 568 && height === 320);

  // iPhone SE (3rd gen) has 4.7-inch display (375 x 667 points)
  const isNewerSEResolution = (width === 375 && height === 667) || (width === 667 && height === 375);

  const iPhone8PlusResolution = (width === 414 && height === 736) || (width === 736 && height === 414);

  const isCorrectResolution = isOlderSEResolution || isNewerSEResolution || iPhone8PlusResolution;

  return isIOS && isCorrectResolution;
};

export const roundedCornerRadius = 40;