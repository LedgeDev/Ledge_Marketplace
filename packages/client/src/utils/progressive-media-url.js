const sizes = ['thumbnail', 'medium', 'high', 'original'];

  export default function mediaUrl(fileResource, desiredSize = null) {
    if (!fileResource) return null;
    const baseUrl = process.env.MEDIA_URL;
    // Check if fileResource is an object (for images) or a string (for videos)
    const isImage = typeof fileResource === 'object' && fileResource !== null;
    if (!isImage) {
      // It's a video, simply return the full URL
      return `${baseUrl}/${fileResource}`;
    }
    // If a specific size is requested, return the url for that size and the smallest size
    if (desiredSize) {
      const sizeIndex = sizes.indexOf(desiredSize);
      if (sizeIndex === -1) {
        throw new Error(`Invalid desiredSize: ${desiredSize}`);
        return [];
      } else if (sizeIndex === 0) {
        return [
          `${baseUrl}/${fileResource.thumbnail}`,
        ];
      } else if (sizeIndex > 0) {
        return [
          `${baseUrl}/${fileResource.thumbnail}`,
          `${baseUrl}/${fileResource[sizes[sizeIndex]]}`,
        ];
      }
    }
    // if no size is requested, return the smallest size and the medium size, for a fast load
    return [
      `${baseUrl}/${fileResource.thumbnail}`,
      `${baseUrl}/${fileResource.medium}`,
    ];
  }
