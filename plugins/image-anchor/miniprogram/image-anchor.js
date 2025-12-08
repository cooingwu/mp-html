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
    showModal: false // 是否显示 modal 弹窗
  },

  lifetimes: {
    attached() {
      // 获取根组件的配置
      this.initFromRoot()
    }
  },

  methods: {
    /**
     * @description 从根组件获取配置
     */
    initFromRoot() {
      // 获取根组件实例
      let root = null
      let parent = this.selectOwnerComponent()
      while (parent) {
        if (parent.properties && parent.properties.imageAnchors !== undefined) {
          root = parent
          break
        }
        parent = parent.selectOwnerComponent ? parent.selectOwnerComponent() : null
      }

      if (!root) {
        // 尝试通过 root 属性获取
        if (this.root) {
          root = this.root
        }
      }

      if (root) {
        const { node } = this.data
        const imageIndex = parseInt(node.attrs && node.attrs['data-image-index']) || 0

        // 获取该图片的锚点数据
        const imageAnchors = root.properties.imageAnchors || []
        const anchorConfig = imageAnchors.find(a => a.imageIndex === imageIndex)
        const anchors = anchorConfig ? anchorConfig.anchors : []

        // 获取其他配置
        const styles = root.properties.anchorStyles || []
        const mode = root.properties.tooltipMode || 'container'
        const animation = root.properties.showAnchorAnimation !== false

        this.setData({
          anchors,
          styles,
          mode,
          animation
        })

        // 保存 root 引用
        this.root = root
      }
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
      const { anchor } = e.detail
      const { mode } = this.data

      // 计算弹窗位置
      const tooltipPosition = anchor.position.y > 60 ? 'top' : 'bottom'

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
