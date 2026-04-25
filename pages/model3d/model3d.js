const app = getApp()

Page({
  data: {
    models: []
  },

  onLoad() {
    const base = app.globalData.serverBase
    this.setData({
      models: [
        {
          id: 1,
          name: '酸面包雕版',
          desc: '3D 扫描模型展示',
          cover: '/images/model_cover_1.png',
          modelUrl: base + '/models/bread.glb',
          gradient: 'gradient-warm',
          coverError: false
        },
        {
          id: 2,
          name: '门神像',
          desc: '经典佛山门神年画立体复原',
          cover: '/images/model_cover_2.png',
          modelUrl: '',
          gradient: 'gradient-blue',
          coverError: false
        },
        {
          id: 3,
          name: '福禄寿',
          desc: '福禄寿三星年画 3D 场景',
          cover: '/images/model_cover_3.png',
          modelUrl: base + '/models/fulushou.glb',
          gradient: 'gradient-green',
          coverError: false
        }
      ]
    })
  },

  goAI3D() {
    wx.navigateTo({ url: '/pages/ai-3d/ai-3d' })
  },

  openViewer(e) {
    const index = e.currentTarget.dataset.index
    const model = this.data.models[index]

    if (!model.modelUrl) {
      wx.showToast({ title: '模型暂未上传', icon: 'none' })
      return
    }

    app.globalData._pendingModelUrl = model.modelUrl
    app.globalData._pendingModelName = model.name

    wx.navigateTo({ url: '/pages/model3d-viewer/model3d-viewer' })
  },

  onCoverError(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ ['models[' + index + '].coverError']: true })
  }
})
