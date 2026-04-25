const app = getApp();

const request = (url, method, data) => {
  // 动态读取全局配置，确保取得最新状态
  const baseURL = (app && app.globalData && app.globalData.apiBaseUrl) 
    ? app.globalData.apiBaseUrl 
    : 'http://localhost:8000';
    
  const useMock = (app && app.globalData && app.globalData.useMock !== undefined) 
    ? app.globalData.useMock 
    : false;

  // Mock
  if (useMock && url === '/api/v1/separate') {
    return new Promise((resolve) => {
      wx.showLoading({ title: 'AI分色中(Mock)...', mask: true });
      setTimeout(() => {
        wx.hideLoading();
        resolve({
          layers: [
            { id: 1, name: '底色层', color: '#F5E6D3', order: 1, url: 'https://via.placeholder.com/600x800/F5E6D3/F5E6D3?text=Base', active: true, zIndex: 1 },
            { id: 2, name: '绿色层', color: '#4A7A59', order: 2, url: 'https://via.placeholder.com/600x800/FFFFFF/4A7A59?text=Green', active: true, zIndex: 2 },
            { id: 3, name: '黄色层', color: '#C8A063', order: 3, url: 'https://via.placeholder.com/600x800/FFFFFF/C8A063?text=Yellow', active: true, zIndex: 3 },
            { id: 4, name: '红色层', color: '#D9281C', order: 4, url: 'https://via.placeholder.com/600x800/FFFFFF/D9281C?text=Red', active: true, zIndex: 4 },
            { id: 5, name: '线稿层', color: '#000000', order: 5, url: 'https://via.placeholder.com/600x800/FFFFFF/000000?text=Line', active: true, zIndex: 5 }
          ]
        });
      }, 1500);
    });
  }

  // 正常接口请求添加拦截 Loading
  wx.showLoading({ title: '加载中...', mask: true });

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${baseURL}${url}`,
      method: method,
      data: data,
      header: {
        'content-type': 'application/json'
      },
      success(res) {
        wx.hideLoading();
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          // 响应拦截错误提示
          wx.showToast({
            title: res.data.message || `请求失败，状态码：${res.statusCode}`,
            icon: 'none',
            duration: 2000
          });
          reject(new Error(`请求失败，状态码：${res.statusCode}`));
        }
      },
      fail(err) {
        wx.hideLoading();
        wx.showToast({
          title: '网络请求失败，请检查网络设置或后端服务',
          icon: 'none',
          duration: 3000
        });
        reject(err);
      }
    });
  });
};

const api = {
  /**
   * 将图片进行分色
   * @param {string} base64Image 图片的base64格式数据
   * @param {string} style 风格类型
   */
  separateImage: (base64Image, style = '') => {
    return request('/api/v1/separate', 'POST', {
      image: base64Image,
      style: style
    });
  }
};

export default api;
