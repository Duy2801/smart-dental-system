const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const resolvePackage = packageName =>
  path.dirname(
    require.resolve(`${packageName}/package.json`, { paths: [__dirname] }),
  );

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const appRoot = __dirname;
const workspaceRoot = path.resolve(__dirname, '../..');
const workspaceNodeModules = path.resolve(workspaceRoot, 'node_modules');

const config = {
  projectRoot: appRoot,
  watchFolders: [workspaceRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(appRoot, 'node_modules'),
      workspaceNodeModules,
    ],
    extraNodeModules: {
      react: resolvePackage('react'),
      'react-native': resolvePackage('react-native'),
      '@tanstack/react-query': resolvePackage('@tanstack/react-query'),
    },
  },
};

module.exports = withNativeWind(mergeConfig(getDefaultConfig(__dirname), config), {
  input: './global.css',
});
