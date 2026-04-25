const app = getApp();

Page({
  data: {
    isExploded: true,
    hasTapped: false,
    layers: [
      { id: 1, name: "底色层", url: "https://via.placeholder.com/480x640/F5E6D3/F5E6D3?text=Base", zDist: -120, order: 1 },
      { id: 2, name: "绿色层", url: "https://via.placeholder.com/480x640/FFFFFF/4A7A59?text=Green", zDist: -60, order: 2 },
      { id: 3, name: "黄色层", url: "https://via.placeholder.com/480x640/FFFFFF/C8A063?text=Yellow", zDist: 0, order: 3 },
      { id: 4, name: "红色层", url: "https://via.placeholder.com/480x640/FFFFFF/D9281C?text=Red", zDist: 60, order: 4 },
      { id: 5, name: "线稿层", url: "https://via.placeholder.com/480x640/FFFFFF/000000?text=Line", zDist: 120, order: 5 }
    ]
  },

  onLoad() {
    // 进场后自动合上一次，增强效果
    setTimeout(() => {
      this.setData({ isExploded: false });
    }, 1500);
  },

  toggleExplode() {
    this.setData({ 
      isExploded: !this.data.isExploded,
      hasTapped: true
    });
  },

  goToCreate() {
    wx.switchTab({
      url: '/pages/create/create'
    }).catch(() => {
      wx.navigateTo({
        url: '/pages/create/create'
      });
    });
  },

  showToast(e) {
    wx.showToast({
      title: e.currentTarget.dataset.msg,
      icon: 'none'
    });
  },

  goTo3D() {
    wx.navigateTo({
      url: '/pages/model3d/model3d'
    });
  }
})
