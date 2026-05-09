Page({
  data: {
    baseUrl: 'https://model-server-rosy.vercel.app/knowledge',

    timeline: [
      { year: '明·永乐', title: '起源', desc: '佛山木版年画起源于明代永乐年间，距今已有600余年。最初以民间神像画为主，用于岁末祈福驱邪。', expanded: false },
      { year: '清·乾隆', title: '鼎盛', desc: '清代乾隆至嘉庆年间为鼎盛期。作坊集中在佛山镇细巷、营房脚一带，年产量达百万张，远销南洋各地。', expanded: false },
      { year: '清末民初', title: '转型', desc: '石印技术传入后传统木版年画受到冲击。部分作坊尝试将木版套印与石印结合，开创新制作方式。', expanded: false },
      { year: '1949-1980', title: '保护', desc: '新中国成立后政府重视民间艺术保护。佛山木版年画被列入重点保护对象，老艺人技艺得到系统记录。', expanded: false },
      { year: '2006至今', title: '非遗', desc: '2006年入选首批国家级非物质文化遗产名录。冯炳棠大师等传承人积极推动技艺传承与创新发展。', expanded: false }
    ],

    colors: [
      { name: '墨（线版）', color: '#1A1A1A', textColor: '#FFFFFF', material: '松烟墨', meaning: '轮廓骨架，万画之基', order: 1, desc: '第一步先印墨线版，勾勒出年画的全部轮廓和细节线条。墨线版雕刻难度最高，是整幅年画的骨架。' },
      { name: '红（朱砂）', color: '#C23B22', textColor: '#FFFFFF', material: '朱砂/银朱', meaning: '喜庆吉祥', order: 2, desc: '红色象征喜庆吉祥，是年画中用色最广的颜色。传统使用天然矿物朱砂或银朱，色彩鲜艳持久不褪。' },
      { name: '黄（石黄）', color: '#DAA520', textColor: '#1A1A1A', material: '石黄/藤黄', meaning: '富贵尊崇', order: 3, desc: '黄色象征富贵，常用于神像衣袍和装饰。传统使用石黄或藤黄，色泽温润典雅。' },
      { name: '绿（铜绿）', color: '#2E8B57', textColor: '#FFFFFF', material: '铜绿', meaning: '生机盎然', order: 4, desc: '绿色象征生机与希望，用于树木、山石和部分衣饰。传统使用铜绿，色彩沉稳古朴。' },
      { name: '紫/蓝', color: '#8B4789', textColor: '#FFFFFF', material: '品红/靛蓝', meaning: '祥瑞庄重', order: 5, desc: '最后套印紫色或蓝色，用于点缀装饰，使画面层次丰富、色彩完整。' }
    ],
    activeColor: -1,
    isAnimating: false,
    animatingIndex: -1,

    cards: [
      { image: 'baxian.jpg', title: '八仙过海', desc: '八仙过海是佛山木版年画的经典题材之一。八位仙人各显神通渡海的故事，寄托了百姓对美好生活的向往。', category: '神话传说', flipped: false },
      { image: 'swordsman-woodblock.jpg', title: '武将门神', desc: '武将门神是年画中最具代表性的题材。威武的将军形象贴于门上，守护家宅平安，驱邪避凶。', category: '门神类', flipped: false },
      { image: 'carving-detail.jpg', title: '雕版技艺', desc: '雕版多用梨木或枣木，质地坚硬细腻。匠人以刀代笔，在木板上雕刻出精细的线条和图案，一块线版往往需要数周完成。', category: '核心技艺', flipped: false },
      { image: 'coloring-closeup.jpg', title: '上色工艺', desc: '上色是年画制作中最考验经验的环节。匠人需要精准控制颜料浓度和用量，确保每一版套印都色彩均匀、层次分明。', category: '制作工艺', flipped: false },
      { image: 'drying-prints.jpg', title: '晾晒工序', desc: '每套一版色，都需要充分晾晒干燥后才能进行下一版套印。传统作坊里，整面墙挂满晾晒的年画是最壮观的场景。', category: '制作工艺', flipped: false },
      { image: 'light-on-woodblock.jpg', title: '木版之美', desc: '一块历经岁月的木版本身就是艺术品。光影下的木版纹理与刀痕交织，记录着匠人的心血与传承的记忆。', category: '文化之美', flipped: false }
    ],

    quiz: [
      {
        question: '佛山木版年画五色套印时，最先印的是哪种颜色？',
        options: ['红色（朱砂）', '黑色（墨线版）', '黄色（石黄）', '绿色（铜绿）'],
        answer: 1,
        explanation: '正确！黑色墨线版是最先印制的，它勾勒出年画的全部轮廓线条，是整幅画的骨架。'
      },
      {
        question: '佛山木版年画入选国家级非遗名录是在哪一年？',
        options: ['2003年', '2006年', '2008年', '2010年'],
        answer: 1,
        explanation: '正确！佛山木版年画于2006年入选首批国家级非物质文化遗产名录。'
      },
      {
        question: '传统木版年画雕版最常使用的木材是？',
        options: ['松木', '梨木或枣木', '竹子', '樟木'],
        answer: 1,
        explanation: '正确！梨木和枣木质地坚硬细腻，纹理均匀，最适合精细雕刻。'
      }
    ],
    currentQuestion: 0,
    quizScore: 0,
    quizFinished: false,
    selectedOption: -1,
    showExplanation: false
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
