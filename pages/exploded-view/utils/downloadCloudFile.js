const { resolveCloudURL } = require('./resolveCloudURL');

function downloadCloudFile(fileID) {
  if (!fileID || !fileID.startsWith('cloud://')) {
    return Promise.reject(new Error('invalid cloud fileID'));
  }

  return new Promise((resolve, reject) => {
    wx.cloud.downloadFile({
      fileID,
      success: (res) => resolve(res.tempFilePath),
      fail: reject
    });
  });
}

function downloadRemoteFile(url) {
  return new Promise((resolve, reject) => {
    wx.downloadFile({
      url,
      timeout: 60000,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.tempFilePath);
          return;
        }
        reject(new Error('HTTP ' + res.statusCode));
      },
      fail: reject
    });
  });
}

async function downloadFileToTemp(source) {
  if (!source) {
    throw new Error('empty file source');
  }

  if (source.startsWith('cloud://')) {
    return downloadCloudFile(source);
  }

  return downloadRemoteFile(source);
}

async function resolvePreviewURL(source) {
  if (!source || !source.startsWith('cloud://')) {
    return source;
  }

  return resolveCloudURL(source);
}

module.exports = {
  downloadCloudFile,
  downloadFileToTemp,
  resolvePreviewURL
};
