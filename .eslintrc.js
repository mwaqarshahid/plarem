module.exports = {
  root: true,
  extends: '@react-native',
  ignorePatterns: ['e2e/**'],
  overrides: [
    {
      files: ['scripts/**/*.js'],
      env: { node: true },
    },
  ],
};
