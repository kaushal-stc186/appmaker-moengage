import {
  appmaker,
  analytics,
  appStorageApi,
  appPluginStoreApi,
} from '@appmaker-xyz/core';
import ReactMoE, { MoEAppStatus } from 'react-native-moengage';
import { recordEvent } from './lib';
import { Platform } from 'react-native';
import { moengageSetProfile } from './helper';
import { shopifyIdHelper } from '@appmaker-xyz/shopify';
import { onEvent } from '@appmaker-xyz/core';
import { parseInt } from 'lodash';

export const logFilterClick = async (query) => {
  const { filterItem } = query;
  try {
    const filterItemString = JSON.stringify(filterItem);
    recordEvent('FilterClick', {
      filter_click_item: filterItemString,
    });
  } catch (error) {}
};
function sendAddToCart(params, context) {
  recordEvent(
    'Add To Cart',
    {
      'Product URL': context?.product?.onlineStoreUrl,
      'Product Title': params?.item_name,
      currency: params?.currency,
      'Product ID': shopifyIdHelper(params?.item_id, true),
      'Product Price': parseInt(params?.price, 10),
      Quantity: 1,
      Source: Platform.OS === 'ios' ? 'Shopify IOS App' : 'Shopify Android App',
      'Variation Title': params?.item_variant,
      'Variation ID': shopifyIdHelper(params?.variant_id, true),
      'Image URL': context?.variant?.node?.image?.url,
      'Vendor name': params?.item_brand,
    },
    context,
  );
}

function sendRemoveCart(params, context) {
  recordEvent(
    'Removed from Cart',
    {
      'Product URL': context?.product?.onlineStoreUrl,
      'Product Title': context?.product?.title
        ? context?.product?.title
        : context?.variant?.node?.title,
      currency: context?.variant?.price
        ? context?.variant?.price?.currencyCode
        : context?.variant?.node?.price?.currencyCode,
      'Product ID': shopifyIdHelper(params.item_id, true),
      'Product Price': context?.variant?.price
        ? parseInt(context?.variant?.price?.amount)
        : parseInt(context?.variant?.node?.price?.amount),
      Quantity: 1,
      Source: Platform.OS === 'ios' ? 'Shopify IOS App' : 'Shopify Android App',
      'Variation Title': params?.item_variant,
      'Variation ID': shopifyIdHelper(params?.variant_id, true),
      'Image URL': context?.variant?.image
        ? context?.variant?.image?.url
        : context?.variant?.node?.image?.url,
      'Vendor name': params?.item_brand,
    },
    context,
  );
}
function sendUpdateCart(params, context) {
  recordEvent(
    'Update Cart',
    {
      // URL: onlineStoreUrl,
      'Product URL': context?.product?.onlineStoreUrl,
      'Product Title': context?.product?.title
        ? context?.product?.title
        : context?.variant?.node?.title,
      currency: context?.variant?.price
        ? context?.variant?.price?.currencyCode
        : context?.variant?.node?.price?.currencyCode,
      'Product ID': params?.item_id,
      'Product Price': context?.variant?.price
        ? parseInt(context?.variant?.price?.amount)
        : parseInt(context?.variant?.node?.price?.amount),
      Quantity: 1,
      Source: Platform.OS == 'ios' ? 'Shopify IOS App' : 'Shopify Android App',
      'Variation Title': params?.item_variant,
      'Variation ID': params?.variant_id,
      'Image URL': context?.variant?.image
        ? context?.variant?.image?.url
        : context?.variant?.node?.image?.url,
      'Vendor name': params?.item_brand,
    },
    context,
  );
}

function sendAddToWishlist(params, context) {
  recordEvent(
    'Added to Wishlist',
    {
      'Product URL': context?.product?.onlineStoreUrl,
      'Product Title': params?.item_name,
      currency: params?.currency,
      'Product ID': shopifyIdHelper(params?.item_id, true),
      'Product Price': parseInt(params.price, 10),
      Quantity: 1,
      Source: Platform.OS === 'ios' ? 'Shopify IOS App' : 'Shopify Android App',
      'Variation Title': params?.item_variant,
      'Variation ID': shopifyIdHelper(params?.variant_id, true),
      'Vendor name': params?.item_brand,
    },
    context,
  );
}

function sendRemoveFromWishlist(params, context) {
  recordEvent(
    'Removed from Wishlist',
    {
      'Product URL': context?.product?.onlineStoreUrl,
      'Product Title': params?.item_name,
      currency: params?.currency,
      'Product ID': shopifyIdHelper(params?.item_id, true),
      'Product Price': parseInt(params?.price, 10),
      Quantity: 1,
      Source: Platform.OS === 'ios' ? 'Shopify IOS App' : 'Shopify Android App',
      'Variation Title': params?.item_variant,
      'Variation ID': shopifyIdHelper(params?.variant_id, true),
      'Vendor name': params?.item_brand,
    },
    context,
  );
}

