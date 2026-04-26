App({
  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloudbase-d2ga3dspk593e200b'
      });
    }
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
