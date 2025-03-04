function versionGte(version1, version2) {
  const version1Array = version1.split('.');
  const version2Array = version2.split('.');
  while (version1Array.length < version2Array.length) version1Array.push('0');
  while (version2Array.length < version1Array.length) version2Array.push('0');
  for (let i = 0; i < version1Array.length; i++) {
    const num1 = parseInt(version1Array[i], 10);
    const num2 = parseInt(version2Array[i], 10);
    if (num1 > num2) return true;
    if (num1 < num2) return false;
  }
  return true;
}

const versionGate = (version) => {
  return function (req, res, next) {
    // Determine the version from the request
    const reqVersion = req.header('X-API-Version') || req.query.v || '1';
    if (versionGte(version, reqVersion)) {
      return next();
    }
    return next("route"); // skip to the next route
  }
};

module.exports = versionGate;