function sendCheckoutStarted(params, context) {
  const { cart } = context;
  try {
    let price = parseFloat(cart?.totalPrice?.amount);
    let prices = [];
    let ids = [];
    let titles = [];
    let variantIds = [];
    let vendorNames = [];
    cart?.lineItems?.edges.map(({ node }) => {
      titles.push(node?.title);
      ids.push(shopifyIdHelper(node?.variant?.product?.id, true));
      variantIds.push(shopifyIdHelper(node?.variant?.id, true));
      prices.push(parseFloat(node?.variant?.price?.amount));
      vendorNames.push(node?.variant?.product?.vendor);
    });
    const filteredParam = {
      currency: cart?.totalPrice?.currencyCode,
      'Total Price': price,
      'Product quantity': parseInt(cart?.lineItems?.edges.length), // integer
      'Product Price': prices,
      'Product ID': ids,
      'Product Title': titles,
      'Variation ID': variantIds,
      'Vendor name': vendorNames,
      Source: Platform.OS == 'ios' ? 'Shopify IOS App' : 'Shopify Android App',
    };
    recordEvent('Checkout Started', filteredParam, context);
  } catch (error) {
    console.log(error);
  }
}
function sendProductSearch(params, context) {
  recordEvent(
    'Product Searched',
    {
      'Search String': params?.query,
      Source: Platform.OS == 'ios' ? 'Shopify IOS App' : 'Shopify Android App',
    },
    params,
  );
}

function sendProductViewed(params, context) {
  recordEvent(
    'Product Viewed',
    {
      'Product Title': params?.item_name,
      'Product ID': params?.item_id,
      Available: context?.product?.variants?.edges[0]?.node?.availableForSale,
      Price: parseInt(params?.price, 10),
      Currency: params?.currency,
      productType: context?.product?.productType,
      'Total Variants': context?.product?.variants.edges.length,
      totalInventory: context?.product?.totalInventory,
      URL: context?.product?.onlineStoreUrl,
      Source: Platform.OS == 'ios' ? 'Shopify IOS App' : 'Shopify Android App',
    },
    context,
  );
}
function sendOrderPlaced(params, context) {
  const { cart } = context;
  const { order_number, order_id, order_name } = params;
  const user = appStorageApi().getState().user;
  try {
    if (cart?.order?.shippingAddress?.phone) {
      const phone = cart?.order?.shippingAddress?.phone;
      const phoneWithoutSpacesAndSpecialCharacters = phone.replace(
        /[^a-zA-Z0-9]/g,
        '',
      );
      ReactMoE.setUserAttribute(
        'Shipping Mobile Number',
        phoneWithoutSpacesAndSpecialCharacters,
      );
    }
    const pluginSettings =
      appPluginStoreApi().getState().plugins?.moengage?.settings;
    if (
      (!user?.id && pluginSettings?.moengage_merge_guest_user_email == true) ||
      (!user?.phone &&
        pluginSettings?.force_get_phone_number_from_address == true)
    ) {
      moengageSetProfile(
        {
          email: user?.email,
          phone: cart?.order?.shippingAddress?.phone,
          id: null,
          name: cart?.order?.shippingAddress?.name,
        },
        {
          customer: {
            firstName: cart?.order?.shippingAddress?.firstName,
            lastName: cart?.order?.shippingAddress?.lastName,
          },
        },
      );
    }
  } catch (error) {
    console.log('moengage email error is', error);
  }
  try {
    let price = parseFloat(cart.totalPrice?.amount);
    let prices = [];
    let ids = [];
    let titles = [];
    let variantIds = [];
    let vendorNames = [];
    let quantities = [];
    let images = [];
    cart?.lineItems?.edges.map(({ node }) => {
      titles.push(node?.title);
      ids.push(shopifyIdHelper(node?.variant?.product?.id, true));
      variantIds.push(shopifyIdHelper(node?.variant?.id, true));
      prices.push(parseFloat(node?.variant?.price?.amount));
      vendorNames.push(node?.variant?.product?.vendor);
      quantities.push(node?.quantity);
      images.push(node?.variant?.image?.url);
      const data = {
        // 'Order Id': order_number || cart?.order?.orderNumber,
        'Order Id': String(order_number || cart?.order?.orderNumber || ''),
        'Order Number':
        shopifyIdHelper(order_id, true) ||
          (cart?.order?.id ? shopifyIdHelper(cart?.order?.id, true) : ''),
        'Order Name': order_name || cart?.order?.name,
        'Image URL': node?.variant?.image?.url,
        'Product Price': parseFloat(node?.variant?.price?.amount),
        'Product ID': ids.join(',').toString(),
        Quantity: parseInt(node?.quantity),
        'Product Title': node?.title,
        'Variation ID': shopifyIdHelper(node?.variant?.id, true),
        'Variation Title': node?.variant?.title,
        'Vendor name': node?.variant?.product?.vendor,
        currency: node?.variant?.price?.currencyCode,
        Source:
          Platform.OS == 'ios' ? 'Shopify IOS App' : 'Shopify Android App',
      };
      recordEvent('Item Purchased', data, node);
    });
    const filteredParam = {
      // 'Order Id': order_number || cart?.order?.orderNumber,
      'Order Id': String(order_number || cart?.order?.orderNumber || ''),
      'Order Number':
        shopifyIdHelper(order_id, true)  ||
        (cart?.order?.id ? shopifyIdHelper(cart?.order?.id, true) : ''),
      'Order Name': order_name || cart?.order?.name,
      currency: cart?.totalPrice?.currencyCode,
      'Total Price': price,
      TotalItems: quantities.reduce((qtySum, a) => qtySum + a, 0),
      'Product Price': prices,
      'Product ID': ids,
      Quantity: parseInt(quantities),
      'Product Title': titles,
      'Variation ID': variantIds,
      'Image URL': images,
      Source: Platform.OS == 'ios' ? 'Shopify IOS App' : 'Shopify Android App',
    };
    recordEvent('Order placed', filteredParam, context);
  } catch (error) {
    console.log(error);
    recordEvent('Order placed', {
      error: JSON.stringify(error, Object.getOwnPropertyNames(error)),
    });
  }
}

