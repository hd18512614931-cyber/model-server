const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

const generateId = () => {
  return '_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

const imageToBase64 = (filePath) => {
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().readFile({
      filePath: filePath,
      encoding: 'base64',
      success: res => resolve(res.data),
      fail: err => reject(err)
    });
  });
}

module.exports = {
  formatTime,
  generateId,
  imageToBase64
}
