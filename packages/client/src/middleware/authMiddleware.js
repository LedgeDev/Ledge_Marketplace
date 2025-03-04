import { fetchAppVersion } from '../store/models/appVersions';
import { getUser } from '../store/models/users';
import { navigate } from '../navigation/navigationService';

const publicPages = ['Welcome'];

const updateRequiredCheck = async (store) => {
  // We dont check the state of AppVersions in the store, because we want to make sure we have the latest version info
  await store.dispatch(fetchAppVersion());
  const versionInfo = store.getState().appVersions.versionInfo;
  if (versionInfo.updateRequired) {
    return versionInfo;
  }
  return false;
};

const checkUser = async (store) => {
  // Check if user has answered terms and conditions
  let user = store.getState().users.data;
  if (!user) {
    await store.dispatch(getUser());
    user = store.getState().users.data;
  }
  if (user?.hasAcceptedTermsAndConditions) {
    return true;
  } else {
    return false;
  }
};

const authMiddleware = (store) => (next) => async (action) => {
  if (action.type === 'NAVIGATE') {
    const { routeName } = action.payload;

    // Check if the current route is already 'Warning' to avoid infinite loop
    if (routeName === 'Warning') {
      return next(action);
    }

    // The authentication check is also made by atuh0, but we have this as a second layer of security
    const isAuthenticated = store.getState().auth.isAuthenticated;

    const updateRequiredResult = await updateRequiredCheck(store);

    const userCheckResult = await checkUser(store);

    if (updateRequiredResult) {
      navigate('Warning', { latestVersion: updateRequiredResult.latestVersion });
      return;
    }

    if (
      (!isAuthenticated || !userCheckResult) &&
      !publicPages.includes(routeName)
    ) {
      navigate('Welcome');
      return;
    }
  }

  return next(action);
};

export default authMiddleware;
