/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      testBinaryPath: 'android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk',
      build: 'node scripts/detox-build-android.js debug',
      reversePorts: [8081],
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      testBinaryPath:
        'android/app/build/outputs/apk/androidTest/release/app-release-androidTest.apk',
      build: 'node scripts/detox-build-android.js release',
    },
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/Plarem.app',
      build:
        'xcodebuild -workspace ios/Plarem.xcworkspace -scheme Plarem -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/Plarem.app',
      build:
        'xcodebuild -workspace ios/Plarem.xcworkspace -scheme Plarem -configuration Release -sdk iphonesimulator -derivedDataPath ios/build',
    },
  },
  devices: {
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_6_API_34',
      },
    },
    attached: {
      type: 'android.attached',
      device: {
        adbName: 'R5CR11BAHBR',
      },
    },
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 16',
      },
    },
  },
  configurations: {
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
    'android.att.debug': {
      device: 'attached',
      app: 'android.debug',
    },
    'android.emu.release': {
      device: 'emulator',
      app: 'android.release',
    },
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'ios.sim.release': {
      device: 'simulator',
      app: 'ios.release',
    },
  },
};
