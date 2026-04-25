App({
  onLaunch() {
    console.log('佛山年画AI创作小程序启动');
  },
  globalData: {
    serverBase: 'https://model-server-rosy.vercel.app',
    userInfo: null,
    currentLayers: null,
    _pendingModelUrl: '',
    _pendingModelName: ''
  }
})
