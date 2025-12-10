/**
 * @fileoverview 图片锚点容器组件
 * 用于在图片上显示锚点，并管理解读弹窗
 */

Component({
  options: {
    addGlobalClass: true
  },

  properties: {
    /**
     * @description 节点数据（包含图片信息和锚点数据）
     */
    node: {
      type: Object,
      value: {}
    },

    /**
     * @description 组件选项
     */
    opts: {
      type: Array,
      value: []
    }
  },

  data: {
    imageLoaded: false, // 图片是否加载完成
    imageWidth: 0, // 图片实际显示宽度
    imageHeight: 0, // 图片实际显示高度
    anchors: [], // 锚点数组
    styles: [], // 预设样式
    mode: 'container', // 弹窗模式
    animation: true, // 是否显示动画
    activeAnchor: null, // 当前激活的锚点
    tooltipPosition: 'bottom', // 弹窗位置
    showModal: false, // 是否显示 modal 弹窗
    isPc: false // 是否是 PC 端
  },

  lifetimes: {
    attached() {
      // 判断是否是 PC 端
      this.checkIsPc()
      // 获取根组件的配置
      this.initFromRoot()
    }
  },

  methods: {
    /**
     * @description 判断是否是 PC 端
     */
    checkIsPc() {
      try {
        const systemInfo = wx.getSystemInfoSync()
        // 通过屏幕宽度判断，大于 768px 认为是 PC 端
        const isPc = systemInfo.screenWidth >= 768
        this.setData({ isPc })
      } catch (e) {
        console.error('获取系统信息失败', e)
      }
    },

    /**
     * @description 从节点数据获取配置
     */
    initFromRoot() {
      const { node } = this.properties

      // 从 node.anchorData 获取所有配置（由 index.js 在解析时设置）
      let anchors = []
      let styles = []
      let mode = 'container'
      let animation = true

      if (node.anchorData) {
        anchors = node.anchorData.anchors || []
        styles = node.anchorData.styles || []
        mode = node.anchorData.tooltipMode || 'container'
        animation = node.anchorData.showAnimation !== false
      }

      this.setData({
        anchors,
        styles,
        mode,
        animation
      })
    },

    /**
     * @description 图片加载完成
     */
    onImageLoad(e) {
      const { width, height } = e.detail

      // 获取图片实际显示尺寸
      const query = this.createSelectorQuery()
      query.select('.anchor-image').boundingClientRect(rect => {
        if (rect) {
          this.setData({
            imageLoaded: true,
            imageWidth: rect.width,
            imageHeight: rect.height
          })
        }
      }).exec()

      // 触发原有的图片加载事件
      this.triggerEvent('imgload', e.detail)
    },

    /**
     * @description 图片加载失败
     */
    onImageError(e) {
      this.triggerEvent('imgerror', e.detail)
    },

    /**
     * @description 图片点击
     */
    onImageTap(e) {
      // 如果点击的是锚点，不处理
      if (e.target && e.target.dataset && e.target.dataset.anchor) {
        return
      }

      const { node } = this.data
      this.triggerEvent('imgtap', node.attrs)
    },

    /**
     * @description 锚点点击
     */
    onAnchorTap(e) {
      const { anchor } = e.detail || {}
      if (!anchor) return

      const { mode } = this.data

      // 计算弹窗位置（安全访问 position）
      const position = anchor.position || { x: 50, y: 50 }
      const tooltipPosition = position.y > 60 ? 'top' : 'bottom'

      this.setData({
        activeAnchor: anchor,
        tooltipPosition,
        showModal: mode === 'modal'
      })

      // 触发锚点点击事件
      this.triggerEvent('anchortap', { anchor })

      // 触发弹窗显示事件
      this.triggerEvent('tooltipshow', { anchor })
    },

    /**
     * @description 关闭弹窗
     */
    onTooltipClose() {
      const { activeAnchor } = this.data

      this.setData({
        activeAnchor: null,
        showModal: false
      })

      // 触发弹窗隐藏事件
      this.triggerEvent('tooltiphide', { anchor: activeAnchor })
    },

    /**
     * @description 页面切换事件
     */
    onPageChange(e) {
      this.triggerEvent('pagechange', {
        ...e.detail,
        anchor: this.data.activeAnchor
      })
    },

    /**
     * @description 点击遮罩关闭
     */
    onMaskTap() {
      this.onTooltipClose()
    },

    /**
     * @description 阻止事件冒泡
     */
    stopPropagation() {
      // 空函数，用于阻止点击穿透
    }
  }
})
