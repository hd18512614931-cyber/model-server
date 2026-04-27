const app = getApp();
const MODEL_HISTORY_KEY = 'modelHistory';
const MODEL_BASE_URL = 'https://model-server-rosy.vercel.app/models/';
const MAX_USER_MODELS = 5;
const PRESET_MODELS = [
  { id: 'preset_ai_generated', name: 'AI 生成模型', file: 'ai-generated.glb', emoji: '', color: '#D4A849' },
  { id: 'preset_house', name: '房屋', file: 'house.glb', emoji: '', color: '#87CEEB' },
  { id: 'preset_chman', name: '棋子', file: 'chman.glb', emoji: '♟️', color: '#DDA0DD' }
];

Page({
  data: {
    models: []
  },

  onLoad() {
    this._loadModels();
  },

  onShow() {
    this._loadModels();
  },

  _loadModels() {
    this.setData({
      models: [...this._getValidUserModels(), ...PRESET_MODELS]
    });
  },

  goBack() {
    wx.navigateBack();
  },

  goAI3D() {
    wx.navigateTo({
      url: '/pages/ai-3d/ai-3d'
    });
  },

  onModelTap(e) {
    const item = e.currentTarget.dataset.item;
    if (item.path) {
      app.globalData._pendingModelUrl = item.path;
      app.globalData._pendingModelName = item.name;
      wx.navigateTo({ url: '/pages/model3d-viewer/model3d-viewer' });
      return;
    }

    wx.navigateTo({
      url: '/pages/model3d-viewer/model3d-viewer?url=' + encodeURIComponent(MODEL_BASE_URL + item.file) + '&name=' + encodeURIComponent(item.name)
    });
  },

  _getValidUserModels() {
    let history = [];
    try {
      const stored = wx.getStorageSync(MODEL_HISTORY_KEY);
      history = Array.isArray(stored) ? stored : [];
    } catch (err) {
      console.error('[3D 展厅] 读取历史模型失败:', err);
      return [];
    }

    const fs = wx.getFileSystemManager();
    const validHistory = history.filter((item) => {
      if (!item || !item.path) return false;
      try {
        fs.accessSync(item.path);
        return true;
      } catch (err) {
        return false;
      }
    }).slice(0, MAX_USER_MODELS);

    if (validHistory.length !== history.length) {
      try {
        wx.setStorageSync(MODEL_HISTORY_KEY, validHistory);
      } catch (err) {
        console.error('[3D 展厅] 清理历史模型失败:', err);
      }
    }

    return validHistory.map((item) => ({
      id: item.id || item.path,
      name: item.name || 'AI 生成模型',
      path: item.path,
      emoji: '🎨',
      color: '#D4A849'
    }));
  }
});
