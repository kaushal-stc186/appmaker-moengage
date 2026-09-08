const Playground = {
  id: 'ConfirmOTP',
  status: 'active',
  title: 'ConfirmOTP',
  attributes: {
    renderType: 'normal',
    contentContainerStyle: { flex: 1 },
    rootContainerStyle: { flex: 1 },
  },
  blocks: [
    {
      clientId: 'my-account-menu',
      name: 'appmaker/actionbar',
      attributes: {
        title: 'Mo test',
        appmakerAction: {
          action: 'ACTION_TEST_MOENGAGE',
        },
      },
    },
  ],
};
export default Playground;
