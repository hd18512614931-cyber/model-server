const { getApiBaseURL } = require('./apiBaseURL');

function requestSplitColorsViaHttp(imageSource, options) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${getApiBaseURL()}/api/split-colors`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: {
        image: imageSource,
        imageBase64: imageSource,
        imageUrl: imageSource,
        removeBackground: options.removeBackground !== false
      },
      timeout: 120000,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300 && res.data && res.data.success && Array.isArray(res.data.layers)) {
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
}

function requestSplitColorsViaCloudFunction(imageSource, options) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'splitColors',
      data: {
        image: imageSource,
        imageBase64: imageSource,
        imageUrl: imageSource,
        removeBackground: options.removeBackground !== false
      },
      success: (res) => {
        const result = res.result || {};
        if (result.success && Array.isArray(result.layers)) {
          resolve(result);
          return;
        }
        reject(new Error(result.error || result.message || '云函数分色失败'));
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '云函数分色失败'));
      }
    });
  });
}

function requestSplitColors(imageSource, options = {}) {
  const app = getApp();
  const baseURL = app && app.globalData && app.globalData.apiBaseUrl;
  const isCloudFile = typeof imageSource === 'string' && imageSource.startsWith('cloud://');

  if (baseURL && !isCloudFile) {
    return requestSplitColorsViaHttp(imageSource, options);
  }

  return requestSplitColorsViaCloudFunction(imageSource, options);
}

module.exports = {
  requestSplitColors
};
