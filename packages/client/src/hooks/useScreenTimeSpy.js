import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { addBrandScreenTime } from '../store/models/users';


function useScreenTimeSpy() {
  const dispatch = useDispatch();

  let startTime = 0;

  const startTimer = useCallback(() => {
    const startTime = Date.now();
    return startTime;
  }, []);


  const stopTimer = useCallback((timerId, brandId) => {
    const endTime = Date.now();
    const duration = endTime - timerId;
    dispatch(addBrandScreenTime({ brandId, time: duration }));
  }, []);

  return {
    startTimer,
    stopTimer,
  };
}

export { useScreenTimeSpy };