const BASE_URL = 'https://model-server-rosy.vercel.app/knowledge/';

const ERA_DATA = [
  {
    year: '1736',
    title: '木版年画的黄金时代',
    desc: '佛山木版年画兴于明代永乐年间，盛于清代乾嘉时期。鼎盛时期，佛山经营年画的店铺多达两百余家，从业者数千人。年画题材涵盖门神、福禄寿全、戏曲故事，以红丹、绿、黄、黑四色套印为特色，形成了浓烈而喜庆的岭南风格。',
    image: BASE_URL + 'baxian.jpg',
    hasVideo: false,
    isLast: false
  },
  {
    year: '1912',
    title: '传统与现代的碰撞',
    desc: '民国时期，石印和胶版印刷技术传入中国，传统木版年画受到巨大冲击。佛山年画作坊从鼎盛时期的两百余家骤减至不足十家。然而，其粗犷的刀法、浓烈的色彩、吉祥的寓意，始终扎根于岭南民间。',
    image: BASE_URL + 'carving-detail.jpg',
    hasVideo: false,
    isLast: false
  },
  {
    year: '2006',
    title: '刀木之间的坚守',
    desc: '佛山木版年画入选首批国家级非物质文化遗产名录。老一辈传承人仍在坚持手工雕版、调色、套印的古法技艺。每一刀、每一色，都是对三百年手艺的敬畏。',
    image: BASE_URL + 'woodblock-and-print.jpg',
    hasVideo: true,
    isLast: false
  },
  {
    year: '2025',
    title: '当AI遇见年画',
    desc: '我们用3D建模、AI图像生成、交互动画等数字技术，让年画从纸面走进屏幕。传统不是用来封存的，而是用来重新想象的。',
    image: '',
    hasVideo: false,
    isLast: true
  }
];

Page({
  data: {
    currentPage: 0,
    musicPlaying: false,
    musicTriggered: false,
    currentEra: -1,
    showEraDetail: false,
    eraDetail: {}
  },

  onLoad() {
    this.bgMusic = wx.createInnerAudioContext();
    this.bgMusic.src = BASE_URL + 'nianhua-story.mp4';
    this.bgMusic.loop = true;
    this.bgMusic.volume = 0.25;
  },

  onUnload() {
    if (this.bgMusic) {
      this.bgMusic.destroy();
      this.bgMusic = null;
    }
  },

  onSwiperChange(e) {
    const page = e.detail.current;
    this.setData({ currentPage: page });

    if (!this.data.musicTriggered) {
      this.bgMusic.play();
      this.setData({ musicPlaying: true, musicTriggered: true });
    }
  },

  goToPage(e) {
    const page = parseInt(e.currentTarget.dataset.page, 10);
    this.setData({ currentPage: page });
  },

  toggleMusic() {
    if (this.data.musicPlaying) {
      this.bgMusic.pause();
      this.setData({ musicPlaying: false });
      return;
    }

    this.bgMusic.play();
    this.setData({ musicPlaying: true, musicTriggered: true });
  },

  onEraTap(e) {
    const index = parseInt(e.currentTarget.dataset.index, 10);
    this.setData({
      currentEra: index,
      showEraDetail: true,
      eraDetail: ERA_DATA[index]
    });
  },

  closeEraDetail() {
    this.setData({
      showEraDetail: false,
      currentEra: -1
    });
  },

  noop() {},

  goTo3D() {
    wx.navigateTo({ url: '/pages/index/index' });
  },

  goTo2D() {
    wx.navigateTo({ url: '/pages/gallery/gallery' });
  },

  goToCreate() {
    wx.navigateTo({ url: '/pages/create/create' });
  }
});
