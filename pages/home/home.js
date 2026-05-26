const { IMAGES, VIDEOS, LAYERS } = require('../../constants/cloudAssets');
const { resolveCloudURL } = require('../../utils/resolveCloudURL');

const ERA_DATA = [
  {
    year: '1736',
    title: '木版年画的黄金时代',
    desc: '佛山木版年画兴于明代永乐年间，至清代乾嘉时期达到鼎盛。彼时佛山与天津杨柳青、苏州桃花坞、山东潍坊并称中国四大年画产地。\n\n鼎盛时期，佛山经营年画的店铺多达两百余家，从业者数千人。年画题材涵盖门神、福禄寿全、戏曲故事、神话传说，以红丹、绿、黄、黑四色套印为特色，形成了浓烈喜庆的岭南风格。\n\n佛山年画的独特之处在于"万年红"底色——用红丹（铅丹）作底，经久不褪，寓意吉祥长久。这一工艺在全国年画中独树一帜。',
    image: IMAGES.baxian,
    images: [IMAGES.baxian, IMAGES.coloringCloseup],
    hasVideo: false,
    isLast: false
  },
  {
    year: '1912',
    title: '传统与现代的碰撞',
    desc: '民国时期，石印和胶版印刷技术传入中国，传统木版年画受到巨大冲击。佛山年画作坊从鼎盛时期的两百余家骤减至不足十家。\n\n然而，佛山年画的精髓并未消亡。其粗犷有力的刀法、浓烈饱满的色彩、吉祥美好的寓意，始终扎根于岭南民间文化的土壤中。每逢春节，家家户户仍要贴上一对门神，祈求新年平安。\n\n这一时期，部分年画艺人开始尝试将传统题材与时事结合，创作出反映社会变革的新式年画，展现了传统艺术的生命力与适应性。',
    image: IMAGES.carvingHD,
    images: [IMAGES.carvingHD, IMAGES.lightOnBoard],
    hasVideo: false,
    isLast: false
  },
  {
    year: '2006',
    title: '刀木之间的坚守',
    desc: '2006年，佛山木版年画入选首批国家级非物质文化遗产名录，标志着这项古老技艺获得了国家层面的认可与保护。\n\n一幅传统木版年画的诞生，需要经历雕版、调色、套印、开相（手绘面部）等数十道工序。雕版用的是棠梨木，刀具有十余种之多，每一刀都需要数十年功力的沉淀。\n\n如今，老一辈传承人仍在坚持手工技艺。冯炳棠、冯锦强父子是其中的代表——父亲守护传统，儿子探索创新，让年画在新时代找到新的表达方式。',
    image: IMAGES.boardDisplay,
    images: [IMAGES.boardDisplay, IMAGES.drying],
    hasVideo: true,
    isLast: false
  },
  {
    year: '2025',
    title: '当AI遇见年画',
    desc: '当三百年的刀木技艺遇上人工智能，会碰撞出怎样的火花？\n\n我们用3D建模重构年画的空间维度，用AI图像生成探索年画的无限可能，用交互动画让年画从纸面走进屏幕。\n\n这不是对传统的替代，而是一次跨越时空的对话。每一个AI生成的年画，都携带着三百年木版技艺的基因密码。\n\n传统不是用来封存的，而是用来重新想象的。',
    image: IMAGES.swordDanceFront,
    images: [IMAGES.swordDanceFront],
    hasVideo: false,
    isLast: true
  }
];

