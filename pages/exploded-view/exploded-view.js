const API_URL = 'https://model-server-rosy.vercel.app/api/split-colors';
const CACHE_KEY = 'colorLayers_demo';
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
    layers: []
  },

  onLoad() {
    this._initialPinchDistance = 0;
    this._initialScale = 1;
    this._lastTouchX = 0;
    this._lastTouchY = 0;
    this._touchStartX = 0;
    this._touchStartY = 0;
    this._touchMoved = false;

    const cachedLayers = this._getValidCachedLayers();
    if (cachedLayers) {
      this._renderLayers(cachedLayers, false);
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
    this.setData({
      isExploded,
      layers: this.data.layers.map((layer, index) => ({
        ...layer,
        layerStyle: this._getLayerStyle(index, isExploded)
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

      wx.setStorageSync(CACHE_KEY, {
        layers: layerFiles.map((layer) => ({
          tempPath: layer.tempPath,
          color: layer.color,
          label: layer.label
        })),
        timestamp: Date.now()
      });

      this._renderLayers(layerFiles, false);
    } catch (err) {
      console.error('[五色分层] 加载失败:', err);
      this.setData({ loading: false, layers: [] });
      wx.showToast({
        title: err.message || '分色加载失败',
        icon: 'none'
      });
    }
  },

  _getValidCachedLayers() {
    const cache = wx.getStorageSync(CACHE_KEY);
    if (!cache || !Array.isArray(cache.layers) || cache.layers.length === 0) return null;

    const fs = wx.getFileSystemManager();
    try {
      cache.layers.forEach((layer) => {
        fs.accessSync(layer.tempPath);
      });
      return cache.layers;
    } catch (err) {
      wx.removeStorageSync(CACHE_KEY);
      return null;
    }
  },

  _renderLayers(layers, isExploded) {
    this.setData({
      loading: false,
      isExploded,
      layers: layers.map((layer, index) => ({
        ...layer,
        layerStyle: this._getLayerStyle(index, isExploded)
      }))
    });
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
  }
});
