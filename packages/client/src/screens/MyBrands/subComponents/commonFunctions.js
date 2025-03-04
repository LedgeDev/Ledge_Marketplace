import { Linking } from 'react-native';

export const openLink = async (url) => {
  if (!url) {
    console.error("URL no proporcionada");
    return;
  }
  const supported = await Linking.canOpenURL(url);
  if (supported) {
    await Linking.openURL(url);
  } else {
    console.error("No se puede abrir el enlace: ", url);
  }
}