const LOGO_PRINT_STEPS = [
  {
    name: '墨线起稿',
    shortName: '黑',
    color: '#1a1a1a',
    textColor: '#ffffff',
    order: 1,
    material: '松烟墨',
    meaning: '定轮廓',
    desc: '先落黑线，像雕版的骨架，把图案的边界和节奏定住。',
    layers: [LAYERS.logoDemoCleanBlack]
  },
  {
    name: '万年红',
    shortName: '红',
    color: '#D42F2F',
    textColor: '#ffffff',
    order: 2,
    material: '红丹色',
    meaning: '铺喜气',
    desc: '红版只保留红色底面和衣甲色块，不再混入底部黄色文字。',
    layers: [LAYERS.logoDemoCleanRed]
  },
  {
    name: '石黄提亮',
    shortName: '黄',
    color: '#F2C94C',
    textColor: '#000000',
    order: 3,
    material: '石黄/藤黄',
    meaning: '提光泽',
    desc: '浅黄色负责面部、装饰和明亮色面，让画面从红底里跳出来。',
    layers: [LAYERS.logoDemoCleanYellow]
  },
  {
    name: '赭黄压色',
    shortName: '深黄',
    color: '#B0742E',
    textColor: '#ffffff',
    order: 4,
    material: '赭黄/木色',
    meaning: '补厚度',
    desc: '这张图没有绿色版，第四版改为深黄色，承接文字、边框和木纹的厚重色。',
    layers: [LAYERS.logoDemoCleanDeepYellow]
  },
  {
    name: '靛青收版',
    shortName: '蓝',
    color: '#2D5DA1',
    textColor: '#ffffff',
    order: 5,
    material: '靛蓝',
    meaning: '压层次',
    desc: '蓝版只保留蓝色与青蓝色块，黑色线稿已经分回墨线版。',
    layers: [LAYERS.logoDemoCleanBlue]
  }
];

const CRAFT_STEPS = [
  {
    num: '壹',
    short: '起稿',
    title: '起稿定样',
    tool: '毛笔、宣纸、墨汁',
    image: IMAGES.lightOnBoard,
    desc: '画工先在宣纸上用墨线勾勒出图案轮廓，称为"粉本"。这是整个年画的基础，决定了最终成品的构图与神韵。',
    tip: '起稿讲究"意在笔先"，画工心中需先有成品的完整画面。'
  },
  {
    num: '贰',
    short: '刻版',
    title: '梨木刻版',
    tool: '棠梨木、刻刀十余种',
    image: IMAGES.carvingHD,
    desc: '将画稿反贴在棠梨木上，用拳刀、弯刀、三角刀等十余种刻刀，沿墨线雕刻。刻版是年画技艺中最考验功力的一环。',
    tip: '一块好的雕版可以印刷数千张而不变形，这取决于木材的选择和刀法的深浅。'
  },
  {
    num: '叁',
    short: '套印',
    title: '五色套印',
    tool: '雕版、棕刷、宣纸',
    image: IMAGES.coloringCloseup,
    desc: '按"墨线→红丹→石黄→赭黄→靛青"的顺序逐层套印。每印一色需等前色半干，方能保证色层分明而不混色。',
    tip: '套印时最忌"跑版"——前后两版对位稍有偏差，整幅画就废了。'
  },
  {
    num: '肆',
    short: '开相',
    title: '手绘开相',
    tool: '细笔、矿物颜料',
    image: IMAGES.boardDisplay,
    desc: '套印完成后，人物面部仍是一片空白。画工需用细笔逐张手绘眉眼、胡须和表情，称为"开相"。这一步赋予年画以灵魂。',
    tip: '开相师傅往往只画面部，一双手的功夫决定了人物的神韵。'
  },
  {
    num: '伍',
    short: '成画',
    title: '晾干成画',
    tool: '竹架、自然通风',
    image: IMAGES.drying,
    desc: '完成的年画需平铺或悬挂在竹架上自然晾干。色彩在空气中慢慢沉淀，纸张逐渐平整，最终呈现出浓郁厚重的传统质感。',
    tip: '佛山气候湿热，年画多在秋冬干燥时节制作，这是天时与手艺的配合。'
  }
];

const CHAPTERS = [
  { id: '启', name: '入门', subtitle: '佛山木版年画', volume: '卷一' },
  { id: '史', name: '溯源', subtitle: '三百年刀木薪传', volume: '卷二' },
  { id: '具', name: '器具', subtitle: '刀木之间的精度', volume: '卷三' },
  { id: '技', name: '工艺', subtitle: '一版年画的诞生', volume: '卷四' },
  { id: '色', name: '套印', subtitle: '五色叠印的秩序', volume: '卷五' },
  { id: '典', name: '图鉴', subtitle: '经典年画卡牌', volume: '卷六' },
  { id: '考', name: '测验', subtitle: '检验你的探索', volume: '卷七' },
  { id: '览', name: '探索', subtitle: '更多体验入口', volume: '卷八' },
  { id: '传', name: '关于', subtitle: '年画薪传突击队', volume: '卷九' }
];

