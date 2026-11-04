/**
 * @fileoverview 互动流程插件构建配置
 */
module.exports = {
  /**
   * @description 入口文件
   */
  main: 'index.js',

  /**
   * @description 支持的平台（目前仅支持微信小程序）
   */
  platform: ['mp-weixin'],

  /**
   * @description 要被添加到模板文件中的标签
   * popup 布局时渲染占位小卡（teaser），点击后由页面唤起全屏弹层
   */
  template: `
    <interactive-flow
      wx:elif="{{n.name==='interactive-flow'}}"
      flow="{{n.flowData}}"
      variant="{{n.flowData.layout === 'popup' ? 'teaser' : 'full'}}"
      bind:flowopen="flowOpen"
    />
  `,

  /**
   * @description 用于处理模板中事件的方法
   */
  methods: {
    /**
     * @description 占位卡被点击，请求打开全屏推演
     */
    flowOpen(e) {
      this.root.triggerEvent('flowopen', e.detail)
    }
  },

  /**
   * @description 用于模板文件的 css 样式
   */
  style: 'interactive-flow{display:block;width:100%;}',

  /**
   * @description 在模板中需要使用的组件
   */
  usingComponents: {
    'interactive-flow': '../interactive-flow/interactive-flow'
  },

  /**
   * @description 自定义文件处理器
   */
  handler(file, platform) {
    if (file.isBuffer()) {
      let content = file.contents.toString()

      // 在 parser 的标签表中注册自定义标签（trustTags 保留标签名，voidTags 走自闭合分支跳过 popNode 改名）
      if (file.path.includes('parser.js')) {
        content = content
          .replace(/trustTags\s*:\s*makeMap\('/, "trustTags: makeMap('interactive-flow,")
          .replace(/voidTags\s*:\s*makeMap\('/, "voidTags: makeMap('interactive-flow,")
      }

      // 在主组件中添加新的 properties
      if (file.path.includes('index.js') && !file.path.includes('node')) {
        const inject = `,

    /**
     * @description 互动组件数据列表（结构化 JSON，由页面解析后传入）
     * @type {Array}
     */
    interactiveFlows: {
      type: Array,
      value: []
    },

    /**
     * @description 互动组件主题（书籍级配置，来自 publications.interactiveTheme）
     * @type {Object}
     */
    flowTheme: {
      type: Object,
      value: null
    }
  }`

        // image-anchor 启用时挂在它注入的最后一个属性之后
        const anchorTail = /(anchorAutoResize\s*:\s*\{[^{}]*\}\s*)\}/
        if (anchorTail.test(content)) {
          content = content.replace(anchorTail, '$1' + inject)
        } else {
          // 兜底：image-anchor 未启用时挂在 useAnchor 之后
          content = content.replace(/useAnchor\s*:\s*null\s*\}/, 'useAnchor: null' + inject)
        }
      }

      file.contents = Buffer.from(content)
    }
  }
}
