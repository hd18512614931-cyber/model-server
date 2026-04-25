const API_URL = 'https://model-server-rosy.vercel.app/api/split-colors';
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
    layers: []
  },

  onLoad() {
    this._tempLayerFiles = [];
    this._loadSplitLayers();
  },

  onUnload() {
    const fs = wx.getFileSystemManager();
    (this._tempLayerFiles || []).forEach((filePath) => {
      fs.unlink({
        filePath,
        fail: () => {}
      });
    });
  },

  goBack() {
    wx.navigateBack();
  },

  toggleExplode() {
    const isExploded = !this.data.isExploded;
    this.setData({
      isExploded,
      layers: this.data.layers.map((layer, index) => ({
        ...layer,
        style: this._getLayerStyle(index, isExploded)
      }))
    });
  },

  async _loadSplitLayers() {
    try {
      this.setData({ loading: true, loadingText: '正在分析色层...' });
      const imageBase64 = await this._readDemoImageBase64();
      const response = await this._requestSplitColors(imageBase64);
      const layerFiles = await Promise.all((response.layers || []).slice(0, 5).map((layer, index) => {
        return this._writeLayerToFile(layer, index);
      }));

      this.setData({
        loading: false,
        isExploded: false,
        layers: layerFiles.map((layer, index) => ({
          ...layer,
          style: this._getLayerStyle(index, false)
        }))
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

      const filePath = `${wx.env.USER_DATA_PATH}/nianhua-layer-${Date.now()}-${index}.png`;
      wx.getFileSystemManager().writeFile({
        filePath,
        data: base64Data,
        encoding: 'base64',
        success: () => {
          this._tempLayerFiles.push(filePath);
          resolve({
            name: layer.name,
            label: layer.label,
            color: layer.color,
            pixelCount: layer.pixelCount,
            src: filePath
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
  }
});
