const RESOURCE_BASE_URL = 'https://model-server-rosy.vercel.app/knowledge/';

function buildAssetUrl(filename) {
  return RESOURCE_BASE_URL + encodeURIComponent(filename);
}

Page({
  data: {
    currentPage: 0,
    musicPlaying: false,
    musicTriggered: false,
    showDetail: false,
    detailData: {},
    navDots: [0, 1, 2, 3],
    heroVideoUrl: buildAssetUrl('nianhua-story.mp4'),
    timelineItems: [
      {
        era: '清 · 乾隆年间',
        title: '木版年画的黄金时代',
        brief: '木版年画的黄金时代',
        content: '佛山木版年画兴于明代永乐年间，盛于清代乾嘉时期。鼎盛时期，佛山经营年画的店铺多达200多家，从业者数千人。',
        image: buildAssetUrl('佛山木版年画1.jpg')
      },
      {
        era: '民国 · 变革时期',
        title: '传统与现代的碰撞',
        brief: '传统与现代的碰撞',
        content: '受机器印刷冲击，传统木版年画逐渐衰落。但其独特的岭南风格始终是民间文化的瑰宝。',
        image: buildAssetUrl('佛山木版年画2.jpg')
      },
      {
        era: '当代 · 非遗传承',
        title: '刀木之间的坚守',
        brief: '刀木之间的坚守',
        content: '2006年，佛山木版年画入选首批国家级非物质文化遗产名录。',
        image: buildAssetUrl('佛山木版年画3.jpg')
      },
      {
        era: '未来 · 数字新生',
        title: '当AI遇见年画',
        brief: '当AI遇见年画 →',
        content: '用3D建模、AI生成、交互动画等数字技术，让年画从纸面走进屏幕。',
        image: '',
        highlight: true
      }
    ],
    previewImages: [
      buildAssetUrl('佛山木版年画1.jpg'),
      buildAssetUrl('佛山木版年画2.jpg'),
      buildAssetUrl('佛山木版年画3.jpg'),
      buildAssetUrl('佛山木版年画4.jpg'),
      buildAssetUrl('佛山木版年画5.png'),
      buildAssetUrl('佛山木版年画6.png'),
      buildAssetUrl('佛山木版年画7.png')
    ]
  },

  onLoad() {
    this.initMusic();
  },

  onUnload() {
    if (this.bgMusic) {
      this.bgMusic.destroy();
      this.bgMusic = null;
    }
  },

  initMusic() {
    this.bgMusic = wx.createInnerAudioContext();
    this.bgMusic.src = buildAssetUrl('nianhua-story.mp4');
    this.bgMusic.loop = true;
    this.bgMusic.volume = 0.3;
    this.bgMusic.onPause(() => {
      if (this.data.musicPlaying) {
        this.setData({ musicPlaying: false });
      }
    });
    this.bgMusic.onStop(() => {
      if (this.data.musicPlaying) {
        this.setData({ musicPlaying: false });
      }
    });
    this.bgMusic.onError((err) => {
      console.error('[Home] 背景音乐播放失败:', err);
      this.setData({ musicPlaying: false });
    });
  },

  onSwiperChange(e) {
    const currentPage = e.detail.current;
    this.setData({ currentPage });

    if (!this.data.musicPlaying && !this.data.musicTriggered) {
      this.startMusic();
    }
  },

  goToPage(e) {
    const currentPage = parseInt(e.currentTarget.dataset.page, 10);
    this.setData({ currentPage });
  },

  toggleMusic() {
    if (!this.bgMusic) {
      this.initMusic();
    }

    if (this.data.musicPlaying) {
      this.bgMusic.pause();
      this.setData({ musicPlaying: false });
      return;
    }

    this.startMusic();
  },

  startMusic() {
    if (!this.bgMusic) {
      this.initMusic();
    }

    this.bgMusic.play();
    this.setData({
      musicPlaying: true,
      musicTriggered: true
    });
  },

  showTimelineDetail(e) {
    const index = Number(e.currentTarget.dataset.index);
    if (index === 3) {
      this.goToCreate();
      return;
    }

    this.setData({
      showDetail: true,
      detailData: this.data.timelineItems[index]
    });
  },

  closeDetail() {
    this.setData({ showDetail: false });
  },

  noop() {},

  goTo3D() {
    wx.navigateTo({
      url: '/pages/index/index'
    });
  },

  goTo2D() {
    wx.navigateTo({
      url: '/pages/gallery/gallery',
      fail: () => {
        wx.navigateTo({
          url: '/pages/index/index'
        });
      }
    });
  },

  goToImmersiveGallery() {
    this.goTo3D();
  },

  goToClassicGallery() {
    this.goTo2D();
  },

  goToCreate() {
    wx.navigateTo({
      url: '/pages/create/create'
    });
  }
});
