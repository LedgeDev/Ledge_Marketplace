import { Easing, LayoutAnimation } from 'react-native';

const useLedgeTransitions = () => {
  return {
    easeOut: Easing.bezier(0.2, 0.0, 0.2, 1),
    dotIndicatorTransition: {
      duration: 150,
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.scaleXY,
      },
    },
    openingTransition: Easing.out(Easing.exp),
    openingTransitionTime: 1500,
    splashTransitionTime: 200,
  }
};

export { useLedgeTransitions };
