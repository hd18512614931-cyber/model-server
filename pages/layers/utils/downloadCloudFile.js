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

module.exports = {
  downloadCloudFile
};