function sendCollectionView(params, context) {
  recordEvent(
    'Category Viewed',
    {
      'Category Name': params?.title ? params?.title : '',
    },
    context,
  );
}

function sendUserLogin(params, context) {
  recordEvent(
    'Customer Logged In',
    {
      Email: params?.email,
      FirstName: context?.customer?.firstName //need to check firstName missing
        ? context?.customer?.firstName
        : context?.customer?.displayName,
      LastName: context?.customer?.lastName,
      Phone: params?.phone,
      Status: 'success',
      Source: Platform.OS == 'ios' ? 'Shopify IOS App' : 'Shopify Android App',
      'Customer ID': params?.id,
    },
    params,
    context,
  );
}

function sendUserRegister(params, context) {
  const id = params?.id;
  const Email = params?.email;
  const FirstName = context?.customer?.firstName
    ? context?.customer?.firstName
    : context?.customer?.displayName;
  const lastName = context?.customer?.lastName;
  const phone = params?.phone;
  recordEvent(
    'Customer Registered',
    {
      Email: Email,
      FirstName: FirstName,
      LastName: lastName,
      Phone: phone,
      Status: 'success',
      Source: Platform.OS == 'ios' ? 'Shopify IOS App' : 'Shopify Android App',
      'Customer ID': id,
    },
    params,
    context,
  );
}

function sendUserLogout(params, context) {
  recordEvent('Customer Logged Out', {}, context);
  ReactMoE.logout();
}

function sendAppmakerBlockClick(params) {
  const { blockLabel, blockId } = params;
  recordEvent(
    'Appmaker Block Clicked',
    {
      banner_name: blockLabel || '',
      blockId,
    },
    params,
  );
}

function sendViewCart(params, context) {
  try {
    let price = parseFloat(context.totalPrice?.amount);
    let prices = [];
    let ids = [];
    let titles = [];
    let variantIds = [];
    let vendorNames = [];
    context?.lineItems?.edges.map(({ node }) => {
      titles.push(node?.title);
      ids.push(shopifyIdHelper(node?.variant?.product?.id, true));
      variantIds.push(shopifyIdHelper(node?.variant?.id, true));
      prices.push(parseFloat(node?.variant?.price?.amount));
      vendorNames.push(node?.variant?.product?.vendor);
    });
    const filteredParam = {
      currency: context?.totalPrice?.currencyCode,
      'Total Price': price,
      'Product quantity': context?.lineItems?.edges.length,
      'Product Price': prices,
      'Product ID': ids,
      'Product Title': titles,
      'Variation ID': variantIds,
      'Vendor name': vendorNames,
      Source: Platform.OS == 'ios' ? 'Shopify IOS App' : 'Shopify Android App',
    };
    recordEvent('View Cart', filteredParam, context);
  } catch (error) {
    console.log(error);
  }
}

