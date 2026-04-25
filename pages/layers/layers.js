Page({
  data: {
    layers: [],
    canvasWidth: 600,
    canvasHeight: 800
  },

  onLoad() {
    // 从本地存储或者全局变量获取图层数据（适配 create 页面存入的数据）
    let layers = wx.getStorageSync('currentLayers');
    
    // 模拟数据用于开发测试（如果没有读到数据）
    if (!layers || layers.length === 0) {
      layers = [
        { id: 5, name: "底色层", color: "#F5E6D3", order: 1, url: "https://via.placeholder.com/600x800/F5E6D3/F5E6D3?text=Base", active: true },
        { id: 4, name: "绿色层", color: "#4A7A59", order: 2, url: "https://via.placeholder.com/600x800/FFFFFF/4A7A59?text=Green", active: true },
        { id: 3, name: "黄色层", color: "#C8A063", order: 3, url: "https://via.placeholder.com/600x800/FFFFFF/C8A063?text=Yellow", active: true },
        { id: 2, name: "红色层", color: "#D9281C", order: 4, url: "https://via.placeholder.com/600x800/FFFFFF/D9281C?text=Red", active: true },
        { id: 1, name: "线稿层", color: "#000000", order: 5, url: "https://via.placeholder.com/600x800/FFFFFF/000000?text=Line", active: true }
      ];
    }

    this.setData({
      layers: layers
    });
  },

  // 切换某图层的显示/隐藏
  toggleLayer(e) {
    const index = e.currentTarget.dataset.index;
    const key = `layers[${index}].active`;
    this.setData({
      [key]: !this.data.layers[index].active
    });
  },

  // 保存作品
  saveToAlbum() {
    wx.showLoading({ title: '正在合成图层...' });
    
    // 为了实际保存，需要用 Canvas 依次绘制 active 的层
    // 由于在线占位图片存在跨域与无法直接绘制的问题，这里给出真实逻辑的框架，并用SetTimeout模拟保存
    
    /* 真实的合并代码：
    const ctx = wx.createCanvasContext('mergeCanvas', this);
    const activeLayers = this.data.layers.filter(l => l.active).sort((a, b) => a.order - b.order);
    
    let drawPromises = activeLayers.map(l => {
      return new Promise((resolve) => {
        wx.getImageInfo({
          src: l.url,
          success: (res) => resolve(res.path),
          fail: () => resolve(null)
        });
      });
    });

    Promise.all(drawPromises).then(paths => {
      paths.forEach(path => {
        if (path) ctx.drawImage(path, 0, 0, this.data.canvasWidth, this.data.canvasHeight);
      });
      ctx.draw(false, () => {
        wx.canvasToTempFilePath({
          canvasId: 'mergeCanvas',
          success: (res) => {
            wx.saveImageToPhotosAlbum({
              filePath: res.tempFilePath,
              success: () => wx.showToast({ title: '保存成功', icon: 'success' })
            });
          }
        }, this);
      });
    });
    */

    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({ title: '保存成功(演示)', icon: 'success' });
    }, 1500);
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: '快来看我用AI创作的佛山年画',
      path: '/pages/index/index',
      imageUrl: this.data.layers.length > 0 ? this.data.layers[0].url : ''
    }
  },

  // 重新创作，返回到 create 页面
  retryCreate() {
    // 判断是否在tabBar，如果是使用 switchTab
    wx.switchTab({
      url: '/pages/create/create'
    }).catch(() => {
      wx.navigateBack();
    });
  }
});
