module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@rn-org|@notifee|react-redux|@reduxjs|immer|redux)/)',
  ],
};