function sendActionHandler(params) {
  if (params.action === 'TOGGLE_DRAWER') {
    const { category, action, bannerName } = params;
    recordEvent('NavbarClicks', {
      category_name: bannerName || '',
    });
  }
  if (params.action === 'OPEN_MY_ACCOUNT') {
    recordEvent('User Icon Click', {});
  }
}

function sendSortApply(params) {
  const { label, value } = params;
  recordEvent('SortClick', {
    label: label,
    value: value,
  });
}

function sendShareProduct(params) {
  const productName = params?.product_name;
  recordEvent('ShareProduct', {
    product_name: productName,
  });
}

function sendApplyCoupon(params) {
  const { couponCode } = params;
  recordEvent('Coupon Applied', {
    couponCode: couponCode,
  });
}

export function activateAnalyticsEvents(settings) {
  analytics.onTrackSystemEvents(async (event, params, context) => {
    switch (event) {
      case 'initial_action':
        const user = appStorageApi()?.getState()?.user;
        if (user && user?.id) {
          moengageSetProfile(
            {
              email: user?.email,
              phone: user?.phone,
              id: shopifyIdHelper(user?.id),
              name: user?.displayName,
            },
            { customer: user },
          );
        }
        break;
      default:
        break;
    }
  }, 'clevertap');
  analytics.onIdentify((userId, params, context) => {
    moengageSetProfile(params, context);
  });
  analytics.onPageTrack((id, name, context) => {
    const user = appStorageApi()?.getState()?.user;
    const settings = appPluginStoreApi().getState().plugins?.moengage?.settings;
    if (user && user?.id && settings?.set_unique_id_on_all_pages) {
      moengageSetProfile(
        {
          email: user?.email,
          phone: user?.phone,
          id: shopifyIdHelper(user?.id),
          name: user?.displayName,
        },
        { customer: user },
      );
    }
  }, 'moengage');
  analytics.onTrack(async (event, params, context) => {
    switch (event) {
      case 'product_added_to_cart':
        sendAddToCart(params, context);
        break;
      case 'remove_from_cart':
        sendRemoveCart(params, context);
        break;
      case 'update_cart':
        sendUpdateCart(params, context);
        break;
      case 'product_added_to_wishlist':
        sendAddToWishlist(params, context);
        break;
      case 'product_removed_from_wishlist':
        sendRemoveFromWishlist(params, context);
        break;
      case 'checkout_started':
        sendCheckoutStarted(params, context);
        break;
      case 'product_search':
        sendProductSearch(params, context);
        break;
      case 'collection_view':
        sendCollectionView(params, context);
        break;
      case 'checkout_completed':
        sendOrderPlaced(params, context);
        break;
      case 'product_viewed':
        sendProductViewed(params, context);
        break;
      case ' appmaker_block_click':
        sendAppmakerBlockClick(params, context);
        break;
      case 'view_cart':
        sendViewCart(params, context);
        break;
      case 'user_register':
        sendUserRegister(params, context);
        break;
      case 'user_login':
        sendUserLogin(params, context);
        break;
      case 'user_logout':
        sendUserLogout(params, context);
        break;
      case 'actionHandler':
        sendActionHandler(params);
        break;
      case 'filterApply':
        logFilterClick(params);
        break;
      case 'sortApply':
        sendSortApply(params);
        break;
      case 'shareProduct':
        sendShareProduct(params);
        break;
      case 'cart.applycoupon':
        sendApplyCoupon(params);
        break;
      case 'app_installed':
        ReactMoE.setAppStatus(MoEAppStatus.Install);
        break;
      case 'app_updated':
        ReactMoE.setAppStatus(MoEAppStatus.Update);
        break;
      default:
        try {
          const appmakerBlacklistedEvents = await appmaker.applyFilters(
            'moengage-blacklisted-custom-events',
            [],
          );
          const pluginBlacklistedCustomEvents =
            settings?.blackListedCustomEvents?.map((e) => e.eventName) || [];
          const appmakerWhitelistedEvents = await appmaker.applyFilters(
            'moengage-whitelisted-custom-events',
            [],
          );
          const pluginWhitelistedCustomEvents =
            settings?.whiteListedCustomEvents?.map((e) => e.eventName) || [];
          const blacklistedEvents = [
            ...appmakerBlacklistedEvents,
            ...pluginBlacklistedCustomEvents,
          ];
          const whitelistedEvents = [
            ...appmakerWhitelistedEvents,
            ...pluginWhitelistedCustomEvents,
          ];
          if (blacklistedEvents.includes(event)) {
            return;
          }
          if (whitelistedEvents.includes(event)) {
            recordEvent(event, params, context);
            return;
          }
          recordEvent(event, params, context);
        } catch (error) {
          console.log(`error in sending custom event ${event} `, error);
        }
        break;
    }
  }, 'moengage');
}
