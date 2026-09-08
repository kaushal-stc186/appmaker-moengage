/**
 * MoEngage Expo Plugin - Generate config files from dashboard settings
 * Reads MoEngage settings and generates config files dynamically
 */

const { withDangerousMod, withAndroidManifest } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Extract MoEngage plugin settings from appmakerConfig
 */
function getMoEngageSettings(config) {
  const appmakerConfig = config.appmakerConfig;
  if (!appmakerConfig || !appmakerConfig.plugins) {
    console.warn('[MoEngage Plugin] No appmakerConfig.plugins found');
    return null;
  }

  const pluginSettings = appmakerConfig.plugins.find(
    (plugin) => plugin.id === 'moengage'
  )?.settings;

  if (!pluginSettings) {
    console.warn('[MoEngage Plugin] No MoEngage settings found in appmakerConfig');
    return null;
  }

  return pluginSettings;
}

/**
 * Generate Android XML config from dashboard settings
 */
function generateAndroidConfigXML(settings) {
  const appId = settings.moengage_app_id || 'YOUR_WORKSPACE_ID';
  // Data center: convert to integer, default to 1 (US) per official config
  const dataCenterStr = settings.moengage_data_center || '1';
  const dataCenter = parseInt(dataCenterStr, 10) || 1;
  const enableLogs = settings.moengage_ios_debug || false;
  const logLevel = enableLogs ? '5' : '2'; // 5=VERBOSE, 2=WARN (default)

  return `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <bool name="com_moengage_core_file_based_initialisation_enabled">true</bool>
    <string name="com_moengage_core_workspace_id">${appId}</string>
    <integer name="com_moengage_core_data_center">${dataCenter}</integer>
    <string name="com_moengage_core_environment">default</string>
    <drawable name="com_moengage_cards_ui_place_holder_image" />
    <drawable name="com_moengage_cards_ui_inbox_empty_image" />
    <string name="com_moengage_cards_ui_date_format">MMM dd</string>
    <bool name="com_moengage_cards_ui_swipe_refresh_enabled">true</bool>
    <integer name="com_moengage_push_notification_token_retry_interval">60</integer>
    <drawable name="com_moengage_push_notification_small_icon">@drawable/small_icon</drawable>
    <drawable name="com_moengage_push_notification_large_icon">@drawable/large_icon</drawable>
    <color name="com_moengage_push_notification_color">#1574B3</color>
    <bool name="com_moengage_push_multiple_notification_in_drawer_enabled">false</bool>
    <bool name="com_moengage_push_building_back_stack_enabled">false</bool>
    <bool name="com_moengage_push_large_icon_display_enabled">true</bool>
    <bool name="com_moengage_push_direct_posting_for_heads_up_enabled">true</bool>
    <bool name="com_moengage_fcm_registration_enabled">false</bool>
    <bool name="com_moengage_push_kit_registration_enabled">true</bool>
    <integer name="com_moengage_core_log_level">${logLevel}</integer>
    <bool name="com_moengage_core_log_enabled_for_release_build">${enableLogs}</bool>
    <bool name="com_moengage_core_carrier_tracking_enabled">true</bool>
    <bool name="com_moengage_core_device_attribute_tracking_enabled">true</bool>
    <string-array name="com_moengage_core_screen_tracking_opt_out_activities" />
    <bool name="com_moengage_core_screen_tracking_package_filtering_enabled">true</bool>
    <string-array name="com_moengage_core_screen_tracking_whitelisted_packages" />
    <bool name="com_moengage_rtt_background_sync_enabled">true</bool>
    <string-array name="com_moengage_inapp_display_opt_out_activities" />
    <bool name="com_moengage_inapp_show_in_new_activity_enabled">false</bool>
    <bool name="com_moengage_core_periodic_data_sync_enabled">true</bool>
    <integer name="com_moengage_core_periodic_data_sync_interval">60</integer>
    <bool name="com_moengage_core_background_data_sync_enabled">true</bool>
    <string name="com_moengage_core_integration_partner" />
    <bool name="com_moengage_core_storage_encryption_enabled">false</bool>
    <bool name="com_moengage_core_network_encryption_enabled">false</bool>
    <string name="com_moengage_core_encryption_encoded_debug_key" />
    <string name="com_moengage_core_encryption_encoded_release_key" />
    <bool name="com_moengage_core_jwt_authorization_enabled">false</bool>
    <bool name="com_moengage_core_should_cache_connection">true</bool>
    <bool name="com_moengage_core_user_registration_enabled">false</bool>
</resources>`;
}

/**
 * Generate iOS plist config from dashboard settings
 */
