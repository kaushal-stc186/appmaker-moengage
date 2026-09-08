const {
  withDangerousMod,
  withAndroidManifest,
  AndroidConfig,
  withAppBuildGradle,
  withProjectBuildGradle,
} = require('expo/config-plugins');
const { withBuildProperties } = require('expo-build-properties');
const fs = require('fs');
const { addMetaDataItemToMainApplication, getMainApplicationOrThrow } =
  AndroidConfig.Manifest;
const {
  withCustomMainApplication,
  withCustomAppBuildGradleImplementation,
} = require('@appmaker-xyz/expo-plugins');
const path = require('path');

const PATH_TO_ADD_IN_ANDROID = `compileSdkVersion rootProject.ext.compileSdkVersion`;
const PATH_TO_ADD_FOR_APPLY_PLUGIN = `apply plugin: "com.facebook.react"`;
const PATH_TO_ADD_IN_PROJECT_GRADLE_DEPENDENCIES = `classpath('com.facebook.react:react-native-gradle-plugin')`;

const withCustomAppGradle = (config, path, { implementationPackage }) => {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.contents.includes(implementationPackage)) {
      return config;
    }
    config.modResults.contents = config.modResults.contents.replace(
      path,
      `${path}
    ${implementationPackage}`,
    );
    return config;
  });
};
const withCustomProjectGradle = (config, path, { implementationPackage }) => {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.contents.includes(implementationPackage)) {
      return config;
    }
    config.modResults.contents = config.modResults.contents.replace(
      path,
      `${path}
    ${implementationPackage}`,
    );
    return config;
  });
};
const applyMainApplication = (config, pluginSettings) => {
  config = withCustomMainApplication(config, {
    javaImports: [
      'com.moengage.core.LogLevel',
      'com.moengage.core.MoEngage',
      'com.moengage.core.config.LogConfig',
      'com.moengage.core.config.NotificationConfig',
      'com.moengage.react.MoEInitializer',
      'com.moengage.pushbase.MoEPushHelper',
      'androidx.lifecycle.ProcessLifecycleOwner',
      'com.moengage.core.DataCenter',
    ],
    onCreateAfterSoLoader: `
    MoEngage.Builder moEngage =
        new MoEngage.Builder(this, "${pluginSettings?.moengage_app_id}")
            .configureLogs(new LogConfig(LogLevel.VERBOSE, true))
            .setDataCenter(DataCenter.DATA_CENTER_${pluginSettings?.moengage_data_center})
            .configureNotificationMetaData(new NotificationConfig(R.mipmap.ic_push, R.mipmap.ic_launcher));
                MoEInitializer.INSTANCE.initializeDefaultInstance(getApplicationContext(), moEngage);
              `,
  });
  return config;
};

const withCustomConfigManifest = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const mainApplication = getMainApplicationOrThrow(androidManifest);
    const moengagePushService = {
      $: {
        'android:name': 'com.moengage.firebase.MoEFireBaseMessagingService',
        'android:exported': 'true',
      },
      'intent-filter': [
        {
          action: [
            {
              $: {
                'android:name': 'com.google.firebase.MESSAGING_EVENT',
              },
            },
          ],
        },
      ],
    };
    if (!mainApplication.service) {
      mainApplication.service = [moengagePushService];
    } else {
      const existingService = mainApplication.service.find(
        (e) =>
          e['$']['android:name'] === moengagePushService['$']['android:name'],
      );
      if (!existingService) {
        mainApplication.service.push(moengagePushService);
      }
    }
    config.modResults = androidManifest;
    return config;
  });
};

function applyBuildProperties(config) {
  return withBuildProperties(config, {
    android: {
      compileSdkVersion: 34,
      buildToolsVersion: '34.0.0',
      targetSdkVersion: 34,
      kotlinVersion: '1.8.0',
      minSdkVersion: 26,
    },
  });
}
module.exports.applyAndroid = function applyAndroid(config, pluginSettings) {
  config = withCustomAppBuildGradleImplementation(config, {
    implementationPackage: `implementation("com.moengage:moe-android-sdk:13.04.00")
    implementation("androidx.core:core:1.9.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("androidx.lifecycle:lifecycle-process:2.7.0")
    implementation project(":react-native-moengage")
    implementation("com.moengage:inbox-core:3.1.0")
    implementation('com.google.firebase:firebase-messaging:23.1.1')
    implementation("com.moengage:inapp:8.5.0")
    implementation("com.moengage:rich-notification:5.1.0")
    implementation("org.jetbrains.kotlin:kotlin-stdlib:$kotlinVersion")
    implementation("com.github.bumptech.glide:glide:4.9.0")`,
  });
  config = withCustomProjectGradle(
    config,
    PATH_TO_ADD_IN_PROJECT_GRADLE_DEPENDENCIES,
    {
      implementationPackage: `
      classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion"`,
    },
  );
  config = withCustomAppGradle(config, PATH_TO_ADD_IN_ANDROID, {
    implementationPackage: `kotlinOptions {
      jvmTarget = '1.8'
  }`,
  });
  config = withCustomAppGradle(config, PATH_TO_ADD_FOR_APPLY_PLUGIN, {
    implementationPackage: `apply plugin: "kotlin-android"`,
  });
  config = applyMainApplication(config, pluginSettings);
  config = withCustomConfigManifest(config);
  config = applyBuildProperties(config);
  return config;
};