const TOOLS = [
  {
    name: '拳刀',
    short: '拳',
    purpose: '开版第一刀',
    desc: '木版年画雕刻的主力刀具，握法似拳，用于切出粗壮有力的轮廓主线。一块版的起稿轮廓多由拳刀完成。',
    detail: '刃口宽厚，斜角约 30°，需以双手发力推刻——匠人称之为"开版第一刀"，决定整版气韵。',
    image: IMAGES.carvingHD,
    color: '#D42F2F',
    angle: '正面 30°',
    weight: '约 220g'
  },
  {
    name: '弯刀',
    short: '弯',
    purpose: '转弯与弧线',
    desc: '刀身略带弧度，专门处理曲线轮廓和人物衣纹的转折处。处理袖口、衣角、髯须等柔性结构的关键。',
    detail: '弧度越深越能贴合更小的转角；老匠人手里常备 3–4 种不同弧度。',
    image: IMAGES.boardDisplay,
    color: '#E6A817',
    angle: '弧角 45°',
    weight: '约 180g'
  },
  {
    name: '三角刀',
    short: '三',
    purpose: '细线与脉理',
    desc: '"V"字形刀口，切出又细又利的线条。人物的发丝、衣物的纹路、花瓣的脉络都靠它完成。',
    detail: '刀口越尖切出的线越细；雕一根胡须，匠人要走刀十余次方能见神。',
    image: IMAGES.lightOnBoard,
    color: '#F2C94C',
    angle: 'V 60°',
    weight: '约 120g'
  },
  {
    name: '平刀',
    short: '平',
    purpose: '铲底与去料',
    desc: '刀口平直，专用于"铲底"——把不需要印色的木料铲掉，留下凸起的图案区域。是费工最多的一步。',
    detail: '刀宽常见 6–12 毫米，铲底时左手扶版、右手运刀，配合木槌敲击使力。',
    image: IMAGES.coloringCloseup,
    color: '#2D8B46',
    angle: '0° 平直',
    weight: '约 200g'
  },
  {
    name: '圆刀',
    short: '圆',
    purpose: '圆点与凹面',
    desc: '"U"字形刀口，用于雕刻圆点装饰和凹陷曲面。常见于花蕊、铜钱、铃铛等装饰部位。',
    detail: '深圆刀挖花蕊，浅圆刀走衣裙的飘带凹槽——一刀深浅由腕力定。',
    image: IMAGES.swordDanceFront,
    color: '#2D5DA1',
    angle: 'U 90°',
    weight: '约 150g'
  },
  {
    name: '棕刷',
    short: '棕',
    purpose: '上色与扫纸',
    desc: '不是刀，是套印阶段最重要的工具。棕榈纤维制成，上色均匀涂布到雕版上，刷纸时确保色块完全转印。',
    detail: '一套印至少 5 把棕刷，每色一把不能混用，使用前要在水里浸软。',
    image: IMAGES.drying,
    color: '#8B5A2B',
    angle: '宽 80mm',
    weight: '约 90g'
  }
];

function buildColorSteps(printedLayerCount, activeIndex) {
  return LOGO_PRINT_STEPS.map(function(step, index) {
    return {
      name: step.name,
      shortName: step.shortName,
      color: step.color,
      textColor: step.textColor,
      order: step.order,
      material: step.material,
      meaning: step.meaning,
      desc: step.desc,
      printed: index < printedLayerCount,
      active: index === activeIndex
    };
  });
}

