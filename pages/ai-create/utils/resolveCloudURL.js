const cache = new Map();

function resolveCloudURL(fileID) {
  const hit = cache.get(fileID);
  if (hit && hit.expireAt > Date.now() + 60000) {
    return Promise.resolve(hit.url);
  }

  return wx.cloud.getTempFileURL({
    fileList: [fileID]
  }).then(({ fileList }) => {
    const item = fileList && fileList[0];
    if (!item || item.status !== 0) {
      throw new Error((item && item.errMsg) || 'getTempFileURL failed');
    }

    cache.set(fileID, {
      url: item.tempFileURL,
      expireAt: Date.now() + 100 * 60000
    });
    return item.tempFileURL;
  });
}

module.exports = {
  resolveCloudURL
};
