const { IMAGES, VIDEOS } = require('../../constants/cloudAssets');
const { resolveCloudURL } = require('../../utils/resolveCloudURL');

const ERA_DATA = [
  {
    year: '1736',
    title: '木版年画的黄金时代',
    desc: '佛山木版年画兴于明代永乐年间，至清代乾嘉时期达到鼎盛。彼时佛山与天津杨柳青、苏州桃花坞、山东潍坊并称中国四大年画产地。\n\n鼎盛时期，佛山经营年画的店铺多达两百余家，从业者数千人。年画题材涵盖门神、福禄寿全、戏曲故事、神话传说，以红丹、绿、黄、黑四色套印为特色，形成了浓烈喜庆的岭南风格。\n\n佛山年画的独特之处在于"万年红"底色——用红丹（铅丹）作底，经久不褪，寓意吉祥长久。这一工艺在全国年画中独树一帜。',
    image: IMAGES.baxian,
    images: [
      IMAGES.baxian,
      IMAGES.coloringCloseup
    ],
    hasVideo: false,
    isLast: false
  },
  {
    year: '1912',
    title: '传统与现代的碰撞',
    desc: '民国时期，石印和胶版印刷技术传入中国，传统木版年画受到巨大冲击。佛山年画作坊从鼎盛时期的两百余家骤减至不足十家。\n\n然而，佛山年画的精髓并未消亡。其粗犷有力的刀法、浓烈饱满的色彩、吉祥美好的寓意，始终扎根于岭南民间文化的土壤中。每逢春节，家家户户仍要贴上一对门神，祈求新年平安。\n\n这一时期，部分年画艺人开始尝试将传统题材与时事结合，创作出反映社会变革的新式年画，展现了传统艺术的生命力与适应性。',
    image: IMAGES.carvingHD,
    images: [
      IMAGES.carvingHD,
      IMAGES.lightOnBoard
    ],
    hasVideo: false,
    isLast: false
  },
  {
    year: '2006',
    title: '刀木之间的坚守',
    desc: '2006年，佛山木版年画入选首批国家级非物质文化遗产名录，标志着这项古老技艺获得了国家层面的认可与保护。\n\n一幅传统木版年画的诞生，需要经历雕版、调色、套印、开相（手绘面部）等数十道工序。雕版用的是棠梨木，刀具有十余种之多，每一刀都需要数十年功力的沉淀。\n\n如今，老一辈传承人仍在坚持手工技艺。冯炳棠、冯锦强父子是其中的代表——父亲守护传统，儿子探索创新，让年画在新时代找到新的表达方式。',
    image: IMAGES.boardDisplay,
    images: [
      IMAGES.boardDisplay,
      IMAGES.drying
    ],
    hasVideo: true,
    isLast: false
  },
  {
    year: '2025',
    title: '当AI遇见年画',
    desc: '当三百年的刀木技艺遇上人工智能，会碰撞出怎样的火花？\n\n我们用3D建模重构年画的空间维度，用AI图像生成探索年画的无限可能，用交互动画让年画从纸面走进屏幕。\n\n这不是对传统的替代，而是一次跨越时空的对话。每一个AI生成的年画，都携带着三百年木版技艺的基因密码。\n\n传统不是用来封存的，而是用来重新想象的。',
    image: IMAGES.swordDanceFront,
    images: [
      IMAGES.swordDanceFront
    ],
    hasVideo: false,
    isLast: true
  }
];

