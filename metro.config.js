const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add manual mapping for lodash if needed
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'lodash': path.resolve(__dirname, 'node_modules/lodash'),
};

module.exports = config;