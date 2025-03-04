const {
  withInfoPlist,
  withXcodeProject,
  withAndroidManifest,
  withDangerousMod,
} = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withCustomConfig = (config) => {
  // iOS configurations
  config = withInfoPlist(config, (config) => {
    config.modResults.ITSAppUsesNonExemptEncryption = false;
    return config;
  });

  config = withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;
    xcodeProject.addBuildProperty('TARGETED_DEVICE_FAMILY', '"1,2"', 'Debug');
    xcodeProject.addBuildProperty('TARGETED_DEVICE_FAMILY', '"1,2"', 'Release');
    return config;
  });

  // Android configurations
  config = withAndroidManifest(config, async (config) => {
    const mainApplication = config.modResults.manifest.application[0];
    mainApplication.$['android:icon'] = '@mipmap/ic_launcher';
    mainApplication.$['android:roundIcon'] = '@mipmap/ic_launcher_round';
    mainApplication.$['android:theme'] = '@style/AppTheme';
    return config;
  });

  // Update app icon (only if the icon path is specified)
  // if (config.icon) {
  //   config = withDangerousMod(config, [
  //     'android',
  //     async (config) => {
  //       const iconPath = path.resolve(
  //         config.modRequest.projectRoot,
  //         config.icon,
  //       );
  //       const destPath = path.join(
  //         config.modRequest.platformProjectRoot,
  //         'app',
  //         'src',
  //         'main',
  //         'res',
  //         'mipmap-hdpi',
  //         'ic_launcher.png',
  //       );
  //       if (fs.existsSync(iconPath)) {
  //         await fs.promises.copyFile(iconPath, destPath);
  //       }
  //       return config;
  //     },
  //   ]);
  // }

  return config;
};

module.exports = withCustomConfig;
