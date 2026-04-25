const API_URL = 'https://model-server-rosy.vercel.app/api/split-colors';
const CACHE_LIST_KEY = 'colorLayersList';
const LEGACY_CACHE_KEY = 'colorLayers_demo';
const MAX_RECORDS = 10;
const GALLERY_IMAGES = [
  { localImagePath: '/images/nianhua-demo.jpg', id: 'demo', title: '佛山木版年画（示例）' },
  { localImagePath: '/images/longtou.jpg', id: 'longtou', title: '龙头年画' }
];
const EXPLODED_TRANSFORMS = [
  'translateZ(200px) translateY(-80px)',
  'translateZ(100px) translateY(-40px)',
  'translateZ(0px)',
  'translateZ(-100px) translateY(40px)',
  'translateZ(-200px) translateY(80px)'
];

Page({
  data: {
    loading: true,
    loadingText: '正在分析色层...',
    loadingProgress: '',
    isExploded: false,
    scale: 1,
    rotateX: 55,
    rotateZ: -30,
    colorLayersList: [],
    currentIndex: 0,
    slideDirection: '',
    layers: []
  },

  onLoad() {
    this._resetTouchState();
    this._isSwitching = false;

    const cachedList = this._getValidColorLayersList();
    if (cachedList.length > 0) {
      this.setData({
        loading: false,
        colorLayersList: cachedList,
        currentIndex: 0
      }, () => {
        this.applyCurrentLayers();
        this._ensureGalleryImages();
      });
      return;
    }

    this._initializeGallery();
  },

  goBack() {
    wx.navigateBack();
  },

  toggleExplode() {
    if (this._touchMoved) return;

    const isExploded = !this.data.isExploded;
    this.setData({ isExploded }, () => {
      this.updateLayerStyles();
    });
  },

  prevItem() {
    if (this.data.currentIndex <= 0) return;
    this._switchItem(this.data.currentIndex - 1, 'right');
  },

  nextItem() {
    if (this.data.currentIndex >= this.data.colorLayersList.length - 1) return;
    this._switchItem(this.data.currentIndex + 1, 'left');
  },

  applyCurrentLayers() {
    const current = this.data.colorLayersList[this.data.currentIndex];
    if (!current || !Array.isArray(current.layers)) return;

    const fs = wx.getFileSystemManager();
    const validLayers = current.layers.filter((layer) => {
      try {
        fs.accessSync(layer.tempPath);
        return true;
      } catch (err) {
        return false;
      }
    });
    if (validLayers.length === 0) return;

    this.setData({ layers: validLayers }, () => {
      this.updateLayerStyles();
    });
  },

  updateLayerStyles() {
    this.setData({
      layers: this.data.layers.map((layer, index) => ({
        ...layer,
        layerStyle: this._getLayerStyle(index, this.data.isExploded)
      }))
    });
  },

  onTouchStart(e) {
    const touches = e.touches || [];
    if (touches.length === 2) {
      this._touchMoved = true;
      this._initialPinchDistance = this._getTouchDistance(touches[0], touches[1]);
      this._initialScale = this.data.scale;
      return;
    }

    if (touches.length === 1) {
      this._touchMoved = false;
      this._touchStartX = touches[0].clientX;
      this._touchStartY = touches[0].clientY;
      this._lastTouchX = touches[0].clientX;
      this._lastTouchY = touches[0].clientY;
    }
  },

  onTouchMove(e) {
    const touches = e.touches || [];
    if (touches.length === 2) {
      const currentDistance = this._getTouchDistance(touches[0], touches[1]);
      if (this._initialPinchDistance <= 0) {
        this._initialPinchDistance = currentDistance;
        this._initialScale = this.data.scale;
        return;
      }

      const scale = this._clamp(this._initialScale * (currentDistance / this._initialPinchDistance), 0.5, 3);
      this._touchMoved = true;
      this.setData({ scale });
      return;
    }

    if (touches.length === 1) {
      const currentX = touches[0].clientX;
      const currentY = touches[0].clientY;
      const totalDx = currentX - this._touchStartX;
      const totalDy = currentY - this._touchStartY;
      if (Math.sqrt(totalDx * totalDx + totalDy * totalDy) >= 10) {
        this._touchMoved = true;
      }

      const dx = currentX - this._lastTouchX;
      const dy = currentY - this._lastTouchY;
      const rotateX = this._clamp(this.data.rotateX + dy * 0.3, 0, 90);
      const rotateZ = this.data.rotateZ + dx * 0.3;
      this._lastTouchX = currentX;
      this._lastTouchY = currentY;
      this.setData({ rotateX, rotateZ });
    }
  },

  onTouchEnd() {
    this._initialPinchDistance = 0;
    this._initialScale = this.data.scale;
  },

  async addImageToGallery(localImagePath, id, title) {
    const currentList = wx.getStorageSync(CACHE_LIST_KEY) || [];
    if (Array.isArray(currentList) && currentList.find((item) => item.id === id && this._areLayerFilesValid(item.layers))) {
      return false;
    }

    const fs = wx.getFileSystemManager();
    const base64 = wx.arrayBufferToBase64(fs.readFileSync(localImagePath));
    const dataUrl = 'data:image/jpeg;base64,' + base64;
    const response = await this._requestSplitColors(dataUrl);
    if (!response.layers || response.layers.length === 0) return false;

    const layers = [];
    for (let i = 0; i < response.layers.length; i++) {
      const layer = response.layers[i];
      const filePath = `${wx.env.USER_DATA_PATH}/layer_${id}_${i}.png`;
      const data = layer.data || layer.base64 || '';
      const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
      if (!base64Data) continue;

      fs.writeFileSync(filePath, wx.base64ToArrayBuffer(base64Data), 'binary');
      layers.push({
        tempPath: filePath,
        color: layer.color || '',
        label: layer.label || ('图层' + (i + 1))
      });
    }
    if (layers.length === 0) return false;

    const nextList = (Array.isArray(wx.getStorageSync(CACHE_LIST_KEY)) ? wx.getStorageSync(CACHE_LIST_KEY) : [])
      .filter((item) => item.id !== id);
    nextList.push({
      id,
      title,
      layers,
      timestamp: Date.now()
    });
    wx.setStorageSync(CACHE_LIST_KEY, nextList.slice(0, MAX_RECORDS));
    return true;
  },

  async _initializeGallery() {
    try {
      this.setData({ loading: true, loadingProgress: '1 / 2' });
      await this.addImageToGallery(GALLERY_IMAGES[0].localImagePath, GALLERY_IMAGES[0].id, GALLERY_IMAGES[0].title);
      this._refreshGalleryFromStorage(0);

      this.setData({ loading: true, loadingProgress: '2 / 2' });
      await this.addImageToGallery(GALLERY_IMAGES[1].localImagePath, GALLERY_IMAGES[1].id, GALLERY_IMAGES[1].title);
      this._refreshGalleryFromStorage(this.data.currentIndex);
      this.setData({ loading: false, loadingProgress: '' });
    } catch (err) {
      console.error('[五色分层] 加载失败:', err);
      this.setData({ loading: false, loadingProgress: '' });
      wx.showToast({
        title: err.message || '分色加载失败',
        icon: 'none'
      });
    }
  },

  async _ensureGalleryImages() {
    try {
      for (let i = 0; i < GALLERY_IMAGES.length; i++) {
        const image = GALLERY_IMAGES[i];
        const list = wx.getStorageSync(CACHE_LIST_KEY) || [];
        const exists = Array.isArray(list) && list.find((item) => item.id === image.id && this._areLayerFilesValid(item.layers));
        if (exists) continue;

        this.setData({ loading: true, loadingProgress: `${i + 1} / ${GALLERY_IMAGES.length}` });
        await this.addImageToGallery(image.localImagePath, image.id, image.title);
        this._refreshGalleryFromStorage(this.data.currentIndex);
      }
    } catch (err) {
      console.error('[五色分层] 追加图库失败:', err);
      wx.showToast({
        title: err.message || '图库更新失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false, loadingProgress: '' });
    }
  },

  _refreshGalleryFromStorage(preferredIndex) {
    const updatedList = this._getValidColorLayersList();
    if (updatedList.length === 0) return;

    const currentIndex = Math.min(preferredIndex || 0, updatedList.length - 1);
    this.setData({
      colorLayersList: updatedList,
      currentIndex,
      isExploded: false,
      scale: 1,
      rotateX: 55,
      rotateZ: -30
    }, () => {
      this.applyCurrentLayers();
    });
  },

  _getValidColorLayersList() {
    const migratedList = this._getMigratedLegacyList();
    const storedList = wx.getStorageSync(CACHE_LIST_KEY);
    const sourceList = Array.isArray(storedList) && storedList.length > 0 ? storedList : migratedList;
    if (!Array.isArray(sourceList) || sourceList.length === 0) return [];

    const validList = sourceList.filter((record) => {
      return record && Array.isArray(record.layers) && record.layers.length > 0 && this._areLayerFilesValid(record.layers);
    }).slice(0, MAX_RECORDS);

    if (validList.length > 0) {
      wx.setStorageSync(CACHE_LIST_KEY, validList);
    } else {
      wx.removeStorageSync(CACHE_LIST_KEY);
    }

    return validList;
  },

  _getMigratedLegacyList() {
    const legacy = wx.getStorageSync(LEGACY_CACHE_KEY);
    if (!legacy || !Array.isArray(legacy.layers) || legacy.layers.length === 0) return [];
    if (!this._areLayerFilesValid(legacy.layers)) {
      wx.removeStorageSync(LEGACY_CACHE_KEY);
      return [];
    }

    const record = {
      id: 'demo',
      title: '佛山木版年画（示例）',
      layers: legacy.layers.map((layer) => ({
        tempPath: layer.tempPath,
        color: layer.color,
        label: layer.label
      })),
      timestamp: legacy.timestamp || Date.now()
    };
    wx.removeStorageSync(LEGACY_CACHE_KEY);
    return [record];
  },

  _areLayerFilesValid(layers) {
    if (!Array.isArray(layers) || layers.length === 0) return false;

    const fs = wx.getFileSystemManager();
    try {
      layers.forEach((layer) => {
        fs.accessSync(layer.tempPath);
      });
      return true;
    } catch (err) {
      return false;
    }
  },

  _switchItem(newIndex, direction) {
    if (this._isSwitching) return;
    this._isSwitching = true;

    const outClass = direction === 'left' ? 'slide-out-left' : 'slide-out-right';
    const inClass = direction === 'left' ? 'slide-in-right' : 'slide-in-left';
    this.setData({ slideDirection: outClass });

    setTimeout(() => {
      this.setData({
        currentIndex: newIndex,
        rotateX: 55,
        rotateZ: -30,
        scale: 1,
        isExploded: false,
        slideDirection: inClass
      }, () => {
        this.applyCurrentLayers();
        setTimeout(() => {
          this.setData({ slideDirection: '' });
          this._isSwitching = false;
        }, 200);
      });
    }, 200);
  },

  _requestSplitColors(imageBase64) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: API_URL,
        method: 'POST',
        header: {
          'Content-Type': 'application/json'
        },
        data: {
          imageBase64,
          imageUrl: imageBase64
        },
        timeout: 60000,
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300 && res.data && res.data.success) {
            resolve(res.data);
            return;
          }
          reject(new Error((res.data && res.data.error) || '分色接口请求失败'));
        },
        fail: (err) => {
          reject(new Error(err.errMsg || '分色接口请求失败'));
        }
      });
    });
  },

  _getLayerStyle(index, isExploded) {
    const transform = isExploded ? EXPLODED_TRANSFORMS[index] || 'translateZ(0px)' : 'translateZ(0px) translateY(0px)';
    return `transform: ${transform}; z-index: ${10 - index};`;
  },

  _getTouchDistance(touchA, touchB) {
    const dx = touchA.clientX - touchB.clientX;
    const dy = touchA.clientY - touchB.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  },

  _clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },

  _resetTouchState() {
    this._initialPinchDistance = 0;
    this._initialScale = 1;
    this._lastTouchX = 0;
    this._lastTouchY = 0;
    this._touchStartX = 0;
    this._touchStartY = 0;
    this._touchMoved = false;
  }
});
