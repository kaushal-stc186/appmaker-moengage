import ReactMoE, { MoEGeoLocation, MoEProperties } from 'react-native-moengage';

export function ACTION_TEST(
  { params },
  {
    appState,
    runDataSource,
    appStorageState,
    handleAction,
    coreDispatch,
    pageState,
  },
) {
  // ReactMoE.setUserUniqueID('saleeh@appmaker.xyz');
  // let properties = new MoEProperties();
  // properties.addAttribute('quantity', 1);

  // ReactMoE.trackEvent('view_item', properties);
  let properties = new MoEProperties();
  properties.addAttribute('quantity', 1);
  properties.addAttribute('product', 'iPhone');
  properties.addAttribute('currency', 'dollar');
  properties.addAttribute('price', 1699);
  properties.addAttribute('new_item', true);
  properties.addDateAttribute('purchase_date', '2020-06-10T12:42:10Z');
  properties.addLocationAttribute(
    'store_location',
    new MoEGeoLocation(90.00001, 180.00001),
  );
  ReactMoE.trackEvent('Purchase', properties);
}
