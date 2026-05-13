function getApiBaseURL() {
  const app = getApp();
  const baseURL = app && app.globalData && app.globalData.apiBaseUrl;
  if (!baseURL) {
    throw new Error('请先在 app.js 的 globalData.apiBaseUrl 配置后端 API 域名');
  }
  return baseURL.replace(/\/$/, '');
}

module.exports = {
  getApiBaseURL
};
