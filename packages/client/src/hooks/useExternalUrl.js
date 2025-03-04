import { Linking, Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import * as WebBrowser from 'expo-web-browser';
import { addLinkVisit } from '../store/models/users';


function useExternalUrl() {
  const dispatch = useDispatch();

  const openExternalUrl = async (url, { brandId, productId, benefitId } = {}) => {
    if (!(typeof url === 'string')) {
      Alert.alert('Invalid url');
      return;
    }
    const trimmedUrl = url.trim();
    const supported = await Linking.canOpenURL(trimmedUrl);
    if (supported) {
      // Adding the link visit to the user
      if (brandId) {
        if (productId) {
          dispatch(addLinkVisit({ url: trimmedUrl, brandId, productId }));
        } else {
          dispatch(addLinkVisit({ url: trimmedUrl, brandId }));
        }
      } else if (benefitId) {
        dispatch(addLinkVisit({ url: trimmedUrl, benefitId }));
      } else {
        dispatch(addLinkVisit({ url: trimmedUrl }));
      }
      // Opening the link with some app, if the URL scheme is "http" the web link should be opened
      // by some browser in the mobile
      if (trimmedUrl.startsWith('http')) {
        await WebBrowser.openBrowserAsync(trimmedUrl, {
          dismissButtonStyle: 'done',
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET
        });
      } else {
        await Linking.openURL(trimmedUrl);
      }
    } else {
      Alert.alert(`Don't know how to open this URL: ${url}`);
    }
  };
  return { openExternalUrl };
}

export { useExternalUrl };