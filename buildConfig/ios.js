const { withDangerousMod, withAppDelegate, withInfoPlist, withEntitlementsPlist } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');
const getNotificationServiceContent = require('./files/NotificationServiceSwift');
const getNotificationContentContent = require('./files/NotificationContentSwift');
const getMainInterfaceContent = require('./files/MainInterface');
const getServiceEntitlements = require('./files/ServiceEntitlements');
const getContentEntitlements = require('./files/ContentEntitlements');

function applyCustomReplacement(config, options) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const { filename, search, replace, replaceFile = false } = options;
      // Assuming `replace` can directly use the projectName without further manipulation
      // If manipulation is needed, you can do it before calling this function

      const iosPath = path.join(config.modRequest.projectRoot, 'ios');
      const targetFilePath = path.join(iosPath, ...filename.split('/')); // Assuming filename is a path relative to the ios directory

      if (fs.existsSync(targetFilePath)) {
        if (replaceFile) {
          fs.writeFileSync(targetFilePath, replace);
        } else {
          let content = fs.readFileSync(targetFilePath, 'utf8');
          if(content.includes(replace)) {
            return config;
          }
          const newContent = content.replace(new RegExp(search, 'g'), replace);
          fs.writeFileSync(targetFilePath, newContent);
        }
      } else {
        console.error(`File ${targetFilePath} does not exist.`);
      }

      return config;
    },
  ]);
}

function applyNotificationContentExtension(config, pluginSettings) {
  config = applyCustomReplacement(config, {
    filename: 'AppmakerPushContentExtension/NotificationViewController.swift',
    replace: getNotificationContentContent(config, pluginSettings),
    replaceFile: true,
  });
  config = applyCustomReplacement(config, {
    filename: 'AppmakerPushContentExtension/Base.lproj/MainInterface.storyboard',
    replace: getMainInterfaceContent(config, pluginSettings),
    replaceFile: true,
  });

  return config;
}

function applyNotificationServiceExtension(config, pluginSettings) {
  config = applyCustomReplacement(config, {
    filename: 'AppmakerPushServiceExtension/NotificationService.swift',
    replace: getNotificationServiceContent(config, pluginSettings),
    replaceFile: true,
  });
  return config;
}

function applyInfoPlist(config, pluginSettings) {
  return withInfoPlist(config, async (config) => {
    // Ensure that the Info.plist object exists
    config.modResults = config.modResults || {};
    
    config.modResults['MoEngageAppDelegateProxyEnabled'] = false;
    // Add or update the MoEngage dictionary in Info.plist
    // console.log(config?.ios?.bundleIdentifier)
    config.modResults.MoEngage = {
      APP_GROUP_ID: 'group.'+ config?.ios?.bundleIdentifier,
      DATA_CENTER: 'DATA_CENTER_0'+pluginSettings?.moengage_data_center,
      ENABLE_LOGS: pluginSettings?.moengage_ios_debug,
      MoEngage_APP_ID: pluginSettings?.moengage_app_id,
    };

    return config;
  });
}

