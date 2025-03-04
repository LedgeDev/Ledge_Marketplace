import { usePostHog } from 'posthog-react-native';
import { useDispatch } from 'react-redux';
import { sendEvents, addEvent } from '../store/models/events';
const NODE_ENV = process.env.NODE_ENV;
const isProduction = NODE_ENV === 'production';

function useAnalytics() {
  const posthog = usePostHog();
  const dispatch = useDispatch();

  function identifyUser(currentUser) {
    if (isProduction) {
      if (currentUser && currentUser.email && currentUser.id && posthog) {
        posthog.identify(currentUser.id, {
          email: currentUser.email,
          name: currentUser.name,
        });
      }
    }
  }

  const capture = (eventName = 'defaultEvent', data = {}) => {
    if (isProduction) {
      posthog.capture(eventName.posthog, data);
      dispatch(addEvent(data));
    } else {
      console.log('not capturing', eventName, data);
    }
  };

  return { capture, identifyUser };
}

export { useAnalytics };