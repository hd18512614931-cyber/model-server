const RESOURCE_BASE_URL = 'https://model-server-rosy.vercel.app/knowledge/';

function buildAssetUrl(filename) {
  return RESOURCE_BASE_URL + encodeURIComponent(filename);
}

Page({
  data: {
    heroReady: false,
    currentPage: 0,
    musicPlaying: false,
    musicTriggered: false,
    visiblePages: [true, false, false, false],
    navDots: [0, 1, 2, 3],
    heroVideoUrl: buildAssetUrl('nianhua-story.mp4'),
    timelineItems: [
      {
        era: '清 · 乾隆年间',
        title: '木版年画的黄金时代',
        desc: '佛山木版年画兴于明代永乐年间，盛于清代乾嘉时期。鼎盛时期，佛山经营年画的店铺多达200多家，从业者数千人。',
        image: buildAssetUrl('佛山木版年画1.jpg')
      },
      {
        era: '民国 · 变革时期',
        title: '传统与现代的碰撞',
        desc: '受机器印刷冲击，传统木版年画逐渐衰落。但其独特的岭南风格——粗犷的线条、浓烈的色彩、吉祥的寓意——始终是民间文化的瑰宝。',
        image: buildAssetUrl('佛山木版年画2.jpg')
      },
      {
        era: '当代 · 非遗传承',
        title: '刀木之间的坚守',
        desc: '2006年，佛山木版年画入选首批国家级非物质文化遗产名录。老一辈传承人仍在坚持手工雕版、套色印刷的古法技艺。',
        image: buildAssetUrl('佛山木版年画3.jpg'),
        videoUrl: buildAssetUrl('nianhua-making.mp4')
      },
      {
        era: '未来 · 数字新生',
        title: '当AI遇见年画',
        desc: '我们用3D建模、AI生成、交互动画等数字技术，让年画从纸面走进屏幕。传统不是用来封存的，而是用来重新想象的。',
        highlight: true,
        cta: true
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
    this.heroTimer = setTimeout(() => {
      this.setData({ heroReady: true });
    }, 350);
  },

  onReady() {
    this.initPageObservers();
  },

  onUnload() {
    if (this.heroTimer) {
      clearTimeout(this.heroTimer);
      this.heroTimer = null;
    }

    if (this.pageObservers) {
      this.pageObservers.forEach((observer) => observer.disconnect());
      this.pageObservers = null;
    }

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

  initPageObservers() {
    if (!this.createIntersectionObserver) return;

    this.pageObservers = this.data.navDots.map((page) => {
      const observer = this.createIntersectionObserver({
        thresholds: [0, 0.2, 0.5, 1]
      });

      observer.relativeToViewport().observe('#section-' + page, (res) => {
        if (res.intersectionRatio >= 0.2) {
          this.markPageVisible(page);
        }
      });

      return observer;
    });
  },

  markPageVisible(page) {
    if (this.data.visiblePages[page]) return;
    this.setData({
      ['visiblePages[' + page + ']']: true
    });
  },

  onSwiperChange(e) {
    const currentPage = e.detail.current;
    this.setData({ currentPage });
    this.markPageVisible(currentPage);

    if (!this.data.musicPlaying && !this.data.musicTriggered) {
      this.startMusic();
    }
  },

  goToPage(e) {
    const currentPage = parseInt(e.currentTarget.dataset.page, 10);
    this.setData({ currentPage });
    this.markPageVisible(currentPage);
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

  goToImmersiveGallery() {
    wx.navigateTo({
      url: '/pages/index/index'
    });
  },

  goToClassicGallery() {
    wx.navigateTo({
      url: '/pages/gallery/gallery',
      fail: () => {
        wx.navigateTo({
          url: '/pages/index/index'
        });
      }
    });
  },

  goToCreate() {
    wx.navigateTo({
      url: '/pages/create/create'
    });
  }
});
