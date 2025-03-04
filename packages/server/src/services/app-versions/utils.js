function fixVersionQueryLength(versionQuery) {
  if (!versionQuery) {
    throw new Error('No version query provided');
  } else {
    const queryVersionArray = versionQuery.split('.');
    if (queryVersionArray.length < 3) {
      // Fill with 0s if query version is not 3 numbers
      for (let i = queryVersionArray.length; i < 3; i++) {
        queryVersionArray.push('0');
      }
      // Join array back into a string
      return queryVersionArray.join('.');
    } else {
      // Return the original version if it's already 3 numbers or more
      return versionQuery;
    }
  }
}

function versionGreaterThan(version1, version2) {
  // Split version strings into arrays
  const version1Array = version1.split('.');
  const version2Array = version2.split('.');
  // Fill arrays with 0s to make them the same length
  while (version1Array.length < version2Array.length) version1Array.push('0');
  while (version2Array.length < version1Array.length) version2Array.push('0');
  // Compare each segment of the version numbers
  for (let i = 0; i < version1Array.length; i++) {
    const num1 = parseInt(version1Array[i], 10);
    const num2 = parseInt(version2Array[i], 10);
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

module.exports = {
  fixVersionQueryLength,
  versionGreaterThan
};
