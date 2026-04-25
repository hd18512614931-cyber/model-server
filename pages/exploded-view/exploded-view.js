const API_URL = 'https://model-server-rosy.vercel.app/api/split-colors';
const CACHE_LIST_KEY = 'colorLayersList';
const LEGACY_CACHE_KEY = 'colorLayers_demo';
const MAX_RECORDS = 10;
const DEMO_IMAGE_PATHS = ['/images/nianhua-demo.jpg', 'images/nianhua-demo.jpg'];
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
      });
      return;
    }

    this._loadSplitLayers();
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

  async _loadSplitLayers() {
    try {
      this.setData({ loading: true, loadingText: '正在分析色层...' });
      const imageBase64 = await this._readDemoImageBase64();
      const response = await this._requestSplitColors(imageBase64);
      const layerFiles = await Promise.all((response.layers || []).slice(0, 5).map((layer, index) => {
        return this._writeLayerToFile(layer, index);
      }));

      const record = {
        id: 'demo',
        title: '佛山木版年画（示例）',
        layers: layerFiles,
        timestamp: Date.now()
      };
      const colorLayersList = this._saveColorLayersList([record]);

      this.setData({
        loading: false,
        colorLayersList,
        currentIndex: 0,
        isExploded: false,
        scale: 1,
        rotateX: 55,
        rotateZ: -30
      }, () => {
        this.applyCurrentLayers();
      });
    } catch (err) {
      console.error('[五色分层] 加载失败:', err);
      this.setData({ loading: false, layers: [] });
      wx.showToast({
        title: err.message || '分色加载失败',
        icon: 'none'
      });
    }
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

  _saveColorLayersList(records) {
    const list = records.slice(0, MAX_RECORDS).map((record) => ({
      id: record.id,
      title: record.title,
      layers: record.layers.map((layer) => ({
        tempPath: layer.tempPath,
        color: layer.color,
        label: layer.label
      })),
      timestamp: record.timestamp
    }));
    wx.setStorageSync(CACHE_LIST_KEY, list);
    return list;
  },

  _areLayerFilesValid(layers) {
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

  _readDemoImageBase64() {
    return new Promise((resolve, reject) => {
      const fs = wx.getFileSystemManager();
      const tryRead = (index) => {
        const filePath = DEMO_IMAGE_PATHS[index];
        if (!filePath) {
          reject(new Error('年画图片读取失败'));
          return;
        }

        fs.readFile({
          filePath,
          encoding: 'base64',
          success: (res) => {
            resolve('data:image/jpeg;base64,' + res.data);
          },
          fail: () => {
            tryRead(index + 1);
          }
        });
      };

      tryRead(0);
    });
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

  _writeLayerToFile(layer, index) {
    return new Promise((resolve, reject) => {
      const dataUrl = layer.data || '';
      const base64Data = dataUrl.split(',')[1];
      if (!base64Data) {
        reject(new Error('图层数据格式错误'));
        return;
      }

      const fileName = `nianhua-color-layer-demo-${index}-${layer.name || 'layer'}.png`;
      const tempPath = `${wx.env.USER_DATA_PATH}/${fileName}`;
      wx.getFileSystemManager().writeFile({
        filePath: tempPath,
        data: base64Data,
        encoding: 'base64',
        success: () => {
          resolve({
            tempPath,
            color: layer.color,
            label: layer.label
          });
        },
        fail: (err) => {
          reject(new Error(err.errMsg || '图层文件写入失败'));
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