function buildColorStepsFromSteps(printedSteps, activeIndex) {
  var printedSet = {};
  printedSteps.forEach(function(i) { printedSet[i] = true; });
  return LOGO_PRINT_STEPS.map(function(step, index) {
    return {
      name: step.name,
      shortName: step.shortName,
      color: step.color,
      textColor: step.textColor,
      order: step.order,
      material: step.material,
      meaning: step.meaning,
      desc: step.desc,
      printed: !!printedSet[index],
      active: index === activeIndex
    };
  });
}

function buildLogoPrintLayers(printedLayerCount) {
  const result = [];
  let zIndex = 1;

  LOGO_PRINT_STEPS.forEach(function(step, stepIndex) {
    step.layers.forEach(function(fileID, layerIndex) {
      result.push({
        id: stepIndex + '-' + layerIndex,
        fileID: fileID,
        color: step.color,
        stepIndex: stepIndex,
        visible: stepIndex < printedLayerCount,
        fresh: stepIndex === printedLayerCount - 1,
        zIndex: zIndex,
        delay: layerIndex * 80 + 'ms'
      });
      zIndex += 1;
    });
  });

  return result;
}

function buildLogoPrintLayersFromSteps(printedSteps) {
  var printedSet = {};
  printedSteps.forEach(function(i) { printedSet[i] = true; });
  var result = [];
  var zIndex = 1;

  LOGO_PRINT_STEPS.forEach(function(step, stepIndex) {
    step.layers.forEach(function(fileID, layerIndex) {
      result.push({
        id: stepIndex + '-' + layerIndex,
        fileID: fileID,
        color: step.color,
        stepIndex: stepIndex,
        visible: !!printedSet[stepIndex],
        fresh: false,
        zIndex: zIndex,
        delay: layerIndex * 80 + 'ms'
      });
      zIndex += 1;
    });
  });

  return result;
}

