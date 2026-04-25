import api from '../../utils/api';

Page({
  data: {
    selectedImage: '',
    selectedStyle: '',
    isLoading: false,
    styleList: [
      { id: 'menshen', name: '传统门神' },
      { id: 'fulushou', name: '福禄寿' },
      { id: 'niannianyouyu', name: '年年有余' },
      { id: 'caishen', name: '财神爷' },
      { id: 'bixie', name: '镇宅辟邪' }
    ]
  },

  // 选择/拍照图片
  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          selectedImage: res.tempFiles[0].tempFilePath
        });
      }
    });
  },

  // 选择风格
  selectStyle(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({
      selectedStyle: this.data.selectedStyle === id ? '' : id
    });
  },

  // 开始分色
  startSeparation() {
    if (!this.data.selectedImage) {
      wx.showToast({ title: '请先选择图片', icon: 'none' });
      return;
    }

    this.setData({ isLoading: true });

    const fs = wx.getFileSystemManager();
    // 1. 将图片转为base64
    fs.readFile({
      filePath: this.data.selectedImage,
      encoding: 'base64',
      success: async (res) => {
        try {
          const base64Image = res.data;
          
          // 2. 调用后端API POST /api/v1/separate
          const result = await api.separateImage(base64Image, this.data.selectedStyle);
          
          if (result && result.layers) {
            // 3. 将返回的图层数据存储后传递给图层页
            wx.setStorageSync('currentLayers', result.layers);
            wx.switchTab({
              url: '/pages/layers/layers'
            });
          } else {
            this.handleErrorFallback();
          }
        } catch (error) {
          console.error('分色API调用失败', error);
          this.handleErrorFallback();
        } finally {
          this.setData({ isLoading: false });
        }
      },
      fail: (err) => {
        console.error('读取图片失败', err);
        wx.showToast({ title: '读取图片失败', icon: 'none' });
        this.setData({ isLoading: false });
      }
    });
  },

  // 错误处理与模拟数据fallback
  handleErrorFallback() {
    wx.showToast({ title: '后台接口未通，使用模拟数据', icon: 'none', duration: 2000 });
    setTimeout(() => {
      const mockLayers = [
        { id: 1, name: "线稿层", color: "#000000", order: 5, url: "https://via.placeholder.com/300x400/FFFFFF/000000?text=Line", active: true },
        { id: 2, name: "红色层", color: "#D9281C", order: 4, url: "https://via.placeholder.com/300x400/FFFFFF/D9281C?text=Red", active: true },
        { id: 3, name: "黄色层", color: "#C8A063", order: 3, url: "https://via.placeholder.com/300x400/FFFFFF/C8A063?text=Yellow", active: true },
        { id: 4, name: "绿色层", color: "#4A7A59", order: 2, url: "https://via.placeholder.com/300x400/FFFFFF/4A7A59?text=Green", active: true },
        { id: 5, name: "底色层", color: "#F5E6D3", order: 1, url: "https://via.placeholder.com/300x400/F5E6D3/F5E6D3?text=Base", active: true }
      ];
      wx.setStorageSync('currentLayers', mockLayers);
      wx.switchTab({
        url: '/pages/layers/layers'
      }).catch(() => {
        wx.navigateTo({ url: '/pages/layers/layers' });
      });
    }, 2000);
  }
});
