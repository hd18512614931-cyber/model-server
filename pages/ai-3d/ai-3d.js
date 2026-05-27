const app = getApp()
const { getApiBaseURL } = require('./utils/apiBaseURL')

Page({
  data: {
    imagePath: '',
    loading: false,
    loadingText: '',
    modelHistory: []
  },

  onLoad() {
    const history = wx.getStorageSync('modelHistory') || []
    this.setData({ modelHistory: history })
  },

  onShow() {
    const history = wx.getStorageSync('modelHistory') || []
    this.setData({ modelHistory: history })
  },

  chooseImage() {
    if (this.data.loading) return

    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          imagePath: res.tempFiles[0].tempFilePath
        })
      }
    })
  },

  async generate3D() {
    if (!this.data.imagePath || this.data.loading) return

    let serverBase
    try {
      serverBase = getApiBaseURL()
    } catch (err) {
      wx.showModal({
        title: '接口未配置',
        content: err.message,
        showCancel: false
      })
      return
    }

    this.setData({ loading: true, loadingText: '正在压缩图片...' })

    try {
      const compressedPath = await this._compressImage(this.data.imagePath, 50)

      this.setData({ loadingText: '正在读取图片...' })
      const fs = wx.getFileSystemManager()
      const imageBase64 = fs.readFileSync(compressedPath, 'base64')

      this.setData({ loadingText: '正在上传图片...（如超时将自动重试）' })

      let genRes
      try {
        genRes = await this._submitGenerate(serverBase, imageBase64)
      } catch (firstErr) {
        console.log('[AI-3D] 首次上传失败，重试中...', firstErr)
        this.setData({ loadingText: '上传超时，正在压缩后重试...' })
        const compressedPath2 = await this._compressImage(this.data.imagePath, 30)
        const imageBase64Retry = fs.readFileSync(compressedPath2, 'base64')
        genRes = await this._submitGenerate(serverBase, imageBase64Retry)
      }

      const taskId = genRes.taskId
      console.log('[AI-3D] 任务已创建:', taskId)

      // 轮询任务状态
      this.setData({ loadingText: 'AI 正在生成 3D 模型...' })
      const result = await this._pollTaskStatus(taskId, serverBase)
      let localGlbPath = ''

      if (result.modelUrl) {
        localGlbPath = await this._downloadModelFile(result.modelUrl)
      } else if (result.fileUrl) {
        localGlbPath = result.fileFormat === 'zip' || this._isZipUrl(result.fileUrl)
          ? await this._downloadAndUnzip(result.fileUrl)
          : await this._downloadModelFile(result.fileUrl)
      }

      if (!localGlbPath) {
        throw new Error('生成完成但模型文件保存失败')
      }

      app.globalData._pendingModelUrl = localGlbPath
      app.globalData._pendingModelName = 'AI 生成模型'
      wx.showToast({ title: '生成成功！', icon: 'success' })
      setTimeout(() => {
        wx.navigateTo({ url: '/pages/model3d-viewer/model3d-viewer' })
      }, 500)
    } catch (err) {
      console.error('[AI-3D] 错误:', err)
      wx.showModal({
        title: '生成失败',
        content: err.message || '未知错误，请重试',
        showCancel: false
      })
    } finally {
      this.setData({ loading: false, loadingText: '' })
    }
  },

  // 每10秒查一次，最多90次（15分钟）
  _pollTaskStatus(taskId, serverBase) {
    return new Promise((resolve, reject) => {
      let attempts = 0
      const maxAttempts = 90
      const pollInterval = 10000

      const poll = () => {
        attempts++

        if (attempts > maxAttempts) {
          reject(new Error('生成超时，请稍后重试'))
          return
        }

        let loadingText = '正在生成3D模型...'
        if (attempts > 60) {
          loadingText = '即将完成，请再等等...'
        } else if (attempts >= 40) {
          loadingText = '模型较复杂，还需要一点时间...'
        } else if (attempts >= 20) {
          loadingText = 'AI正在努力生成中，请耐心等待...'
        }

        this.setData({
          loadingText: loadingText
        })

        wx.request({
          url: serverBase + '/api/task-status?taskId=' + taskId,
          method: 'GET',
          success: (res) => {
            const data = res.data
            console.log('[AI-3D] 任务状态:', data.status, data)

            if (data._debug) {
              console.log('[AI-3D] 返回内容结构:', JSON.stringify(data._debug))
            }

            if (data.status === 'succeeded') {
              if (data.modelUrl) {
                resolve({ modelUrl: data.modelUrl })
              } else if (data.fileUrl) {
                resolve({ fileUrl: data.fileUrl, fileFormat: data.fileFormat })
              } else {
                console.error('[AI-3D] 生成完成但无可用URL，_debug:', data._debug)
                reject(new Error('生成完成但模型URL解析失败，请查看控制台日志'))
              }
            } else if (data.status === 'failed') {
              let errorMsg = 'AI 生成失败'
              if (data.error) {
                if (typeof data.error === 'string') {
                  errorMsg = data.error
                } else if (data.error.message) {
                  errorMsg = data.error.message
                } else {
                  errorMsg = JSON.stringify(data.error)
                }
              }
              reject(new Error(errorMsg))
            } else {
              setTimeout(poll, pollInterval)
            }
          },
          fail: () => {
            setTimeout(poll, pollInterval)
          }
        })
      }

      poll()
    })
  },

  _downloadAndUnzip(fileUrl) {
    const self = this
    return new Promise((resolve, reject) => {
      self.setData({ loadingText: '正在下载模型文件...' })

      const downloadTask = wx.downloadFile({
        url: fileUrl,
        success: (dlRes) => {
          if (dlRes.statusCode !== 200) {
            reject(new Error('下载失败，HTTP ' + dlRes.statusCode))
            return
          }

          const zipPath = dlRes.tempFilePath
          const fs = wx.getFileSystemManager()
          const unzipDir = wx.env.USER_DATA_PATH + '/seed3d_temp'

          self.setData({ loadingText: '正在解压模型...' })

          try {
            fs.accessSync(unzipDir)
            self._removeDir(fs, unzipDir)
          } catch (e) {}

          fs.unzip({
            zipFilePath: zipPath,
            targetPath: unzipDir,
            success: () => {
              try {
                const files = self._listAllFiles(fs, unzipDir)
                console.log('[AI-3D] 解压文件列表:', files)

                const glbFile = files.find(f => f.toLowerCase().endsWith('.glb'))
                if (!glbFile) {
                  reject(new Error('ZIP 中未找到 .glb 模型文件'))
                  return
                }

                console.log('[AI-3D] 找到 GLB 文件:', glbFile)
                const savedModel = self._saveModelToHistory(glbFile, 'AI 生成模型')
                if (!savedModel) {
                  reject(new Error('模型保存失败'))
                  return
                }
                resolve(savedModel.path)
              } catch (err) {
                console.error('[AI-3D] 读取解压目录失败:', err)
                reject(new Error('解压后读取文件失败'))
              }
            },
            fail: (err) => {
              console.error('[AI-3D] 解压失败:', err)
              reject(new Error('ZIP 解压失败'))
            }
          })
        },
        fail: (err) => {
          console.error('[AI-3D] 下载失败:', err)
          reject(new Error('模型文件下载失败，请重试'))
        }
      })

      downloadTask.onProgressUpdate((progress) => {
        const received = (progress.totalBytesWritten / 1048576).toFixed(1)
        const total = (progress.totalBytesExpectedToWrite / 1048576).toFixed(1)
        self.setData({
          loadingText: '正在下载模型 (' + received + 'MB/' + total + 'MB)...'
        })
      })
    })
  },

  _downloadModelFile(fileUrl) {
    const self = this
    return new Promise((resolve, reject) => {
      self.setData({ loadingText: '正在下载模型文件...' })

      const downloadTask = wx.downloadFile({
        url: fileUrl,
        success: (dlRes) => {
          if (dlRes.statusCode !== 200) {
            reject(new Error('下载失败，HTTP ' + dlRes.statusCode))
            return
          }

          const savedModel = self._saveModelToHistory(dlRes.tempFilePath, 'AI 生成模型')
          if (!savedModel) {
            reject(new Error('模型保存失败'))
            return
          }
          resolve(savedModel.path)
        },
        fail: (err) => {
          console.error('[AI-3D] 下载失败:', err)
          reject(new Error('模型文件下载失败，请重试'))
        }
      })

      downloadTask.onProgressUpdate((progress) => {
        const received = (progress.totalBytesWritten / 1048576).toFixed(1)
        const total = progress.totalBytesExpectedToWrite > 0
          ? '/' + (progress.totalBytesExpectedToWrite / 1048576).toFixed(1) + 'MB'
          : ''
        self.setData({
          loadingText: '正在下载模型 (' + received + 'MB' + total + ')...'
        })
      })
    })
  },

  _compressImage(src, quality) {
    return new Promise((resolve) => {
      wx.compressImage({
        src: src,
        quality: quality,
        success: (res) => resolve(res.tempFilePath),
        fail: (err) => {
          console.error('[AI-3D] 图片压缩失败:', err)
          resolve(src)
        }
      })
    })
  },

  _submitGenerate(serverBase, imageBase64) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: serverBase + '/api/generate-3d',
        method: 'POST',
        timeout: 30000,
        header: { 'Content-Type': 'application/json' },
        data: {
          imageUrl: 'data:image/jpeg;base64,' + imageBase64
        },
        success: (res) => {
          if (res.statusCode === 200 && res.data.success) {
            resolve(res.data)
          } else {
            reject(new Error(res.data.error || '提交失败'))
          }
        },
        fail: reject
      })
    })
  },

  _saveModelToHistory(glbSourcePath, modelName) {
    const fs = wx.getFileSystemManager()
    const saveDir = wx.env.USER_DATA_PATH + '/saved_models'

    try { fs.accessSync(saveDir) } catch (e) { fs.mkdirSync(saveDir) }

    const timestamp = Date.now()
    const savePath = saveDir + '/model_' + timestamp + '.glb'

    try {
      fs.copyFileSync(glbSourcePath, savePath)
    } catch (err) {
      console.error('[AI-3D] 保存模型文件失败:', err)
      return null
    }

    let history = wx.getStorageSync('modelHistory') || []
    const record = {
      id: 'model_' + timestamp,
      name: modelName,
      path: savePath,
      timestamp: timestamp,
      time: this._formatTime(new Date())
    }
    history.unshift(record)

    while (history.length > 5) {
      const old = history.pop()
      try { fs.unlinkSync(old.path) } catch (e) {}
    }

    wx.setStorageSync('modelHistory', history)
    this.setData({ modelHistory: history })
    return record
  },

  _isZipUrl(fileUrl) {
    return fileUrl.split('?')[0].toLowerCase().endsWith('.zip')
  },

  _formatTime(date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const h = String(date.getHours()).padStart(2, '0')
    const min = String(date.getMinutes()).padStart(2, '0')
    return y + '-' + m + '-' + d + ' ' + h + ':' + min
  },

  viewHistoryModel(e) {
    const index = e.currentTarget.dataset.index
    const model = this.data.modelHistory[index]
    if (!model) return

    const fs = wx.getFileSystemManager()
    try {
      fs.accessSync(model.path)
    } catch (e) {
      wx.showToast({ title: '模型文件已删除', icon: 'none' })
      let history = this.data.modelHistory
      history.splice(index, 1)
      wx.setStorageSync('modelHistory', history)
      this.setData({ modelHistory: history })
      return
    }

    app.globalData._pendingModelUrl = model.path
    app.globalData._pendingModelName = model.name
    wx.navigateTo({ url: '/pages/model3d-viewer/model3d-viewer' })
  },

  _removeDir(fs, dir) {
    try {
      const entries = fs.readdirSync(dir)
      for (const entry of entries) {
        const fullPath = dir + '/' + entry
        try {
          const stat = fs.statSync(fullPath)
          if (stat.isDirectory()) {
            this._removeDir(fs, fullPath)
          } else {
            fs.unlinkSync(fullPath)
          }
        } catch (e) {
          try { fs.unlinkSync(fullPath) } catch (e2) {}
        }
      }
      fs.rmdirSync(dir)
    } catch (e) {}
  },

  _listAllFiles(fs, dir) {
    let results = []
    const entries = fs.readdirSync(dir)
    for (const entry of entries) {
      const fullPath = dir + '/' + entry
      try {
        const stat = fs.statSync(fullPath)
        if (stat.isDirectory()) {
          results = results.concat(this._listAllFiles(fs, fullPath))
        } else {
          results.push(fullPath)
        }
      } catch (e) {
        results.push(fullPath)
      }
    }
    return results
  }
})
