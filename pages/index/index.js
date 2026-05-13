const { layerFileID } = require('../../constants/cloudAssets');
const { resolveCloudURL } = require('../../utils/resolveCloudURL');

const HOME_LAYER_CACHE_KEY = 'homeLayersLogoDemoCloudV1';
const HOME_LAYER_URLS = [
  layerFileID('logo-demo', 8),
  layerFileID('logo-demo', 7),
  layerFileID('logo-demo', 6),
  layerFileID('logo-demo', 5),
  layerFileID('logo-demo', 4),
  layerFileID('logo-demo', 3),
  layerFileID('logo-demo', 2),
  layerFileID('logo-demo', 1),
  layerFileID('logo-demo', 0)
];

function buildHomeLayers(paths) {
  const total = paths.length;
  const totalDepth = total <= 5 ? 240 : Math.min(420, (total - 1) * 45);
  const spacing = total <= 1 ? 0 : totalDepth / (total - 1);

  return paths.map((url, index) => ({
    id: index + 1,
    name: '图层' + (index + 1),
    url,
    zDist: Math.round(-totalDepth / 2 + index * spacing),
    order: index + 1
  }));
}

Page({
  data: {
    isExploded: true,
    hasTapped: false,
    layersLoading: true,
    layers: buildHomeLayers(HOME_LAYER_URLS),
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

  async onLoad() {
    await this._prepareHomeLayers();
    this._autoCollapseLayers();
  },

  _autoCollapseLayers() {
    setTimeout(() => {
      this.setData({ isExploded: false });
    }, 1500);
  },

  async _prepareHomeLayers() {
    const cachedLayers = wx.getStorageSync(HOME_LAYER_CACHE_KEY);
    if (Array.isArray(cachedLayers) && cachedLayers.length === HOME_LAYER_URLS.length && this._areHomeLayersValid(cachedLayers)) {
      this.setData({
        layers: buildHomeLayers(cachedLayers.map((layer) => layer.localPath)),
        layersLoading: false,
        isExploded: true
      });
      return;
    }

    this.setData({ layersLoading: true });
    const downloadedLayers = [];

    for (let i = 0; i < HOME_LAYER_URLS.length; i++) {
      try {
        const localPath = await this._downloadHomeLayer(HOME_LAYER_URLS[i], i);
        downloadedLayers.push({ fileID: HOME_LAYER_URLS[i], localPath });
      } catch (err) {
        console.error('下载图层失败:', HOME_LAYER_URLS[i], err);
      }
    }

    if (downloadedLayers.length === HOME_LAYER_URLS.length) {
      wx.setStorageSync(HOME_LAYER_CACHE_KEY, downloadedLayers);
      this.setData({
        layers: buildHomeLayers(downloadedLayers.map((layer) => layer.localPath)),
        layersLoading: false,
        isExploded: true
      });
      return;
    }

    wx.removeStorageSync(HOME_LAYER_CACHE_KEY);
    this.setData({
      layers: buildHomeLayers(HOME_LAYER_URLS),
      layersLoading: false,
      isExploded: true
    });
    wx.showToast({
      title: '图层缓存失败，使用在线图层',
      icon: 'none'
    });
  },

  _areHomeLayersValid(layers) {
    const fs = wx.getFileSystemManager();
    try {
      layers.forEach((layer) => {
        fs.accessSync(layer.localPath);
      });
      return true;
    } catch (err) {
      return false;
    }
  },

  async _downloadHomeLayer(fileID, index) {
    const url = await resolveCloudURL(fileID);
    return new Promise((resolve, reject) => {
      wx.downloadFile({
        url,
        timeout: 60000,
        success: (res) => {
          if (res.statusCode !== 200) {
            reject(new Error('HTTP ' + res.statusCode));
            return;
          }

          const fs = wx.getFileSystemManager();
          const savePath = `${wx.env.USER_DATA_PATH}/home_logo_demo_layer_${index}.png`;
          try {
            fs.unlinkSync(savePath);
          } catch (err) {}

          try {
            fs.saveFileSync(res.tempFilePath, savePath);
            resolve(savePath);
          } catch (err) {
            reject(err);
          }
        },
        fail: reject
      });
    });
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
    wx.navigateTo({
      url: '/pages/ai-create/ai-create'
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
  },

  goToKnowledge() {
    wx.navigateTo({
      url: '/pages/knowledge/knowledge'
    });
  }
})
