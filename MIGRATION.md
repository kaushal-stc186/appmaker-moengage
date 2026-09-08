# MoEngage Plugin Migration to Official Expo SDK

## Overview
The MoEngage plugin has been refactored to use the official `react-native-expo-moengage` Expo plugin instead of custom native code injection.

## What Changed

### Before (v0.2.39)
- ❌ Custom native code injection via `buildConfig/ios.js` and `buildConfig/android.js`
- ❌ Manual modifications to AppDelegate, AndroidManifest, gradle files, Podfile
- ❌ ~600 lines of custom native configuration code
- ❌ Difficult to maintain and upgrade

### After (v0.2.40)
- ✅ Official Expo plugin handles all native configuration
- ✅ Declarative configuration via `appmaker.config.ts`
- ✅ Simplified `app.plugin.js` (just a stub)
- ✅ Easy to maintain and upgrade
- ✅ Consistent with other plugins (e.g., CleverTap)

## Files Modified

1. **package.json**
   - Added `react-native-expo-moengage` peer dependency
   - Added `expo-config` reference to `appmaker.config.ts`
   - Bumped version to 0.2.40

2. **app.plugin.js**
   - Simplified to stub (native config handled by official plugin)
   - Added documentation comments

3. **appmaker.config.ts** (NEW)
   - Maps dashboard settings to MoEngage plugin configuration
   - Handles both Android and iOS configuration
   - Supports all MoEngage features (push, in-app, rich media, etc.)

4. **buildConfig/** → **buildConfig.old/**
   - Archived old custom native code for reference
   - Can be deleted after verification

## Dashboard Settings Mapping

| Dashboard Setting | Plugin Configuration |
|------------------|---------------------|
| `moengage_app_id` | `moengageAppId` (Android & iOS) |
| `moengage_data_center` | `dataCenter` (Android: `DATA_CENTER_0X`, iOS: `X`) |
| `moengage_ios_debug` | `enableLogs` (iOS) |
| `moengage_android_debug` | `enableLogs` (Android) |
| Package name | `appGroupId: group.{packageName}` (iOS) |

## Features Enabled

### Android
- ✅ MoEngage SDK initialization
- ✅ Firebase Cloud Messaging integration
- ✅ Push notifications with custom icons
- ✅ Debug logging
- ✅ Backup file configuration

### iOS
- ✅ MoEngage SDK initialization
- ✅ App Groups for notification extensions
- ✅ Push notification impression tracking
- ✅ Rich push notifications
- ✅ Push templates
- ✅ Device-triggered notifications (Real-Time Triggers)
- ✅ Debug logging

## JavaScript Integration
No changes to JavaScript integration:
- ✅ `index.js` - Core plugin logic
- ✅ `event-v2.js` - Event tracking
- ✅ `helper.js` - Utility functions
- ✅ All event listeners and deep linking work as before

## Testing Checklist

After running `yarn install` and `expo prebuild`, verify:

- [ ] Push notifications work (Android & iOS)
- [ ] In-app messages display correctly
- [ ] Event tracking functions (check MoEngage dashboard)
- [ ] Deep linking from notifications works
- [ ] Rich media in notifications displays
- [ ] Debug logs appear (if enabled)

## Rollback

If needed, rollback by:
1. Restore `buildConfig.old/` → `buildConfig/`
2. Restore old `app.plugin.js` from git history
3. Remove `appmaker.config.ts`
4. Update `package.json` to version 0.2.39

## References

- [MoEngage Expo Installation](https://developers.moengage.com/hc/en-us/articles/39610555696148-Installation)
- [MoEngage Expo Configuration](https://developers.moengage.com/hc/en-us/articles/39610614807828-Configure-the-MoEngage-Expo-SDK)
- [CleverTap Plugin Reference](../plugin-clevertap/appmaker.config.ts)

## Migration Date
October 21, 2024
