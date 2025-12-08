/**
 * @fileoverview 图片锚点插件构建配置
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
   */
  template: `
    <image-anchor
      wx:elif="{{n.hasAnchors}}"
      node="{{n}}"
      opts="{{opts}}"
      data-i="{{i}}"
      bindimgtap="imgTap"
      bindanchortap="anchorTap"
      bindtooltipshow="tooltipShow"
      bindtooltiphide="tooltipHide"
      bindpagechange="pageChange"
    />
  `,

  /**
   * @description 用于处理模板中事件的方法
   */
  methods: {
    /**
     * @description 锚点点击事件
     */
    anchorTap(e) {
      this.root.triggerEvent('anchortap', e.detail)
    },

    /**
     * @description 弹窗显示事件
     */
    tooltipShow(e) {
      this.root.triggerEvent('tooltipshow', e.detail)
    },

    /**
     * @description 弹窗隐藏事件
     */
    tooltipHide(e) {
      this.root.triggerEvent('tooltiphide', e.detail)
    },

    /**
     * @description 页面切换事件
     */
    pageChange(e) {
      this.root.triggerEvent('pagechange', e.detail)
    }
  },

  /**
   * @description 用于模板文件的 css 样式
   */
  style: '',

  /**
   * @description 在模板中需要使用的组件
   */
  usingComponents: {
    'image-anchor': '../image-anchor/image-anchor'
  },

  /**
   * @description 自定义文件处理器
   */
  handler(file, platform) {
    if (file.isBuffer()) {
      let content = file.contents.toString()

      // 在主组件中添加新的 properties
      if (file.path.includes('index.js') && !file.path.includes('node')) {
        // 添加 imageAnchors 属性
        content = content.replace(
          /useAnchor:\s*null\s*\}/,
          `useAnchor: null,

    /**
     * @description 图片锚点数据
     * @type {Array}
     */
    imageAnchors: {
      type: Array,
      value: []
    },

    /**
     * @description 锚点预设样式
     * @type {Array}
     */
    anchorStyles: {
      type: Array,
      value: []
    },

    /**
     * @description 解读弹窗显示模式
     * @type {String}
     * @default 'container'
     */
    tooltipMode: {
      type: String,
      value: 'container'
    },

    /**
     * @description 是否显示锚点动画
     * @type {Boolean}
     * @default true
     */
    showAnchorAnimation: {
      type: Boolean,
      value: true
    }
  }`
        )

        // 添加获取锚点数据的方法
        content = content.replace(
          /_add\s*\(e\)\s*\{/,
          `/**
     * @description 获取指定图片的锚点数据
     * @param {Number} imageIndex 图片索引
     * @returns {Array} 锚点数组
     */
    getAnchorsForImage(imageIndex) {
      const anchors = this.properties.imageAnchors || []
      const config = anchors.find(a => a.imageIndex === imageIndex)
      return config ? config.anchors : []
    },

    /**
     * @description 获取预设样式
     * @param {String} presetId 预设样式ID
     * @returns {Object|null}
     */
    getAnchorStyle(presetId) {
      if (!presetId) return null
      const styles = this.properties.anchorStyles || []
      return styles.find(s => s._id === presetId) || null
    },

    _add (e) {`
        )
      }

      // 在 node.wxml 中的 img 模板前添加带锚点图片的处理
      if (file.path.includes('node') && file.path.includes('.wxml')) {
        // 在 img 块之前插入带锚点的图片处理
        content = content.replace(
          /<!-- 图片 -->\s*<block wx:if="{{n\.name==='img'}}"/,
          `<!-- 带锚点的图片 -->
  <block wx:if="{{n.hasAnchors}}">
    <image-anchor
      node="{{n}}"
      opts="{{opts}}"
      data-i="{{i}}"
      bindimgtap="imgTap"
      bindanchortap="anchorTap"
      bindtooltipshow="tooltipShow"
      bindtooltiphide="tooltipHide"
      bindpagechange="pageChange"
    />
  </block>
  <!-- 普通图片 -->
  <block wx:elif="{{n.name==='img'}}"`
        )
      }

      file.contents = Buffer.from(content)
    }
  }
}
