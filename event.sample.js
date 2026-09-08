import { onEvent } from '@appmaker-xyz/core';
import { appmaker } from '@appmaker-xyz/core';

function recordEvent(eventName, params) {}
export const logFilterClick = async (query) => {
  const { filterItem } = query;
  // let test = filterItem.map((v) => v);
  try {
    const filterItemString = JSON.stringify(filterItem);
    recordEvent('FilterClick', {
      filter_click_item: filterItemString,
      // items: filterItem.map((v) => v),
    });
  } catch (error) {}
};

export const logUser = async ({ email, name, id, eventName }) => {
  const canTrackUser = await appmaker.applyFilters(
    'apple-tracking-transparency',
    true,
  );
  if (canTrackUser) {
    recordEvent(eventName, {
      Email: email,
      FirstName: name,
      Status: 'success',
      Source: 'Shopify Mobile App',
      'Customer ID': id,
    });
    // Set User
  } else {
    recordEvent(eventName, {
      Status: 'success',
      Source: 'Shopify Mobile App',
    });
  }
};

// import {  } from "module";
export function activateEvents() {
  onEvent('user.login', ({ user }) => {
    const { id, email, displayName: name } = user;
    const eventName = 'Customer Logged In';
    logUser({ email, name, id, eventName });
  });
  onEvent('user.register', ({ user }) => {
    const { id, email, displayName: name } = user;
    const eventName = 'Customer Registered';
    logUser({ email, name, id, eventName });
  });
  onEvent('user.logout', (params) => {
    recordEvent('Customer Logged Out', {});
  });
  onEvent('cart.add', (params) => {
    const { id, title, priceRange, onlineStoreUrl, variant, images, vendor } =
      params;
    const image = images.edges[0].node.url;
    const { amount, currencyCode } = priceRange?.minVariantPrice;
    const price = parseFloat(amount);

    recordEvent('Add To Cart and Update Cart', {
      URL: onlineStoreUrl,
      'Product Title': title,
      currency: currencyCode,
      'Product ID': id,
      'Product Price': price,
      Quantity: 1,
      Source: 'Shopify Mobile App',
      'Variation Title': variant?.title,
      'Variation ID': variant?.id,
      'Image URL': image,
      'Vendor name': vendor,
    });
  });
  onEvent('cart.applycoupon', (params) => {
    const { couponCode } = params;
    // logApplyCouponCode(params);
    recordEvent('Coupon Applied', {
      couponCode: couponCode,
    });
  });
  onEvent('wishlist.add', (params) => {
    const { id, title, priceRange, onlineStoreUrl, images, vendor } = params;
    const { amount, currencyCode } = priceRange?.minVariantPrice;
    const image = images.edges[0].node.url;
    const price = parseFloat(amount);
    recordEvent('Added to Wishlist', {
      URL: onlineStoreUrl,
      'Product Title': title,
      currency: currencyCode,
      'Product ID': id,
      'Product Price': price,
      Quantity: 1,
      Source: 'Shopify Mobile App',
      'Image URL': image,
      'Vendor name': vendor,
    });
  });
  onEvent('wishlist.remove', (params) => {
    const { productName } = params;
    recordEvent('Added to Wishlist', {
      product_name: productName,
    });
  });
  onEvent('product.search', (params) => {
    recordEvent('Product Searched', {
      'Search String': params,
      Source: 'Shopify Mobile App',
      // 'Number of Search Results': 'email',
      // 'Number of Out of Stock': 'email',
    });
  });
  onEvent('product.list', (params) => {
    recordEvent('Category Viewed', {
      'Category Name': params?.title ? params?.title : '', // WIP
    });
  });
  onEvent('view_product', (params) => {
    const {
      title,
      id,
      priceRange,
      productType,
      totalInventory,
      variants,
      onlineStoreUrl,
    } = params.product;
    const { amount, currencyCode } = priceRange.maxVariantPrice;
    recordEvent('Product Viewed', {
      'Product Title': title,
      'Product ID': id,
      Available: variants.edges[0].availableForSale,
      Price: amount,
      Currency: currencyCode,
      productType: productType,
      'Total Variants': variants.edges.length,
      totalInventory: totalInventory,
      URL: onlineStoreUrl,
      Source: 'Shopify Mobile App',
    });
  });
  onEvent('bannerClick', (params) => {
    const { bannerName, item_id } = params;
    recordEvent('Banner Clicked', {
      banner_name: bannerName || '',
      item_id,
    });
  });
  onEvent('actionHandler', (params) => {
    // logBannerClick(params);
    if (params.action === 'TOGGLE_DRAWER') {
      const { category, action, bannerName } = params;
      recordEvent('NavbarClicks', {
        category_name: bannerName || '',
      });
    }
    if (params.action === 'OPEN_MY_ACCOUNT') {
      recordEvent('User Icon Click', {});
    }
  });
  onEvent('sortApply', (params) => {
    const { label, value } = params;
    recordEvent('SortClick', {
      label: label,
      value: value,
    });
  });
  onEvent('filterApply', (params) => {
    logFilterClick(params);
  });
  onEvent('shareProduct', (params) => {
    const { productName } = params;
    recordEvent('ShareProduct', {
      product_name: productName,
    });
  });
  onEvent('removeFromCart', (params) => {
    const { title, price, currency, variant, id } = params;
    let amount = '';
    if (price) {
      amount = parseInt(price);
    }
    //variant.image.url
    recordEvent('Removed from Cart', {
      currency,
      'Image URL': variant.image.url,
      'Product ID': id,
      'Product Title': title,
      'Product Price': amount,
      'Variation ID': variant.id,
      'Variation Title': variant.title,
      'Vendor name': variant.product.vendor,
      Source: 'Shopify Mobile App',
    });
  });
  onEvent('beginCheckout', (params) => {
    const { cart } = params;
    // TODO: make this into a helper function
    try {
      let price = parseFloat(cart.totalPrice?.amount);
      let prices = [];
      let ids = [];
      let titles = [];
      let variantIds = [];
      let vendorNames = [];
      cart.lineItems.edges.map(({ node }) => {
        titles.push(node.title);
        ids.push(node.id);
        variantIds.push(node.variant.id);
        prices.push(node.variant.price.amount);
        vendorNames.push(node.variant.product.vendor);
      });
      const filteredParam = {
        currency: cart.totalPrice?.currencyCode,
        'Total Price': price,
        'Product quantity': cart.lineItems.edges.length,
        'Product Price': prices,
        'Product ID': ids,
        'Product Title': titles,
        'Variation ID': variantIds,
        'Vendor name': vendorNames,
        Source: 'Shopify Mobile App',
      };
      recordEvent('Checkout Started', filteredParam);
    } catch (error) {
      console.log(error);
    }
  });
  onEvent('viewCart', (params) => {
    const { cart, pageId } = params;
    try {
      let price = parseFloat(cart.totalPrice?.amount);
      let prices = [];
      let ids = [];
      let titles = [];
      let variantIds = [];
      let vendorNames = [];
      cart.lineItems.edges.map(({ node }) => {
        titles.push(node.title);
        ids.push(node.id);
        variantIds.push(node.variant.id);
        prices.push(node.variant.price.amount);
        vendorNames.push(node.variant.product.vendor);
      });
      const filteredParam = {
        currency: cart.totalPrice?.currencyCode,
        'Total Price': price,
        'Product quantity': cart.lineItems.edges.length,
        'Product Price': prices,
        'Product ID': ids,
        'Product Title': titles,
        'Variation ID': variantIds,
        'Vendor name': vendorNames,
        Source: 'Shopify Mobile App',
      };
      recordEvent('View Cart', filteredParam);
    } catch (error) {
      console.log(error);
    }
  });
  onEvent('orderComplete', (params) => {
    const { cart } = params;
    // TODO: make this into a helper function
    try {
      let price = parseFloat(cart.totalPrice?.amount);
      let prices = [];
      let ids = [];
      let titles = [];
      let variantIds = [];
      let vendorNames = [];
      let quantities = [];
      let images = [];
      cart.lineItems.edges.map(({ node }) => {
        titles.push(node.title);
        ids.push(node.id);
        variantIds.push(node.variant.id);
        prices.push(node.variant.price.amount);
        vendorNames.push(node.variant.product.vendor);
        quantities.push(node.quantity);
        images.push(node.variant.image.url);
        const data = {
          'Order Id': cart?.order?.id ? cart?.order?.id : '',
          'Image URL': node.variant.image.url,
          'Product Price': node.variant.price.amount,
          'Product ID': node.id,
          Quantity: node.quantity,
          'Product Title': node.title,
          'Variation ID': node.variant.id,
          'Variation Title': node.variant.title,
          'Vendor name': node.variant.product.vendor,
          currency: node.variant.price.currencyCode,
          Source: 'Shopify Mobile App',
        };
        recordEvent('Item Purchased', data);
      });
      const filteredParam = {
        'Order Id': cart?.order?.id ? cart?.order?.id : '',
        currency: cart.totalPrice?.currencyCode,
        'Total Price': price,
        TotalItems: cart.lineItems.edges.length,
        'Product Price': prices,
        'Product ID': ids,
        Quantity: quantities,
        'Product Title': titles,
        'Variation ID': variantIds,
        'Vendor name': vendorNames,
        'Image URL': images,
        Source: 'Shopify Mobile App',
      };
      recordEvent('Order placed', filteredParam);
    } catch (error) {}
  });

  onEvent('on_fcm_token', (fcmToken) => {
    // setPushToken(fcmToken, FCM);
  });
}
