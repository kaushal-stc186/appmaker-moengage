"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getMoEngageExpoPlugin;
/**
 * MoEngage Expo Plugin Configuration
 *
 * This configuration maps Appmaker dashboard settings to the MoEngage Expo plugin format.
 * The official react-native-expo-moengage plugin handles all native configuration.
 *
 * Dashboard Settings Reference:
 * - moengage_app_id: MoEngage workspace ID (e.g., "KPJ4U8FK5F762R9R8817H6V1")
 * - moengage_data_center: Data center (0=US, 1=EU, 2=India, 3=SERV1)
 * - moengage_ios_debug: Enable debug logs on iOS (also used for Android for consistency)
 *
 * Note: Old implementation had Android debug logs hardcoded to true.
 * Now using moengage_ios_debug for both platforms for unified control.
 *
 * For more information:
 * https://developers.moengage.com/hc/en-us/articles/39610614807828-Configure-the-MoEngage-Expo-SDK
 */
function getMoEngageExpoPlugin(config) {
    const { extensionSettings, helpers } = config;
    const packageName = helpers.getPackageName();
    // Extract MoEngage settings from dashboard
    const moengageAppId = extensionSettings.moengage_app_id || 'YOUR_MOENGAGE_APP_ID';
    const dataCenter = extensionSettings.moengage_data_center || '0';
    const debugLogs = extensionSettings.moengage_ios_debug || false;
    // Get absolute path to config files
    const projectRoot = process.cwd();
    // Build the MoEngage plugin configuration
    const pluginConfig = {
        android: {
            // File-based configuration
            configFilePath: `${projectRoot}/assets/moengage/android_initilisation_config.xml`,
            // Use inline configuration instead of XML file
            moengageAppId: moengageAppId,
            dataCenter: `DATA_CENTER_0${dataCenter}`,
            enableLogs: debugLogs,
            logLevel: 'VERBOSE',
            // Push notification configuration
            smallIconName: 'ic_push',
            largeIconName: 'ic_launcher',
            // Firebase configuration
            includeFirebaseMessagingDependencies: true,
            isExpoNotificationIntegration: true,
            shouldIncludeMoEngageFirebaseMessagingService: true,
            // Backup configuration
            disableMoEngageDefaultBackupFile: false,
        },
        apple: {
            // File-based configuration
            configFilePath: `${projectRoot}/assets/moengage/MoEngage-Config.plist`,
            // Use inline configuration instead of Plist file
            moengageAppId: moengageAppId,
            dataCenter: dataCenter,
            enableLogs: debugLogs,
            // App group for notification extensions
            appGroupId: `group.${packageName}`,
            // Push notification features
            pushNotificationImpressionTrackingEnabled: true,
            richPushNotificationEnabled: true,
            pushTemplatesEnabled: true,
            // Device-triggered notifications (Real-Time Triggers)
            deviceTriggerEnabled: true,
        }
    };
    return [
        'react-native-expo-moengage',
        pluginConfig
    ];
}
