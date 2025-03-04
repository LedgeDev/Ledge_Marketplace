async function postImageToS3(imageFile, url) {
  const file = imageFile.get("file");
  const mimeType = file.type;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": mimeType,
    },
    body: file,  // React Native blob can be used directly
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const imageUrl = url.split("?")[0];
  const imageKey = imageUrl.split("/").pop();
  return imageKey;
}

module.exports = { postImageToS3 };


