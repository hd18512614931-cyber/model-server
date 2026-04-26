const API_URL = 'https://model-server-rosy.vercel.app/api/split-colors';
const USER_CACHE_KEY = 'userColorLayers';
const PRESET_CACHE_KEY = 'presetColorLayers';
const LAYER_BASE_URL = 'https://model-server-rosy.vercel.app/layers';
const MAX_USER_RECORDS = 10;
const PRESET_GALLERIES = [
  {
    id: 'nianhua-demo',
    title: '佛山木版年画示例',
    isPreset: true,
    remotePrefix: LAYER_BASE_URL + '/nianhua-demo',
    layerCount: 5
  },
  {
    id: 'longtou',
    title: '龙头年画',
    isPreset: true,
    remotePrefix: LAYER_BASE_URL + '/longtou',
    layerCount: 5
  }
];
const PRESET_LAYER_META = [
  { color: '#1a1a1a', label: '墨线稿' },
  { color: '#cc2936', label: '大红' },
  { color: '#2d6a4f', label: '翠绿' },
  { color: '#e6a817', label: '橙黄' },
  { color: '#e8b4a2', label: '肉粉' }
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
    loading: false,
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

  async onLoad() {
    this._resetTouchState();
    this._isSwitching = false;
    this.setData({
      loading: true,
      loadingProgress: '准备预置图层'
    });

    const colorLayersList = [
      ...await this._getPresetGalleries(),
      ...this._getValidUserGalleries()
    ];

    this.setData({
      colorLayersList,
      currentIndex: 0,
      loading: false,
      loadingProgress: ''
    }, () => {
      this.applyCurrentLayers();
    });
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

    const validLayers = current.isPreset ? current.layers : this._getExistingUserLayers(current.layers);
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
    const currentList = wx.getStorageSync(USER_CACHE_KEY) || [];
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
      const filePath = `${wx.env.USER_DATA_PATH}/user_layer_${id}_${i}.png`;
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

    const nextList = (Array.isArray(wx.getStorageSync(USER_CACHE_KEY)) ? wx.getStorageSync(USER_CACHE_KEY) : [])
      .filter((item) => item.id !== id);
    nextList.unshift({
      id,
      title,
      isPreset: false,
      layers,
      timestamp: Date.now()
    });
    wx.setStorageSync(USER_CACHE_KEY, nextList.slice(0, MAX_USER_RECORDS));
    return true;
  },

  async _getPresetGalleries() {
    const cache = wx.getStorageSync(PRESET_CACHE_KEY) || {};
    const nextCache = { ...cache };
    const galleries = [];

    for (const gallery of PRESET_GALLERIES) {
      let layers = this._getCachedPresetLayers(gallery, cache[gallery.id]);

      if (layers.length !== gallery.layerCount) {
        this.setData({ loadingProgress: `下载${gallery.title}` });
        layers = await this._downloadPresetLayers(gallery);
      }

      if (layers.length === gallery.layerCount) {
        nextCache[gallery.id] = {
          id: gallery.id,
          title: gallery.title,
          isPreset: true,
          layers,
          timestamp: Date.now()
        };
        galleries.push({
          id: gallery.id,
          title: gallery.title,
          isPreset: true,
          layers
        });
      }
    }

    wx.setStorageSync(PRESET_CACHE_KEY, nextCache);
    return galleries;
  },

  _getCachedPresetLayers(gallery, cachedGallery) {
    const storedLayers = cachedGallery && Array.isArray(cachedGallery.layers) ? cachedGallery.layers : [];
    if (storedLayers.length === gallery.layerCount && this._areLayerFilesValid(storedLayers)) {
      return storedLayers.map((layer, index) => ({
        tempPath: layer.tempPath,
        color: layer.color || PRESET_LAYER_META[index].color,
        label: layer.label || PRESET_LAYER_META[index].label
      }));
    }

    const expectedLayers = this._buildPresetLayersFromLocalPaths(gallery);
    if (this._areLayerFilesValid(expectedLayers)) {
      return expectedLayers;
    }

    return [];
  },

  _buildPresetLayersFromLocalPaths(gallery) {
    return Array.from({ length: gallery.layerCount }, (_, index) => ({
      tempPath: `${wx.env.USER_DATA_PATH}/layer_${gallery.id}_${index}.png`,
      color: PRESET_LAYER_META[index].color,
      label: PRESET_LAYER_META[index].label
    }));
  },

  async _downloadPresetLayers(gallery) {
    const layers = [];

    for (let i = 0; i < gallery.layerCount; i++) {
      try {
        const tempPath = await this._downloadPresetLayer(gallery, i);
        layers.push({
          tempPath,
          color: PRESET_LAYER_META[i].color,
          label: PRESET_LAYER_META[i].label
        });
      } catch (err) {
        console.error('[分色展厅] 预置图层下载失败:', gallery.id, i, err);
      }
    }

    return layers.length === gallery.layerCount ? layers : [];
  },

  _downloadPresetLayer(gallery, index) {
    return new Promise((resolve, reject) => {
      wx.downloadFile({
        url: `${gallery.remotePrefix}/layer_${index}.png`,
        timeout: 60000,
        success: (res) => {
          if (res.statusCode !== 200) {
            reject(new Error('HTTP ' + res.statusCode));
            return;
          }

          const fs = wx.getFileSystemManager();
          const savePath = `${wx.env.USER_DATA_PATH}/layer_${gallery.id}_${index}.png`;
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

  _getValidUserGalleries() {
    const storedList = wx.getStorageSync(USER_CACHE_KEY);
    if (!Array.isArray(storedList) || storedList.length === 0) return [];

    const validList = storedList.filter((record) => {
      return record && Array.isArray(record.layers) && record.layers.length > 0 && this._areLayerFilesValid(record.layers);
    }).slice(0, MAX_USER_RECORDS).map((record) => ({
      id: record.id,
      title: record.title,
      isPreset: false,
      layers: record.layers.map((layer) => ({
        tempPath: layer.tempPath,
        color: layer.color,
        label: layer.label
      })),
      timestamp: record.timestamp
    }));

    if (validList.length > 0) {
      wx.setStorageSync(USER_CACHE_KEY, validList);
    } else {
      wx.removeStorageSync(USER_CACHE_KEY);
    }

    return validList;
  },

  _getExistingUserLayers(layers) {
    const fs = wx.getFileSystemManager();
    return layers.filter((layer) => {
      try {
        fs.accessSync(layer.tempPath);
        return true;
      } catch (err) {
        return false;
      }
    });
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
