Page({
  data: {
    baseUrl: 'https://model-server-rosy.vercel.app/knowledge',

    timeline: [
      { year: '明·永乐', title: '起源', desc: '佛山木版年画起源于明代永乐年间，距今600余年。最初以民间神像画为主，用于岁末祈福。', expanded: false },
      { year: '清·乾隆', title: '鼎盛', desc: '乾隆至嘉庆年间为鼎盛期。作坊集中在佛山镇细巷一带，年产百万张，远销南洋。', expanded: false },
      { year: '清末民初', title: '转型', desc: '石印技术传入冲击传统木版。部分作坊尝试木版套印与石印结合。', expanded: false },
      { year: '1949-1980', title: '保护', desc: '新中国重视民间艺术保护，老艺人技艺得到系统记录传承。', expanded: false },
      { year: '2006至今', title: '非遗', desc: '入选首批国家级非遗名录。冯炳棠等传承人推动技艺传承创新。', expanded: false }
    ],

    colors: [
      { name: '墨', color: '#1A1A1A', textColor: '#FFFFFF', material: '松烟墨', meaning: '轮廓骨架', order: 1, desc: '先印墨线版勾勒轮廓，雕刻难度最高。' },
      { name: '红', color: '#C23B22', textColor: '#FFFFFF', material: '朱砂', meaning: '喜庆吉祥', order: 2, desc: '用色最广，天然朱砂色彩持久。' },
      { name: '黄', color: '#DAA520', textColor: '#1A1A1A', material: '石黄', meaning: '富贵尊崇', order: 3, desc: '用于神像衣袍，色泽温润。' },
      { name: '绿', color: '#2E8B57', textColor: '#FFFFFF', material: '铜绿', meaning: '生机盎然', order: 4, desc: '用于树木衣饰，色彩古朴。' },
      { name: '紫', color: '#8B4789', textColor: '#FFFFFF', material: '品红', meaning: '祥瑞庄重', order: 5, desc: '最后点缀，使画面层次丰富。' }
    ],
    activeColor: -1,
    isAnimating: false,
    animatingIndex: -1,

    cards: [
      { image: 'baxian.jpg', title: '八仙过海', desc: '八仙各显神通渡海，寄托百姓对美好生活的向往。', category: '神话传说', flipped: false },
      { image: 'swordsman-woodblock.jpg', title: '武将门神', desc: '威武将军守护家宅平安，驱邪避凶。', category: '门神类', flipped: false },
      { image: 'carving-detail.jpg', title: '雕版技艺', desc: '梨木枣木质硬细腻，一块线版需数周雕刻。', category: '核心技艺', flipped: false },
      { image: 'coloring-closeup.jpg', title: '上色工艺', desc: '精准控制颜料浓度，确保每版套印色彩均匀。', category: '制作工艺', flipped: false },
      { image: 'drying-prints.jpg', title: '晾晒工序', desc: '每套一版都需充分晾晒，整面墙挂满年画最为壮观。', category: '制作工艺', flipped: false },
      { image: 'light-on-woodblock.jpg', title: '木版之美', desc: '光影下木版纹理与刀痕交织，记录匠人心血与传承。', category: '文化之美', flipped: false }
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
    showExplanation: false,

    videos: [
      { src: 'nianhua-making.mp4', title: '木版年画制作工艺', poster: 'coloring-closeup.jpg' },
      { src: 'nianhua-story.mp4', title: '年画故事与传承', poster: 'baxian.jpg' }
    ]
  },

  onUnload() {
    this.clearColorSequenceTimer();
  },

  toggleTimeline(e) {
    const index = e.currentTarget.dataset.index;
    const path = 'timeline[' + index + '].expanded';
    this.setData({
      [path]: !this.data.timeline[index].expanded
    });
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

  clearColorSequenceTimer() {
    if (this.colorSequenceTimer) {
      clearInterval(this.colorSequenceTimer);
      this.colorSequenceTimer = null;
    }

    if (this.colorSequenceEndTimer) {
      clearTimeout(this.colorSequenceEndTimer);
      this.colorSequenceEndTimer = null;
    }
  }
});
