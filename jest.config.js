const path = require('path');

const src = path.resolve(__dirname, 'src');

/** @type {import('jest').Config} */
module.exports = {
  preset: '@react-native/jest-preset',
  setupFilesAfterEnv: ['<rootDir>/jest/setup.ts'],
  testMatch: ['**/__tests__/**/*.(test|spec).(ts|tsx|js)', '**/?(*.)+(test|spec).(ts|tsx|js)'],
  moduleNameMapper: {
    '^@components(.*)$': `${src}/components$1`,
    '^@screens(.*)$': `${src}/screens$1`,
    '^@navigation(.*)$': `${src}/navigation$1`,
    '^@hooks(.*)$': `${src}/hooks$1`,
    '^@services(.*)$': `${src}/services$1`,
    '^@storage(.*)$': `${src}/storage$1`,
    '^@utils(.*)$': `${src}/utils$1`,
    '^@constants(.*)$': `${src}/constants$1`,
    '^@theme(.*)$': `${src}/theme$1`,
    '^@store(.*)$': `${src}/store$1`,
    '^@types(.*)$': `${src}/types$1`,
    '^@assets(.*)$': `${src}/assets$1`,
    '^@features(.*)$': `${src}/features$1`,
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@rn-org|@notifee|react-redux|@reduxjs|immer|redux|@react-navigation)/)',
  ],
};
