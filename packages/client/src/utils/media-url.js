import * as Network from 'expo-network';

const baseUrl = process.env.MEDIA_URL;

const getUrlForCellularNetwork = (fileResource, baseUrl, generation) => {
  const qualityMap = {
    '2g': 'thumbnail',
    '3g': 'thumbnail',
    '4g': 'medium',
    '5g': fileResource.high || fileResource.medium,
  };
  const quality = qualityMap[generation] || 'medium';
  return `${baseUrl}/${fileResource[quality]}`;
};

const getUrlBasedOnConnection = (fileResource, baseUrl, networkState) => {
  if (!networkState.isInternetReachable) {
    return `${baseUrl}/${fileResource.medium}`;
  }

  if (networkState.type === Network.NetworkStateType.CELLULAR) {
    return getUrlForCellularNetwork(fileResource, baseUrl, networkState.generation);
  }

  // For WiFi connections
  return `${baseUrl}/${fileResource.high || fileResource.medium}`;
};

export default async function mediaUrl(fileResource, desiredSize = null) {
  if (!fileResource) return null;

  // Handle non-image resources
  if (typeof fileResource !== 'object' || fileResource === null) {
    return `${baseUrl}/${fileResource}`;
  }

  // Handle specific size requests
  if (desiredSize && fileResource[desiredSize]) {
    return `${baseUrl}/${fileResource[desiredSize]}`;
  }

  try {
    const networkState = await Network.getNetworkStateAsync();
    return getUrlBasedOnConnection(fileResource, baseUrl, networkState);
  } catch (error) {
    return `${baseUrl}/${fileResource.medium}`;
  }
}

export const getVideoSource = (fileResource) => {
  return `${baseUrl}/${fileResource}`;
};
