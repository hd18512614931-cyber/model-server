const BASE_URL = 'https://model-server-rosy.vercel.app/knowledge/';

const ERA_DATA = [
  {
    year: '1736',
    title: '木版年画的黄金时代',
    desc: '佛山木版年画兴于明代永乐年间，至清代乾嘉时期达到鼎盛。彼时佛山与天津杨柳青、苏州桃花坞、山东潍坊并称中国四大年画产地。\n\n鼎盛时期，佛山经营年画的店铺多达两百余家，从业者数千人。年画题材涵盖门神、福禄寿全、戏曲故事、神话传说，以红丹、绿、黄、黑四色套印为特色，形成了浓烈喜庆的岭南风格。\n\n佛山年画的独特之处在于"万年红"底色——用红丹（铅丹）作底，经久不褪，寓意吉祥长久。这一工艺在全国年画中独树一帜。',
    image: BASE_URL + 'baxian.jpg',
    images: [
      BASE_URL + 'baxian.jpg',
      BASE_URL + 'coloring-closeup.jpg'
    ],
    hasVideo: false,
    isLast: false
  },
  {
    year: '1912',
    title: '传统与现代的碰撞',
    desc: '民国时期，石印和胶版印刷技术传入中国，传统木版年画受到巨大冲击。佛山年画作坊从鼎盛时期的两百余家骤减至不足十家。\n\n然而，佛山年画的精髓并未消亡。其粗犷有力的刀法、浓烈饱满的色彩、吉祥美好的寓意，始终扎根于岭南民间文化的土壤中。每逢春节，家家户户仍要贴上一对门神，祈求新年平安。\n\n这一时期，部分年画艺人开始尝试将传统题材与时事结合，创作出反映社会变革的新式年画，展现了传统艺术的生命力与适应性。',
    image: BASE_URL + 'carving-detail.jpg',
    images: [
      BASE_URL + 'carving-detail.jpg',
      BASE_URL + 'light-on-woodblock.jpg'
    ],
    hasVideo: false,
    isLast: false
  },
  {
    year: '2006',
    title: '刀木之间的坚守',
    desc: '2006年，佛山木版年画入选首批国家级非物质文化遗产名录，标志着这项古老技艺获得了国家层面的认可与保护。\n\n一幅传统木版年画的诞生，需要经历雕版、调色、套印、开相（手绘面部）等数十道工序。雕版用的是棠梨木，刀具有十余种之多，每一刀都需要数十年功力的沉淀。\n\n如今，老一辈传承人仍在坚持手工技艺。冯炳棠、冯锦强父子是其中的代表——父亲守护传统，儿子探索创新，让年画在新时代找到新的表达方式。',
    image: BASE_URL + 'woodblock-and-print.jpg',
    images: [
      BASE_URL + 'woodblock-and-print.jpg',
      BASE_URL + 'drying-prints.jpg'
    ],
    hasVideo: true,
    isLast: false
  },
  {
    year: '2025',
    title: '当AI遇见年画',
    desc: '当三百年的刀木技艺遇上人工智能，会碰撞出怎样的火花？\n\n我们用3D建模重构年画的空间维度，用AI图像生成探索年画的无限可能，用交互动画让年画从纸面走进屏幕。\n\n这不是对传统的替代，而是一次跨越时空的对话。每一个AI生成的年画，都携带着三百年木版技艺的基因密码。\n\n传统不是用来封存的，而是用来重新想象的。',
    image: BASE_URL + 'swordsman-woodblock.jpg',
    images: [
      BASE_URL + 'swordsman-woodblock.jpg'
    ],
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
    eraDetail: {},
    previewImages: [
      BASE_URL + 'baxian.jpg',
      BASE_URL + 'swordsman-woodblock.jpg',
      BASE_URL + 'woodblock-and-print.jpg',
      BASE_URL + 'drying-prints.jpg',
      BASE_URL + 'coloring-closeup.jpg'
    ]
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

  previewImage(e) {
    const src = e.currentTarget.dataset.src;
    const urls = e.currentTarget.dataset.urls;
    wx.previewImage({
      current: src,
      urls: urls
    });
  },

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
