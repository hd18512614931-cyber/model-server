const { downloadCloudFile } = require('./downloadCloudFile');

async function saveLayerImage(layer, filePath, fs) {
  const fileSystem = fs || wx.getFileSystemManager();

  if (layer.fileID) {
    const tempFilePath = await downloadCloudFile(layer.fileID);
    try {
      fileSystem.unlinkSync(filePath);
    } catch (err) {}

    try {
      fileSystem.saveFileSync(tempFilePath, filePath);
    } catch (err) {
      fileSystem.copyFileSync(tempFilePath, filePath);
    }
    return true;
  }

  const data = layer.data || layer.base64 || '';
  const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
  if (!base64Data) return false;

  fileSystem.writeFileSync(filePath, wx.base64ToArrayBuffer(base64Data), 'binary');
  return true;
}

module.exports = {
  saveLayerImage
};