const applyAppDelegate = (config, pluginSettings) => {
  return config = withAppDelegate(config, (config) => {
    if (config.modResults.contents.includes('MoEngage')) {
      return config;
    }
    const importLine = '#import <React/RCTLinkingManager.h>';
    const didFinishLaunchingWithOptionsLine = '[FIRApp configure];';
    const openURLLine = `- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {`;
    const didRegisterForRemoteNotificationsWithDeviceTokenLine = `return [super application:application didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];`;
    const didReceiveRemoteNotificationLine = `return [super application:application didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];`;
    const endLine = `@end`;
    config.modResults.contents = config.modResults.contents.replace(
      importLine,
      `${importLine}
      #import <ReactNativeMoEngage/MoEngageInitializer.h>
      #import <MoEngageSDK/MoEngageSDK.h>
      #import <UserNotifications/UNUserNotificationCenter.h>
      `,
    );
    config.modResults.contents = config.modResults.contents.replace(
      didFinishLaunchingWithOptionsLine,
      `UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
      center.delegate = self;
      ${didFinishLaunchingWithOptionsLine}
      `);
    config.modResults.contents = config.modResults.contents.replace(
      didFinishLaunchingWithOptionsLine,
      `${didFinishLaunchingWithOptionsLine}

      // Set Data Center
      MoEngageSDKConfig* sdkConfig = [[MoEngageSDKConfig alloc] initWithAppId:@"${pluginSettings?.moengage_app_id}" dataCenter: MoEngageDataCenterData_center_0${pluginSettings?.moengage_data_center}];
      MoEngageConsoleLogConfig *logConfig = [[MoEngageConsoleLogConfig alloc] initWithIsLoggingEnabled:${pluginSettings?.moengage_ios_debug?'YES':'NO'} loglevel:MoEngageLoggerTypeVerbose];
      sdkConfig.consoleLogConfig = logConfig;
      sdkConfig.appGroupID = @"group.${config?.ios?.bundleIdentifier}";
      [[MoEngageInitializer sharedInstance] initializeDefaultSDKConfig:sdkConfig andLaunchOptions:launchOptions];
    `);
    config.modResults.contents = config.modResults.contents.replace(
      openURLLine,
      `${openURLLine}
        [[MoEngageSDKAnalytics sharedInstance] processURL:url];
      `);
    config.modResults.contents = config.modResults.contents.replace(
      didRegisterForRemoteNotificationsWithDeviceTokenLine,
      `[[MoEngageSDKMessaging sharedInstance] setPushToken:deviceToken];
      ${didRegisterForRemoteNotificationsWithDeviceTokenLine}
      `);
    config.modResults.contents = config.modResults.contents.replace(
      didReceiveRemoteNotificationLine,
      `[[MoEngageSDKMessaging sharedInstance] didReceieveNotificationInApplication:application withInfo:userInfo];
      ${didReceiveRemoteNotificationLine}
      `);
    config.modResults.contents = config.modResults.contents.replace(
      endLine,
      `
      - (void)userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse *)response withCompletionHandler:(void (^)())completionHandler
      {
        [[MoEngageSDKMessaging sharedInstance] userNotificationCenter:center didReceive:response];
      }
      ${endLine}
      `,
    );
    config.modResults.contents = config.modResults.contents.replace(
      endLine,
      `
      - (void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler
      {
        if (@available(iOS 14.0, *)) {
            completionHandler(UNNotificationPresentationOptionBadge | UNNotificationPresentationOptionSound | UNNotificationPresentationOptionList | UNNotificationPresentationOptionBanner);
          } else {
            // Fallback on earlier versions
            completionHandler(UNAuthorizationOptionSound | UNAuthorizationOptionAlert | UNAuthorizationOptionBadge);
          }
      }
      ${endLine}
      `,
    );

    return config;
  });
}

function applyPodFile(config) {
  config = applyCustomReplacement(config, {
    filename: 'Podfile',
    replace: `
    pod 'MoEngageRichNotification' # service extension
    `,
    search: `pod 'FirebaseMessaging'`,
  });
  config = applyCustomReplacement(config, {
    filename: 'Podfile',
    replace: `
    pod 'MoEngageRichNotification'  # content extension
    `,
    search: `# Required for the push notification content extension`,
  });
  return config;
}

function applyEntitlements(config, pluginSettings) {
  config = withEntitlementsPlist(config, (config) => {
    config.modResults['com.apple.security.application-groups'] = ['group.'+config?.ios?.bundleIdentifier];
    return config;
  });
  config = applyCustomReplacement(config, {
    filename: 'AppmakerPushServiceExtension/AppmakerPushServiceExtension.entitlements',
    replace: getServiceEntitlements(config, pluginSettings),
    replaceFile: true,
  });
  config = applyCustomReplacement(config, {
    filename: 'AppmakerPushContentExtension/AppmakerPushContentExtension.entitlements',
    replace: getContentEntitlements(config, pluginSettings),
    replaceFile: true,
  });
  return config;
}

function applyAppDelegateH(config, pluginSettings) {
  config = applyCustomReplacement(config, {
    filename: 'AppmakerRuntime/AppDelegate.h',
    search: '#import <Expo/Expo.h>',
    replace: `#import <Expo/Expo.h>
    #import <UserNotifications/UNUserNotificationCenter.h>
    `,
  });
  config = applyCustomReplacement(config, {
    filename: 'AppmakerRuntime/AppDelegate.h',
    search: '@interface AppDelegate : EXAppDelegateWrapper',
    replace: '@interface AppDelegate : EXAppDelegateWrapper<UNUserNotificationCenterDelegate>',
  });
  return config;
}

module.exports.applyIos = function applyIos(config, pluginSettings) {
  config = applyInfoPlist(config, pluginSettings);
  config = applyAppDelegate(config, pluginSettings);
  config = applyAppDelegateH(config, pluginSettings);
  config = applyNotificationContentExtension(config, pluginSettings);
  config = applyNotificationServiceExtension(config, pluginSettings);
  config = applyPodFile(config);
  config = applyEntitlements(config, pluginSettings);
  return config;
};
