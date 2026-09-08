import { appmaker } from '@appmaker-xyz/core';
import ReactMoE, { MoEProperties } from 'react-native-moengage';
import { getTransformedEventName } from './helper';
export async function recordEvent(eventName, params, eventObject) {
  try {
    const moengageEventData = await appmaker.applyFilters('moengageEventData', {
      eventName,
      params,
      eventObject,
    });
    let properties = new MoEProperties();
    for (let key in moengageEventData.params) {
      properties.addAttribute(key, params[key]);
    }
    ReactMoE.trackEvent(
      getTransformedEventName(moengageEventData.eventName),
      properties,
    );
  } catch (error) {
    console.log('moengage: error ' + JSON.stringify(error));
  }
}