function generateIOSConfigPlist(settings, bundleId, appGroupId) {
  const appId = settings.moengage_app_id || 'YOUR_APP_ID';
  // Data center: convert to integer, default to 1 (US) per official config
  const dataCenterStr = settings.moengage_data_center || '1';
  const dataCenter = parseInt(dataCenterStr, 10) || 1;
  const enableLogs = settings.moengage_ios_debug || false;
  const logLevel = enableLogs ? '5' : '2'; // 5=VERBOSE, 2=WARN (default)
  // Use provided appGroupId or generate from bundleId
  const groupId = appGroupId || `group.${bundleId}`;
  // Use bundleId directly for keychain group name
  const keychainGroupName = `${bundleId}.MoEngage.keychain`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>IsSdkAutoInitialisationDisabled</key>
	<false/>
	<key>WorkspaceId</key>
	<string>${appId}</string>
	<key>DataCenter</key>
	<integer>${dataCenter}</integer>
	<key>IsTestEnvironment</key>
	<string>$(SWIFT_ACTIVE_COMPILATION_CONDITIONS)</string>
	<key>AppGroupName</key>
	<string>${groupId}</string>
	<key>KeychainGroupName</key>
	<string></string>
	<key>AnalyticsDisablePeriodicFlush</key>
	<false/>
	<key>AnalyticsPeriodicFlushDuration</key>
	<integer>60</integer>
	<key>InAppDisplaySafeAreaInset</key>
	<real>0</real>
	<key>InAppShouldProvideDeeplinkCallback</key>
	<false />
	<key>IsStorageEncryptionEnabled</key>
	<false />
	<key>IsNetworkEncryptionEnabled</key>
	<false />
	<key>EncryptionEncodedTestKey</key>
	<string>debugKey</string>
	<key>EncryptionEncodedLiveKey</key>
	<string>liveKey</string>
	<key>IsJwtEnabled</key>
	<false/>
	<key>IsUserRegistrationEnabled</key>
	<false/>
	<key>IsLoggingEnabled</key>
	<${enableLogs ? 'true' : 'false'} />
	<key>LogLevel</key>
	<integer>${logLevel}</integer>
</dict>
</plist>`;
}

/**
 * Fix Firebase notification color conflict
 * Adds tools:replace to prevent merger conflict with @react-native-firebase/messaging
 */
function withFixFirebaseNotificationConflict(config) {
  return withAndroidManifest(config, (config) => {
    const { manifest } = config.modResults;
    const application = manifest.application?.[0];

    if (application?.['meta-data']) {
      const metaDataArray = application['meta-data'];

      // Find Firebase notification color meta-data
      const notificationColorMeta = metaDataArray.find(
        item => item.$?.['android:name'] === 'com.google.firebase.messaging.default_notification_color'
      );

      if (notificationColorMeta?.$ && !notificationColorMeta.$['tools:replace']) {
        console.log('[MoEngage Plugin] ✅ Adding tools:replace to Firebase notification color');
        notificationColorMeta.$['tools:replace'] = 'android:resource';
      }
    }

    return config;
  });
}










/**
 * Check if AppsFlyer plugin is configured
 */
function hasAppsFlyerPlugin(config) {
  const appmakerConfig = config.appmakerConfig;
  if (!appmakerConfig || !appmakerConfig.plugins) {
    return false;
  }

  return appmakerConfig.plugins.some(
    (plugin) => plugin.id === 'appsflyer'
  );
}

/**
 * Fix AppsFlyer manifest conflict
 * Adds tools:replace to prevent merger conflict with AppsFlyer SDK for dataExtractionRules and fullBackupContent
 * Only applies if AppsFlyer plugin is configured
 */
function withFixAppsFlyerManifestConflict(config) {
  // Check if AppsFlyer is configured before applying the fix
  if (!hasAppsFlyerPlugin(config)) {
    console.log('[MoEngage Plugin] ℹ️ AppsFlyer not detected, skipping manifest conflict fix');
    return config;
  }

  return withAndroidManifest(config, (config) => {
    const { manifest } = config.modResults;
    const application = manifest.application?.[0];

    if (application?.$) {
      // Ensure tools namespace is declared in manifest
      if (!manifest.$ || !manifest.$['xmlns:tools']) {
        if (!manifest.$) {
          manifest.$ = {};
        }
        manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
      }

      // Add tools:replace for dataExtractionRules and fullBackupContent
      const existingReplace = application.$['tools:replace'];
      const replaceAttributes = existingReplace
        ? existingReplace.split(',').map(s => s.trim())
        : [];

      if (!replaceAttributes.includes('android:dataExtractionRules')) {
        replaceAttributes.push('android:dataExtractionRules');
        console.log('[MoEngage Plugin] ✅ Adding tools:replace for android:dataExtractionRules (AppsFlyer conflict)');
      }

      if (!replaceAttributes.includes('android:fullBackupContent')) {
        replaceAttributes.push('android:fullBackupContent');
        console.log('[MoEngage Plugin] ✅ Adding tools:replace for android:fullBackupContent (AppsFlyer conflict)');
      }

      application.$['tools:replace'] = replaceAttributes.join(',');
    }

    return config;
  });
}

/**
 * Copy notification icon to moengage assets folder
 */
function copyNotificationIcons(projectRoot, assetsDir) {
  const filesDir = path.join(projectRoot, 'packages', 'files', 'files');
  const iconNames = ['NOTIFICATION_ICON.png', 'PUSH_NOTIFICATION_ICON.png', 'appicon.png'];

  let sourceIconPath = null;
  let foundIconName = null;

  // Try each icon name in order
  for (const iconName of iconNames) {
    const iconPath = path.join(filesDir, iconName);
    if (fs.existsSync(iconPath)) {
      sourceIconPath = iconPath;
      foundIconName = iconName;
      break;
    }
  }

  if (!sourceIconPath) {
    console.warn('[MoEngage Plugin] ⚠️ No notification icon found. Tried:', iconNames.join(', '));
    return;
  }

  // Copy as small_icon.png
  const smallIconPath = path.join(assetsDir, 'small_icon.png');
  fs.copyFileSync(sourceIconPath, smallIconPath);

  // Copy as large_icon.png
  const largeIconPath = path.join(assetsDir, 'large_icon.png');
  fs.copyFileSync(sourceIconPath, largeIconPath);

  console.log('[MoEngage Plugin] ✅ Copied notification icons from', foundIconName, ':');
  console.log(`  - ${smallIconPath}`);
  console.log(`  - ${largeIconPath}`);
}

/**
 * Generate config files - shared function for both platforms
 */
function generateConfigs(config) {
  const projectRoot = config.modRequest.projectRoot;
  const assetsDir = path.join(projectRoot, 'assets', 'moengage');

  // Get settings from appmakerConfig
  const pluginSettings = getMoEngageSettings(config);

  if (!pluginSettings) {
    console.log('[MoEngage Plugin] ⚠️ No MoEngage settings found, skipping config generation');
    return config;
  }

  // Create directory
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  // Copy notification icons
  copyNotificationIcons(projectRoot, assetsDir);

  // Generate and write Android config
  const androidXML = generateAndroidConfigXML(pluginSettings);
  const androidPath = path.join(assetsDir, 'android_initilisation_config.xml');
  fs.writeFileSync(androidPath, androidXML, 'utf8');

  // Generate and write iOS config
  const bundleId = config?.ios?.bundleIdentifier || config?.android?.package || 'com.appmaker.runtime';
  const iosPlist = generateIOSConfigPlist(pluginSettings, bundleId);
  const iosPath = path.join(assetsDir, 'MoEngage-Config.plist');
  fs.writeFileSync(iosPath, iosPlist, 'utf8');

  console.log('[MoEngage Plugin] ✅ Generated config files:');
  console.log(`  - ${androidPath}`);
  console.log(`  - ${iosPath}`);

  return config;
}

/**
 * Main plugin - generate and write config files from settings
 */
module.exports = function withMoengage(config) {
  // Generate configs immediately, before any platform-specific mods run
  // This ensures the files exist when react-native-expo-moengage plugin runs
  const projectRoot = process.cwd();
  const assetsDir = path.join(projectRoot, 'assets', 'moengage');

  const appmakerConfig = config.appmakerConfig;
  if (appmakerConfig && appmakerConfig.plugins) {
    const pluginSettings = appmakerConfig.plugins.find(
      (plugin) => plugin.id === 'moengage'
    )?.settings;

    if (pluginSettings) {
      // Create directory
      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
      }

      // Copy notification icons
      copyNotificationIcons(projectRoot, assetsDir);

      // Generate and write Android config
      const androidXML = generateAndroidConfigXML(pluginSettings);
      const androidPath = path.join(assetsDir, 'android_initilisation_config.xml');
      fs.writeFileSync(androidPath, androidXML, 'utf8');

      // Generate and write iOS config  
      const bundleId = config?.ios?.bundleIdentifier || config?.android?.package || 'com.appmaker.runtime';
      // Get appGroupId from appmaker.package.plugin.json config if available
      const packagePluginConfig = require(path.join(projectRoot, 'appmaker.package.plugin.json'));
      const moengageConfig = packagePluginConfig?.configured_plugins?.find(p => p[0] === 'react-native-expo-moengage');
      const appGroupId = moengageConfig?.[1]?.apple?.appGroupId;

      const iosPlist = generateIOSConfigPlist(pluginSettings, bundleId, appGroupId);
      const iosPath = path.join(assetsDir, 'MoEngage-Config.plist');
      fs.writeFileSync(iosPath, iosPlist, 'utf8');

      console.log('[MoEngage Plugin] ✅ Generated config files immediately:');
      console.log(`  - ${androidPath}`);
      console.log(`  - ${iosPath}`);
    }
  }

  // Fix Firebase notification manifest conflict
  config = withFixFirebaseNotificationConflict(config);

  // Fix AppsFlyer manifest conflict for dataExtractionRules and fullBackupContent
  config = withFixAppsFlyerManifestConflict(config);

  return config;
};
