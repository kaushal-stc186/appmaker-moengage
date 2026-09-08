import ReactMoE from 'react-native-moengage';
import { shopifyIdHelper } from '@appmaker-xyz/shopify';
import { appPluginStoreApi, log } from '@appmaker-xyz/core';

let transformedMappingObject = {};

export function setTransFormedMapping(custom_event_mapping) {
  if (custom_event_mapping && custom_event_mapping.length > 0) {
    transformedMappingObject = custom_event_mapping.reduce((acc, mapping) => {
      acc[mapping.appmakerEventName] = mapping.customEventName;
      return acc;
    }, {});
  }
}

export function getTransformedEventName(eventName) {
  try {
    return transformedMappingObject[eventName] || eventName;
  } catch (error) {
    return eventName;
  }
}

export function moengageSetProfile(params, context) {
  try {
    const settings = appPluginStoreApi().getState().plugins?.moengage?.settings;
    const { moengage_unique_user_id_type } = settings;
    const { email, phone, id, name } = params;
    const { firstName, lastName } = context?.customer;
    let uniqueID = email;
    if (
      moengage_unique_user_id_type &&
      moengage_unique_user_id_type === 'user_id' &&
      id
    ) {
      uniqueID = shopifyIdHelper(id);
    } else if (
      moengage_unique_user_id_type &&
      moengage_unique_user_id_type === 'phone' &&
      phone
    ) {
      if (phone && phone.length > 0) {
        const phoneWithoutSpacesAndSpecialCharacters = phone.replace(
          /[^a-zA-Z0-9]/g,
          '',
        );
        if (!settings?.need_special_characters_in_phone_number) {
          uniqueID = phoneWithoutSpacesAndSpecialCharacters;
        } else {
          uniqueID = phone;
        }
        if (
          phoneWithoutSpacesAndSpecialCharacters.length == 10 &&
          settings?.confirm_adding_static_country_code_before_phone_number_unique_id ==
            true &&
          settings?.static_country_code_before_phone_number_unique_id
        ) {
          uniqueID =
            settings?.static_country_code_before_phone_number_unique_id +
            phoneWithoutSpacesAndSpecialCharacters;
        }
      } else {
        uniqueID = '';
      }
    }
    ReactMoE.setUserUniqueID(uniqueID);
    log('MoEngage: Set User Unique ID', uniqueID);
    ReactMoE.setUserEmailID(email);
    (firstName || name) &&
      ReactMoE.setUserFirstName(firstName ? firstName : name);
    lastName && ReactMoE.setUserLastName(lastName);
    phone &&
      ReactMoE.setUserContactNumber(phone ? phone.replace(/\s+/g, '') : '');
  } catch (error) {
    log('MoEngage: Set Profile Error', error);
  }
}
