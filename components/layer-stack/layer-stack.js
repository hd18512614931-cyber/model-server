Component({
  properties: {
    layers: {
      type: Array,
      value: []
    },
    width: {
      type: Number,
      value: 300
    },
    height: {
      type: Number,
      value: 400
    }
  },
  data: {
    // 内部状态
    lastUpdated: 0
  },
  observers: {
    'layers': function(newLayers) {
      // 监听 layers 变化
      if (newLayers && newLayers.length) {
        this.setData({
          lastUpdated: Date.now()
        });
      }
    }
  },
  methods: {
    onLayerTap(e) {
      const item = e.currentTarget.dataset.item;
      const index = e.currentTarget.dataset.index;
      // 点击图层触发事件，通知父组件
      this.triggerEvent('layertap', { 
        layer: item,
        index: index,
        allLayers: this.data.layers 
      });
    }
  }
})
