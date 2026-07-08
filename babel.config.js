module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
        allowUndefined: true,
      },
    ],
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        alias: {
          '@components': './src/components',
          '@screens': './src/screens',
          '@navigation': './src/navigation',
          '@hooks': './src/hooks',
          '@services': './src/services',
          '@storage': './src/storage',
          '@utils': './src/utils',
          '@constants': './src/constants',
          '@theme': './src/theme',
          '@store': './src/store',
          '@types': './src/types',
          '@assets': './src/assets',
          '@features': './src/features',
        },
      },
    ],
  ],
};
