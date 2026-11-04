/**
 * @fileoverview 互动流程组件
 * 三步推演互动：选场景 → 选策略 → 看结果
 *
 * 两种使用方式：
 * 1. 插件模式（富文本内嵌）：由 mp-html 的 interactive-flow 插件渲染，
 *    layout=inline 时 variant=full 原地交互；layout=popup 时 variant=teaser
 *    渲染占位小卡，点击 triggerEvent('flowopen')，由页面唤起全屏弹层
 * 2. 独立模式（页面弹层）：页面直接引用本组件，传 flow/theme，variant=full + show-close
 *
 * 主题通过 CSS 变量注入（--if-primary 等），WXSS 中使用 var(--if-xxx, 默认值)，
 * 未配置主题时呈现内置深色金样式
 */

Component({
  options: {
    addGlobalClass: true,
  },

  properties: {
    /**
     * @description 互动组件数据（结构化 JSON）
     */
    flow: {
      type: Object,
      value: null,
    },

    /**
     * @description 展示形态：full 完整流程 / teaser 占位小卡
     */
    variant: {
      type: String,
      value: 'full',
    },

    /**
     * @description 主题（独立模式由页面直传；插件模式缺省时从 mp-html 根组件读取）
     */
    theme: {
      type: Object,
      value: null,
    },

    /**
     * @description full 模式下是否显示关闭按钮（弹层内使用）
     */
    showClose: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    step: 0, // 0 选场景 / 1 选策略 / 2 看结果
    sceneIndex: -1,
    optionIndex: -1,
    themeStyle: '', // CSS 变量注入串
    rootTheme: null, // 从 mp-html 根组件读到的主题
  },

  observers: {
    flow() {
      // 数据更换时重置流程
      this.setData({
        step: 0,
        sceneIndex: -1,
        optionIndex: -1,
      });
    },
    'theme, rootTheme': function () {
      this.setData({ themeStyle: this.buildThemeStyle() });
    },
  },

  lifetimes: {
    attached() {
      if (!this.properties.theme && !this.data.rootTheme) {
        const root = this.getRoot();
        if (root && root.properties && root.properties.flowTheme) {
          this.setData({ rootTheme: root.properties.flowTheme });
        }
      }
    },
  },

  methods: {
    /**
     * @description 向上查找 mp-html 根组件
     */
    getRoot() {
      let parent = this.selectOwnerComponent();
      while (parent) {
        if (parent.imgList !== undefined) {
          return parent;
        }
        parent = parent.selectOwnerComponent
          ? parent.selectOwnerComponent()
          : null;
      }
      return null;
    },

    /**
     * @description 生成 CSS 变量注入串
     */
    buildThemeStyle() {
      const theme = this.properties.theme || this.data.rootTheme;
      if (!theme || !theme.enabled || !theme.primary) {
        return '';
      }
      const vars = [];
      if (theme.primary) vars.push(`--if-primary:${theme.primary}`);
      if (theme.accent) vars.push(`--if-accent:${theme.accent}`);
      if (theme.background) vars.push(`--if-bg:${theme.background}`);
      if (theme.text) vars.push(`--if-text:${theme.text}`);
      if (theme.muted) vars.push(`--if-muted:${theme.muted}`);
      if (theme.surface) vars.push(`--if-surface:${theme.surface}`);
      if (theme.line) vars.push(`--if-line:${theme.line}`);
      // 柔和叠加底按背景亮度自动派生：浅色主题加深、深色主题提亮
      const bg = theme.background;
      if (bg && /^#[0-9a-fA-F]{6}$/.test(bg)) {
        const r = parseInt(bg.slice(1, 3), 16);
        const g = parseInt(bg.slice(3, 5), 16);
        const b = parseInt(bg.slice(5, 7), 16);
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        vars.push(
          `--if-soft:${lum >= 0.5 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.04)'}`
        );
      }
      return vars.join(';');
    },

    /** 占位小卡被点击（teaser 模式） */
    onTeaserTap() {
      const flow = this.properties.flow;
      if (!flow) return;
      this.triggerEvent('flowopen', { id: flow.id });
    },

    /** 关闭按钮被点击（弹层模式） */
    onClose() {
      this.triggerEvent('close');
    },

    /** 选择场景 */
    onSceneTap(e) {
      const index = e.currentTarget.dataset.index;
      this.setData({ sceneIndex: index, optionIndex: -1, step: 1 });
    },

    /** 选择策略 */
    onOptionTap(e) {
      const index = e.currentTarget.dataset.index;
      this.setData({ optionIndex: index, step: 2 });
    },

    /** 上一步 */
    onPrev() {
      const step = this.data.step;
      if (step > 0) {
        this.setData({ step: step - 1 });
      }
    },

    /** 换个选项 */
    changeOption() {
      this.setData({ step: 1 });
    },

    /** 换个场景 */
    changeScene() {
      this.setData({ step: 0, sceneIndex: -1, optionIndex: -1 });
    },
  },
});
