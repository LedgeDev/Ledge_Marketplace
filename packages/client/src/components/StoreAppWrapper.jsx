import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { sendEvents } from '../store/models/events';
import { useAnalytics } from '../hooks/useAnalytics';

const StoreAppWrapper = ({ children }) => {
  const dispatch = useDispatch();
  const analytics = useAnalytics();
  const user = useSelector((state) => state.users.data);

  useEffect(() => {
    analytics.identifyUser(user);
  })

  useEffect(() => {
    const appStateListener = AppState.addEventListener(
      'change',
      async (nextAppState) => {
        if (nextAppState === 'background') {
          await dispatch(sendEvents()).unwrap();
          console.log('events sent');
        }
      },
    );

    return () => {
      appStateListener.remove();
    };
  }, [dispatch]);

  return <>{children}</>;
};

export default StoreAppWrapper;
