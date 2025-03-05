import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name, params) {
  console.log('[DEBUG] Attempting to navigate to:', name, params);
  
  if (navigationRef.isReady()) {
    console.log('[DEBUG] Navigation ref is ready, navigating');
    navigationRef.navigate(name, params);
  } else {
    console.log('[DEBUG] Navigation ref is NOT ready, navigation failed');
  }
}