function buildPrintBlocks() {
  return LOGO_PRINT_STEPS.map(function(step) {
    return {
      name: step.name,
      shortName: step.shortName,
      color: step.color,
      textColor: step.textColor,
      order: step.order,
      material: step.material,
      meaning: step.meaning,
      desc: step.desc,
      printed: false,
      active: false
    };
  });
}

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

    // 章节卷宗
    chapters: CHAPTERS,
    chapterCount: CHAPTERS.length,

    // 刀具图鉴
    tools: TOOLS,
    toolActiveIndex: 0,
    toolDetailOpen: false,
    selectedTool: null,

    // 制作工艺
    craftSteps: CRAFT_STEPS,
    craftStepIndex: 0,

    // 五色套印 — 纸拖印刷游戏
    printBlocks: buildPrintBlocks(),
    currentBlockIndex: 0,
    activePrintBlock: {
      name: LOGO_PRINT_STEPS[0].name,
      shortName: LOGO_PRINT_STEPS[0].shortName,
      color: LOGO_PRINT_STEPS[0].color,
      textColor: LOGO_PRINT_STEPS[0].textColor,
      order: LOGO_PRINT_STEPS[0].order,
      material: LOGO_PRINT_STEPS[0].material,
      meaning: LOGO_PRINT_STEPS[0].meaning,
      desc: LOGO_PRINT_STEPS[0].desc,
      printed: false
    },
    printedSteps: [],
    colors: buildColorStepsFromSteps([], -1),
    logoPrintLayers: buildLogoPrintLayersFromSteps([]),
    printedLayerCount: 0,
    activeColor: -1,
    activePrintStep: null,
    paperDragOffset: 0,
    paperRotation: -4,
    isPaperDragging: false,
    isPaperPressing: false,
    isAnimating: false,
    animatingIndex: -1,

    // 图鉴卡片
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

    // 知识测验
    quiz: [
      {
        question: '五色套印最先印哪种颜色？',
        options: ['红色', '黑色', '黄色', '深黄色'],
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

  enterExplore() {
    // 封面 CTA：直接进入下一屏（史）
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    if (!this.data.musicTriggered && this.bgMusic) {
      this.bgMusic.play();
      this.setData({ musicPlaying: true, musicTriggered: true });
    }
    this.setData({ currentPage: 1 });
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

  // ── 溯源时间轴 ──

  onEraTap(e) {
    const index = parseInt(e.currentTarget.dataset.index, 10);
    this.setData({
      currentEra: index,
      showEraDetail: true,
      eraDetail: ERA_DATA[index]
    });
  },

  closeEraDetail() {
    this.setData({ showEraDetail: false, currentEra: -1 });
  },

  // ── 刀具图鉴 ──

  selectTool(e) {
    const index = parseInt(e.currentTarget.dataset.index, 10);
    this.setData({
      toolActiveIndex: index,
      selectedTool: TOOLS[index],
      toolDetailOpen: true
    });
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
  },

  closeToolDetail() {
    this.setData({ toolDetailOpen: false });
  },

  switchActiveTool(e) {
    const index = parseInt(e.currentTarget.dataset.index, 10);
    this.setData({
      toolActiveIndex: index,
      selectedTool: TOOLS[index]
    });
  },

  // ── 制作工艺 ──

  onCraftStepChange(e) {
    this.setData({ craftStepIndex: e.detail.current });
  },

  goToCraftStep(e) {
    const index = parseInt(e.currentTarget.dataset.index, 10);
    this.setData({ craftStepIndex: index });
  },

  // ── 五色套印 · 纸拖印刷游戏 ──

  // 更新当前选中的木板信息
  updateActiveBlock(index) {
    var step = LOGO_PRINT_STEPS[index];
    var printedSteps = this.data.printedSteps;
    var printed = printedSteps.indexOf(index) > -1;
    this.setData({
      currentBlockIndex: index,
      activePrintBlock: {
        name: step.name,
        shortName: step.shortName,
        color: step.color,
        textColor: step.textColor,
        order: step.order,
        material: step.material,
        meaning: step.meaning,
        desc: step.desc,
        printed: printed
      },
      colors: buildColorStepsFromSteps(printedSteps, index),
      activeColor: index,
      activePrintStep: step
    });
  },

  // 选择木板
  selectPrintBlock(e) {
    if (this.data.isPaperPressing || this.data.isPaperDragging) return;
    var index = parseInt(e.currentTarget.dataset.index, 10);
    this.updateActiveBlock(index);
  },

  // 上一块木板
  prevPrintBlock() {
    if (this.data.isPaperPressing) return;
    var index = this.data.currentBlockIndex;
    if (index <= 0) return;
    this.updateActiveBlock(index - 1);
  },

  // 下一块木板
  nextPrintBlock() {
    if (this.data.isPaperPressing) return;
    var index = this.data.currentBlockIndex;
    if (index >= LOGO_PRINT_STEPS.length - 1) return;
    this.updateActiveBlock(index + 1);
  },

  // 循环切换木板
  cyclePrintBlock() {
    if (this.data.isPaperPressing) return;
    var index = this.data.currentBlockIndex;
    var next = index >= LOGO_PRINT_STEPS.length - 1 ? 0 : index + 1;
    this.updateActiveBlock(next);
  },

  // 纸张触摸开始
  onPaperTouchStart(e) {
    if (this.data.isPaperPressing || this.data.isAnimating) return;
    this.setData({
      isPaperDragging: true,
      paperDragOffset: 0
    });
    this._paperDragStartY = e.touches[0].clientY;
  },

  // 纸张拖动中
  onPaperTouchMove(e) {
    if (!this.data.isPaperDragging || this.data.isPaperPressing) return;
    var deltaY = e.touches[0].clientY - this._paperDragStartY;
    var clampedOffset = Math.max(0, Math.min(deltaY, 200));
    var rotation = -4 + (clampedOffset / 200) * 4;
    this.setData({
      paperDragOffset: clampedOffset,
      paperRotation: rotation
    });
  },

  // 纸张触摸结束
  onPaperTouchEnd(e) {
    if (!this.data.isPaperDragging || this.data.isPaperPressing) {
      this.setData({ isPaperDragging: false, paperDragOffset: 0, paperRotation: -4 });
      return;
    }

    var threshold = 100;
    if (this.data.paperDragOffset > threshold) {
      this.doPaperPrint();
    } else {
      this.setData({ paperDragOffset: 0, paperRotation: -4, isPaperDragging: false });
    }
  },

  // 执行印刷动画
  doPaperPrint() {
    var blockIndex = this.data.currentBlockIndex;
    var that = this;

    if (this.data.isAnimating || this.data.isPaperPressing) return;

    // 落版动画
    this.setData({
      isPaperPressing: true,
      isPaperDragging: false,
      paperDragOffset: 180,
      paperRotation: 0
    });

    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'medium' });
    }

    // 印刷音效模拟延迟
    setTimeout(function() {
      var printedSteps = that.data.printedSteps.slice();
      if (printedSteps.indexOf(blockIndex) === -1) {
        printedSteps.push(blockIndex);
      }
      var printedLayerCount = printedSteps.length;

      // 重建图层
      var newLayers = buildLogoPrintLayersFromSteps(printedSteps);
      newLayers.forEach(function(layer) {
        if (layer.stepIndex === blockIndex) {
          layer.fresh = true;
        }
      });

      var step = LOGO_PRINT_STEPS[blockIndex];

      // 更新木板列表
      var blocks = that.data.printBlocks.map(function(b, i) {
        return {
          name: b.name,
          shortName: b.shortName,
          color: b.color,
          textColor: b.textColor,
          order: b.order,
          material: b.material,
          meaning: b.meaning,
          desc: b.desc,
          printed: printedSteps.indexOf(i) > -1,
          active: i === blockIndex
        };
      });

      that.setData({
        logoPrintLayers: newLayers,
        printedLayerCount: printedLayerCount,
        printedSteps: printedSteps,
        colors: buildColorStepsFromSteps(printedSteps, blockIndex),
        activeColor: blockIndex,
        activePrintStep: step,
        printBlocks: blocks,
        animatingIndex: blockIndex,
        activePrintBlock: {
          name: step.name,
          shortName: step.shortName,
          color: step.color,
          textColor: step.textColor,
          order: step.order,
          material: step.material,
          meaning: step.meaning,
          desc: step.desc,
          printed: true
        }
      });

      // 纸张回弹
      setTimeout(function() {
        that.setData({
          paperDragOffset: 0,
          paperRotation: -4,
          isPaperPressing: false
        });

        // 清除 fresh 标记
        var settledLayers = that.data.logoPrintLayers.map(function(l) {
          return {
            id: l.id,
            fileID: l.fileID,
            color: l.color,
            stepIndex: l.stepIndex,
            visible: l.visible,
            fresh: false,
            zIndex: l.zIndex,
            delay: l.delay
          };
        });
        that.setData({ logoPrintLayers: settledLayers });

        // 自动切换到下一个未印刷的木板
        var nextIndex = -1;
        for (var i = 0; i < blocks.length; i++) {
          if (!blocks[i].printed) {
            nextIndex = i;
            break;
          }
        }
        if (nextIndex > -1 && nextIndex !== blockIndex) {
          that.updateActiveBlock(nextIndex);
        }
      }, 600);
    }, 260);
  },

  // 重置所有印刷
  resetLogoPrint() {
    this.clearColorSequenceTimer();

    var step0 = LOGO_PRINT_STEPS[0];
    this.setData({
      printBlocks: buildPrintBlocks(),
      currentBlockIndex: 0,
      activePrintBlock: {
        name: step0.name,
        shortName: step0.shortName,
        color: step0.color,
        textColor: step0.textColor,
        order: step0.order,
        material: step0.material,
        meaning: step0.meaning,
        desc: step0.desc,
        printed: false
      },
      printedSteps: [],
      colors: buildColorStepsFromSteps([], -1),
      logoPrintLayers: buildLogoPrintLayersFromSteps([]),
      printedLayerCount: 0,
      activeColor: -1,
      activePrintStep: null,
      paperDragOffset: 0,
      paperRotation: -4,
      isPaperDragging: false,
      isPaperPressing: false,
      isAnimating: false,
      animatingIndex: -1
    });
  },

  // 兼容旧版自动演示
  playColorSequence() {
    if (this.data.isAnimating || this.data.isPaperDragging || this.data.isPaperPressing) return;

    this.clearColorSequenceTimer();
    this.setData({ isAnimating: true, animatingIndex: 0 });

    var that = this;
    var index = 0;

    function doStep() {
      if (index >= LOGO_PRINT_STEPS.length) {
        that.colorSequenceEndTimer = setTimeout(function() {
          that.setData({ isAnimating: false, animatingIndex: -1 });
          that.colorSequenceEndTimer = null;
        }, 500);
        return;
      }

      that.updateActiveBlock(index);

      // 模拟拖动印刷
      that.setData({ paperDragOffset: 180, paperRotation: 0, isPaperPressing: true });
      if (wx.vibrateShort) {
        wx.vibrateShort({ type: 'light' });
      }

      setTimeout(function() {
        var printedSteps = that.data.printedSteps.slice();
        if (printedSteps.indexOf(index) === -1) {
          printedSteps.push(printedSteps.length);
        }

        // 简化：顺序印刷
        var actualSteps = [];
        for (var j = 0; j <= index; j++) {
          actualSteps.push(j);
        }

        var newLayers = buildLogoPrintLayersFromSteps(actualSteps);
        newLayers.forEach(function(layer) {
          if (layer.stepIndex === index) {
            layer.fresh = true;
          }
        });

        var printedCount = actualSteps.length;
        that.setData({
          logoPrintLayers: newLayers,
          printedLayerCount: printedCount,
          printedSteps: actualSteps,
          colors: buildColorStepsFromSteps(actualSteps, index),
          activeColor: index,
          activePrintStep: LOGO_PRINT_STEPS[index],
          animatingIndex: index
        });

        setTimeout(function() {
          that.setData({ paperDragOffset: 0, paperRotation: -4, isPaperPressing: false });

          var settledLayers = that.data.logoPrintLayers.map(function(l) {
            return {
              id: l.id,
              fileID: l.fileID,
              color: l.color,
              stepIndex: l.stepIndex,
              visible: l.visible,
              fresh: false,
              zIndex: l.zIndex,
              delay: l.delay
            };
          });
          that.setData({ logoPrintLayers: settledLayers });

          index += 1;
          if (index < LOGO_PRINT_STEPS.length) {
            that.updateActiveBlock(index);
          }
          that.colorSequenceTimer = setTimeout(doStep, 600);
        }, 600);
      }, 260);
    }

    this.colorSequenceTimer = setTimeout(doStep, 200);
  },

  clearColorSequenceTimer() {
    if (this.colorSequenceTimer) {
      clearTimeout(this.colorSequenceTimer);
      this.colorSequenceTimer = null;
    }

    if (this.colorSequenceEndTimer) {
      clearTimeout(this.colorSequenceEndTimer);
      this.colorSequenceEndTimer = null;
    }

    if (this.printStampTimer) {
      clearTimeout(this.printStampTimer);
      this.printStampTimer = null;
    }

    if (this._paperPressTimer) {
      clearTimeout(this._paperPressTimer);
      this._paperPressTimer = null;
    }

    if (this._paperReturnTimer) {
      clearTimeout(this._paperReturnTimer);
      this._paperReturnTimer = null;
    }
  },

  // ── 图鉴卡片 ──

  flipCard(e) {
    const index = e.currentTarget.dataset.index;
    const path = 'cards[' + index + '].flipped';
    const data = {};
    data[path] = !this.data.cards[index].flipped;
    this.setData(data);
  },

  // ── 知识测验 ──

  selectQuizOption(e) {
    if (this.data.showExplanation) return;

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
        this.setData({ quizFinished: true });
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

  // ── 通用 ──

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

  // ── 导航 ──

  goTo3D() {
    wx.navigateTo({ url: '/pages/gallery/gallery' });
  },

  goTo2D() {
    wx.navigateTo({ url: '/pages/exploded-view/exploded-view' });
  },

  goToAiGenerate() {
    wx.navigateTo({ url: '/pages/ai-create/ai-create' });
  },

  goToAiHome() {
    wx.navigateTo({ url: '/pages/index/index' });
  }
});
