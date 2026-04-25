const app = getApp();

Page({
  data: {
    isExploded: true,
    hasTapped: false,
    layers: [
      { id: 1, name: "图层一", url: "/images/layers/nianhua-demo/layer_4.png", zDist: -120, order: 1 },
      { id: 2, name: "图层二", url: "/images/layers/nianhua-demo/layer_3.png", zDist: -60, order: 2 },
      { id: 3, name: "图层三", url: "/images/layers/nianhua-demo/layer_2.png", zDist: 0, order: 3 },
      { id: 4, name: "图层四", url: "/images/layers/nianhua-demo/layer_1.png", zDist: 60, order: 4 },
      { id: 5, name: "图层五", url: "/images/layers/nianhua-demo/layer_0.png", zDist: 120, order: 5 }
    ],
    rotateX: 15,
    rotateY: -25,
    scale: 1,
    _touchStartX: 0,
    _touchStartY: 0,
    _lastRotateX: 15,
    _lastRotateY: -25,
    _initialPinchDistance: 0,
    _lastScale: 1,
    _isTouchMoved: false
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

  onStageTouchStart(e) {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      this._initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
      this._lastScale = this.data.scale;
      this._isTouchMoved = true;
    } else if (e.touches.length === 1) {
      this._touchStartX = e.touches[0].clientX;
      this._touchStartY = e.touches[0].clientY;
      this._lastRotateX = this.data.rotateX;
      this._lastRotateY = this.data.rotateY;
      this._isTouchMoved = false;
    }
  },

  onStageTouchMove(e) {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDistance = Math.sqrt(dx * dx + dy * dy);
      this._isTouchMoved = true;

      if (this._initialPinchDistance > 0) {
        let newScale = this._lastScale * (currentDistance / this._initialPinchDistance);
        newScale = Math.max(0.5, Math.min(3, newScale));
        this.setData({ scale: newScale });
      }
    } else if (e.touches.length === 1) {
      const deltaX = e.touches[0].clientX - this._touchStartX;
      const deltaY = e.touches[0].clientY - this._touchStartY;

      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        this._isTouchMoved = true;
      }

      this.setData({
        rotateY: this._lastRotateY + deltaX * 0.3,
        rotateX: Math.max(-30, Math.min(60, this._lastRotateX - deltaY * 0.3))
      });
    }
  },

  onStageTouchEnd() {
    this._initialPinchDistance = 0;

    if (!this._isTouchMoved) {
      this.toggleExplode();
    }
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
      url: '/pages/gallery/gallery'
    });
  },

  goToExplodedView() {
    wx.navigateTo({
      url: '/pages/exploded-view/exploded-view'
    });
  }
})
