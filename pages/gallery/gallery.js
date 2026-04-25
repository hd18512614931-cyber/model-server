Page({
  data: {
    models: [
      { name: '面包', file: 'bread.glb', emoji: '🍞', color: '#FFE4B5' },
      { name: '房屋', file: 'house.glb', emoji: '🏠', color: '#87CEEB' },
      { name: '棋子', file: 'chman.glb', emoji: '♟️', color: '#DDA0DD' },
      { name: '年画模型', file: 'mesh.glb', emoji: '🎨', color: '#FFB6C1' }
    ]
  },

  onModelTap(e) {
    const item = e.currentTarget.dataset.item;
    wx.navigateTo({
      url: '/pages/model3d-viewer/model3d-viewer?url=' + encodeURIComponent('https://model-server-rosy.vercel.app/models/' + item.file) + '&name=' + encodeURIComponent(item.name)
    });
  }
});
