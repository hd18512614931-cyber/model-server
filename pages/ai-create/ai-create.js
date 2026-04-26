const SPLIT_API_URL = 'https://model-server-rosy.vercel.app/api/split-colors';
const USER_CACHE_KEY = 'userColorLayers';
const MAX_USER_RECORDS = 10;

Page({
  data: {
    inputText: '',
    generatedImageUrl: '',
    loading: false,
    splitLoading: false
  },

  onInput(e) {
    this.setData({
      inputText: e.detail.value
    });
  },

  onGenerate() {
    const inputText = this.data.inputText.trim();
    if (!inputText) {
      wx.showToast({
        title: '请输入创作主题',
        icon: 'none'
      });
      return;
    }

    if (this.data.loading) return;

    const prompt = '严格二维平面佛山木版年画风格，中国传统民间年画，'
      + inputText
      + '，红黄绿黑白五色套印，黑色粗线勾边，边界清晰，色彩鲜明，色块分明，纯色平涂，适合木版套印工艺，平面装饰风格，白色纸张背景，构图饱满居中。'
      + '必须是非写实、非摄影、非3D、非油画、非厚涂、非水彩，不要真实皮肤质感，不要复杂纹理，不要渐变，不要光影，不要阴影，不要高光，不要反光，不要电影光效，所有区域必须是清晰纯色块。';

    this.setData({
      loading: true,
      generatedImageUrl: ''
    });

    wx.cloud.callFunction({
      name: 'generateImage-RA7PaB',
      data: { prompt },
      success: (res) => {
        const result = res.result || {};
        if (result.success && result.imageUrl) {
          this.setData({
            generatedImageUrl: result.imageUrl,
            loading: false
          });
          return;
        }

        console.error('生图云函数返回异常:', result);
        wx.showToast({
          title: '生成失败，请重试',
          icon: 'none'
        });
        this.setData({ loading: false });
      },
      fail: (err) => {
        console.error('云函数调用失败:', err);
        wx.showToast({
          title: '调用失败，请重试',
          icon: 'none'
        });
        this.setData({ loading: false });
      }
    });
  },

  onRegenerate() {
    if (this.data.loading || this.data.splitLoading) return;
    this.setData({ generatedImageUrl: '' });
    this.onGenerate();
  },

  async onSplitColors() {
    if (!this.data.generatedImageUrl || this.data.splitLoading) return;

    this.setData({ splitLoading: true });

    try {
      const localImagePath = await this._downloadGeneratedImage(this.data.generatedImageUrl);
      const imageBase64 = await this._readFileAsDataUrl(localImagePath);
      const splitResult = await this._requestSplitColors(imageBase64);
      const record = await this._saveSplitLayers(splitResult.layers || []);

      if (!record) {
        throw new Error('分色结果为空');
      }

      this._saveUserGallery(record);
      wx.showToast({
        title: '分色完成',
        icon: 'success'
      });
      wx.navigateTo({
        url: '/pages/exploded-view/exploded-view'
      });
    } catch (err) {
      console.error('生成分色展示失败:', err);
      wx.showToast({
        title: '分色失败，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ splitLoading: false });
    }
  },

  _downloadGeneratedImage(imageUrl) {
    if (imageUrl.startsWith('cloud://')) {
      return new Promise((resolve, reject) => {
        wx.cloud.downloadFile({
          fileID: imageUrl,
          success: (res) => resolve(res.tempFilePath),
          fail: reject
        });
      });
    }

    return new Promise((resolve, reject) => {
      wx.downloadFile({
        url: imageUrl,
        timeout: 60000,
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.tempFilePath);
            return;
          }
          reject(new Error('下载图片失败 HTTP ' + res.statusCode));
        },
        fail: reject
      });
    });
  },

  _readFileAsDataUrl(filePath) {
    return new Promise((resolve, reject) => {
      wx.getFileSystemManager().readFile({
        filePath,
        encoding: 'base64',
        success: (res) => {
          resolve('data:image/png;base64,' + res.data);
        },
        fail: reject
      });
    });
  },

  _requestSplitColors(imageBase64) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: SPLIT_API_URL,
        method: 'POST',
        header: {
          'Content-Type': 'application/json'
        },
        data: {
          image: imageBase64,
          imageBase64,
          imageUrl: imageBase64
        },
        timeout: 60000,
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300 && res.data && res.data.success && Array.isArray(res.data.layers)) {
            resolve(res.data);
            return;
          }
          reject(new Error((res.data && res.data.error) || '分色接口请求失败'));
        },
        fail: reject
      });
    });
  },

  async _saveSplitLayers(layers) {
    if (!Array.isArray(layers) || layers.length === 0) return null;

    const fs = wx.getFileSystemManager();
    const timestamp = Date.now();
    const id = 'user_' + timestamp;
    const savedLayers = [];

    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      const data = layer.data || layer.base64 || '';
      const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
      if (!base64Data) continue;

      const tempPath = `${wx.env.USER_DATA_PATH}/user_layer_${id}_${i}.png`;
      fs.writeFileSync(tempPath, wx.base64ToArrayBuffer(base64Data), 'binary');
      savedLayers.push({
        tempPath,
        color: layer.color || '',
        label: layer.label || ('图层' + (i + 1))
      });
    }

    if (savedLayers.length === 0) return null;

    return {
      id,
      title: this.data.inputText.trim() || 'AI年画作品',
      isPreset: false,
      layers: savedLayers,
      timestamp
    };
  },

  _saveUserGallery(record) {
    const currentList = wx.getStorageSync(USER_CACHE_KEY);
    const list = Array.isArray(currentList) ? currentList : [];
    const nextList = [record, ...list.filter((item) => item && item.id !== record.id)].slice(0, MAX_USER_RECORDS);
    wx.setStorageSync(USER_CACHE_KEY, nextList);
  }
});
