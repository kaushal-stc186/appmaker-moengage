import { appmaker, emitEvent, log } from '@appmaker-xyz/core';
import { Platform, Linking } from 'react-native';
import ReactMoE, {
  MoEGeoLocation,
  MoEPushConfig,
  MoEInitConfig,
  MoEngageLogConfig,
  MoEngageLogLevel,
} from 'react-native-moengage';
import { ACTION_TEST } from './actions';
import Playground from './pages/Playground';
import { activateAnalyticsEvents } from './event-v2';
import { setTransFormedMapping } from './helper';
import * as Notifications from 'expo-notifications';

const Moengage = {
  id: 'moengage',
  name: 'Moengage',
  activate,
};

export function activate({ settings }) {
  // TODO: https://url/ID={{UserAttribute[‘ID’]}} add this param to every webview url.

  setTransFormedMapping(settings?.custom_event_mapping);
  appmaker.addFilter(
    'push-ios-notification-data',
    'moengage-notification-data',
    (notification) => {
      const moe_deeplink = notification?._data?.app_extra?.moe_deeplink;
      if (moe_deeplink) {
        if (moe_deeplink?.includes('onelink.me')) {
          console.log('inside the onelink.me:', moe_deeplink);
          return null;
        } else {
          const action = {
            type: 'DEEPLINK_ACTION',
            params: {
              url: moe_deeplink,
            },
          };
          return action;
        }
      }
      return null;
    },
  );
  ReactMoE.setEventListener('pushClicked', (notificationPayload) => {
    log('MoEngage: pushClicked', notificationPayload);
    // alert('pushClicked'+JSON.stringify(notificationPayload));
    console.log('pushClicked', notificationPayload);
  });

  ReactMoE.setEventListener(
    'inAppCampaignClicked',
    async (notificationPayload) => {
      log('MoEngage: inAppCampaignClicked', notificationPayload);
      console.log('inAppCampaignClicked', JSON.stringify(notificationPayload));
      if (notificationPayload?.action?.navigationType === 'deep_linking') {
        const deeplink = notificationPayload?.action?.navigationUrl;
        if (deeplink) {
          emitEvent('OPEN_DEEPLINK', { url: deeplink });
          const supported = await Linking.canOpenURL(deeplink);
          if (supported) {
            await Linking.openURL(deeplink);
          }
        }
      }
    },
  );

  ReactMoE.setEventListener('inAppCampaignCustomAction', async (inAppInfo) => {
    log(
      'MoEngage: inAppCampaignCustomAction inAppInfo?.action?.keyValuePair =>',
      inAppInfo?.action?.keyValuePair,
    );
    if (inAppInfo?.action?.keyValuePair) {
      const deeplink =
        inAppInfo?.action?.keyValuePair?.Deeplinking ||
        inAppInfo?.action?.keyValuePair?.url;
      if (deeplink) {
        emitEvent('OPEN_DEEPLINK', { url: deeplink });
        const supported = await Linking.canOpenURL(deeplink);
        if (supported) {
          await Linking.openURL(deeplink);
        }
      }
    }
  });
  // MoEInitConfig has no TEST/LIVE flag. Workspace env is native XML/plist (`test` on this branch).
  // initialize() is still required so *_N trackEvent reaches the native SDK.
  const moEInitConfig = new MoEInitConfig(
    MoEPushConfig.defaultConfig(),
    new MoEngageLogConfig(MoEngageLogLevel.VERBOSE, true),
  );
  ReactMoE.initialize(settings?.moengage_app_id, moEInitConfig);
  log('MoEngage: JS initialize done; workspace env is native file-based TEST');
  ReactMoE.showInApp();
  ReactMoE.showNudge();
  ReactMoE.enableAdIdTracking();
  if (Platform.OS === 'ios') {
    ReactMoE.registerForPush();
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  }
  // import ReactMoE, from "react-native-moengage";
  appmaker.pages.registerPage('moengagePlayground', Playground);
  // appmaker.addFilter(
  //   'home-page-id',
  //   'moengagePlayground',
  //   () => 'moengagePlayground',
  // );
  appmaker.actions.registerAction('ACTION_TEST_MOENGAGE', ACTION_TEST);
  activateAnalyticsEvents(settings);
  // let properties = new MoEProperties();
  // properties.addAttribute('quantity', 1);
  // properties.addAttribute('product', 'iPhone');
  // properties.addAttribute('currency', 'dollar');
  // properties.addAttribute('price', 699);
  // properties.addAttribute('new_item', true);
  // properties.addDateAttribute('purchase_date', '2020-06-10T12:42:10Z');
  // properties.addLocationAttribute(
  //   'store_location',
  //   new MoEGeoLocation(90.00001, 180.00001),
  // );
  // ReactMoE.trackEvent('Purchase', properties);
}
appmaker.registerPlugin(Moengage);
export default Moengage;