Page({
  data: {
    IMAGES,
    VIDEOS,
    currentPage: 0,
    musicPlaying: false,
    musicTriggered: false,
    currentEra: -1,
    showEraDetail: false,
    eraDetail: {},
    previewImages: [
      IMAGES.baxian,
      IMAGES.swordDanceFront,
      IMAGES.boardDisplay,
      IMAGES.drying,
      IMAGES.coloringCloseup
    ],
    colors: [
      {
        name: '黑', color: '#1a1a1a', textColor: '#fff', order: 1,
        material: '松烟墨', meaning: '轮廓骨架',
        desc: '黑色墨线版最先印刷，勾勒出年画的骨架轮廓，是整幅画的基础。'
      },
      {
        name: '红', color: '#D42F2F', textColor: '#fff', order: 2,
        material: '红丹（铅丹）', meaning: '喜庆吉祥',
        desc: '佛山年画标志性的"万年红"，用红丹作底，经久不褪，是佛山年画区别于其他产地的重要特征。'
      },
      {
        name: '黄', color: '#F2C94C', textColor: '#000', order: 3,
        material: '石黄/藤黄', meaning: '富贵尊荣',
        desc: '黄色多用于人物服饰、器物装饰，增添华贵之感。'
      },
      {
        name: '绿', color: '#2D8B46', textColor: '#fff', order: 4,
        material: '石绿', meaning: '生机盎然',
        desc: '绿色用于树木花草、部分服饰，为画面增添生气。'
      },
      {
        name: '蓝', color: '#2D5DA1', textColor: '#fff', order: 5,
        material: '靛蓝', meaning: '沉稳庄重',
        desc: '蓝色多用于天空、水面、深色服饰，使画面层次更加丰富。'
      }
    ],
    activeColor: -1,
    isAnimating: false,
    animatingIndex: -1,
    cards: [
      {
        title: '门神·秦叔宝',
        category: '门神类',
        image: IMAGES.swordDanceFront,
        desc: '手持双锏的秦琼，与尉迟恭成对张贴于大门两侧，是佛山年画最经典的题材。',
        flipped: false
      },
      {
        title: '八仙贺寿',
        category: '吉庆类',
        image: IMAGES.baxian,
        desc: '八位仙人各持法器前来祝寿，寓意福寿绵长、吉祥如意。',
        flipped: false
      },
      {
        title: '雕版印痕',
        category: '工艺类',
        image: IMAGES.boardDisplay,
        desc: '一块梨木雕版可印制数千张年画，刀痕之间藏着匠人数十年的功力。',
        flipped: false
      },
      {
        title: '晾干成画',
        category: '工序类',
        image: IMAGES.drying,
        desc: '套色完成后，年画需要自然晾干。色彩在空气中慢慢沉淀，最终呈现出浓郁的质感。',
        flipped: false
      }
    ],
    quiz: [
      {
        question: '五色套印最先印哪种颜色？',
        options: ['红色', '黑色', '黄色', '绿色'],
        answer: 1,
        explanation: '黑色墨线版最先印，勾勒轮廓，是画的骨架。'
      },
      {
        question: '入选国家级非遗是哪年？',
        options: ['2003', '2006', '2008', '2010'],
        answer: 1,
        explanation: '2006年入选首批国家级非物质文化遗产名录。'
      },
      {
        question: '雕版最常用什么木材？',
        options: ['松木', '梨木或枣木', '竹子', '樟木'],
        answer: 1,
        explanation: '梨木枣木质硬细腻纹理均匀，最适合精细雕刻。'
      }
    ],
    currentQuestion: 0,
    quizScore: 0,
    quizFinished: false,
    selectedOption: -1,
    showExplanation: false
  },

  onLoad() {
    this.bgMusic = wx.createInnerAudioContext();
    this.bgMusic.src = VIDEOS.story;
    resolveCloudURL(VIDEOS.story).then((url) => {
      if (this.bgMusic) {
        this.bgMusic.src = url;
      }
    }).catch((err) => {
      console.error('[首页] 背景音频临时链接获取失败:', err);
    });
    this.bgMusic.loop = true;
    this.bgMusic.volume = 0.25;
  },

  onUnload() {
    this.clearColorSequenceTimer();

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

  async previewImage(e) {
    const src = e.currentTarget.dataset.src;
    const urls = e.currentTarget.dataset.urls || this.data.previewImages;

    try {
      const previewUrls = await Promise.all(urls.map((url) => (
        url && url.startsWith('cloud://') ? resolveCloudURL(url) : url
      )));
      const currentIndex = urls.indexOf(src);
      wx.previewImage({
        current: previewUrls[currentIndex >= 0 ? currentIndex : 0],
        urls: previewUrls
      });
    } catch (err) {
      console.error('[首页] 图片预览临时链接获取失败:', err);
      wx.showToast({ title: '图片预览失败', icon: 'none' });
    }
  },

  selectColor(e) {
    const index = e.currentTarget.dataset.index;

    if (this.data.isAnimating) {
      return;
    }

    this.setData({
      activeColor: this.data.activeColor === index ? -1 : index
    });
  },

  playColorSequence() {
    if (this.data.isAnimating) {
      return;
    }

    this.clearColorSequenceTimer();
    this.setData({
      isAnimating: true,
      animatingIndex: 0,
      activeColor: -1
    });

    this.colorSequenceTimer = setInterval(() => {
      const nextIndex = this.data.animatingIndex + 1;

      if (nextIndex >= this.data.colors.length) {
        clearInterval(this.colorSequenceTimer);
        this.colorSequenceTimer = null;
        this.colorSequenceEndTimer = setTimeout(() => {
          this.setData({
            isAnimating: false,
            animatingIndex: -1
          });
          this.colorSequenceEndTimer = null;
        }, 500);
        return;
      }

      this.setData({
        animatingIndex: nextIndex
      });
    }, 1000);
  },

  clearColorSequenceTimer() {
    if (this.colorSequenceTimer) {
      clearInterval(this.colorSequenceTimer);
      this.colorSequenceTimer = null;
    }

    if (this.colorSequenceEndTimer) {
      clearTimeout(this.colorSequenceEndTimer);
      this.colorSequenceEndTimer = null;
    }
  },

  flipCard(e) {
    const index = e.currentTarget.dataset.index;
    const path = 'cards[' + index + '].flipped';
    this.setData({
      [path]: !this.data.cards[index].flipped
    });
  },

  selectQuizOption(e) {
    if (this.data.showExplanation) {
      return;
    }

    const optionIndex = e.currentTarget.dataset.index;
    const currentQuestion = this.data.currentQuestion;
    const isCorrect = optionIndex === this.data.quiz[currentQuestion].answer;

    this.setData({
      selectedOption: optionIndex,
      showExplanation: true,
      quizScore: isCorrect ? this.data.quizScore + 1 : this.data.quizScore
    });

    setTimeout(() => {
      if (this.data.currentQuestion < this.data.quiz.length - 1) {
        this.setData({
          currentQuestion: this.data.currentQuestion + 1,
          selectedOption: -1,
          showExplanation: false
        });
      } else {
        this.setData({
          quizFinished: true
        });
      }
    }, 2000);
  },

  resetQuiz() {
    this.setData({
      currentQuestion: 0,
      quizScore: 0,
      quizFinished: false,
      selectedOption: -1,
      showExplanation: false
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
