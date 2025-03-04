const { getDefaultConfig } = require("expo/metro-config");
const { mergeConfig } = require("metro-config");
const { withNativeWind } = require('nativewind/dist/metro');
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");
const defaultConfig = getDefaultConfig(__dirname);

const {
  resolver: { sourceExts, assetExts },
} = getDefaultConfig(__dirname, { isCSSEnabled: true });

const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
    babelTransformerPath: require.resolve("react-native-svg-transformer"),
  },
  resolver: {
    assetExts: assetExts.filter((ext) => ext !== "svg"),
    sourceExts: [...sourceExts, "svg"],
  },
  maxWorkers: 4, // Optimize parallel processing
  resetCache: false, // Prevent unnecessary cache resets
  watchFolders: [monorepoRoot],
  server: {
    port: 8081,
    enhanceMiddleware: (middleware) => {
      return (req, res, next) => {
        if (req.url.endsWith('.map')) {
          res.setHeader('Cache-Control', 'public, max-age=3600');
        }
        return middleware(req, res, next);
      };
    },
  },
};

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

const mergedConfig = mergeConfig(defaultConfig, config);
module.exports = withNativeWind(mergedConfig, { input: './src/assets/css/global.css' });
