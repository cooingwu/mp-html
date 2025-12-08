/**
 * @fileoverview 锚点组件
 * 用于在图片上显示单个可点击的锚点
 */

// 内嵌 SVG 图标映射（base64 编码）
const ICON_SVG_MAP = {
  'info-circle': "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='{{COLOR}}'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z'/%3E%3C/svg%3E",
  'question-circle': "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='{{COLOR}}'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z'/%3E%3C/svg%3E",
  'exclamation-circle': "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='{{COLOR}}'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z'/%3E%3C/svg%3E",
  'star': "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='{{COLOR}}'%3E%3Cpath d='M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z'/%3E%3C/svg%3E",
  'heart': "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='{{COLOR}}'%3E%3Cpath d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'/%3E%3C/svg%3E",
  'thumb-up': "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='{{COLOR}}'%3E%3Cpath d='M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z'/%3E%3C/svg%3E",
  'location': "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='{{COLOR}}'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3E%3C/svg%3E",
  'eye': "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='{{COLOR}}'%3E%3Cpath d='M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z'/%3E%3C/svg%3E"
}

/**
 * @description 生成带颜色的 SVG 图标
 * @param {String} iconName 图标名称
 * @param {String} color 颜色值
 * @returns {String} SVG data URL
 */
function getColoredIconSvg(iconName, color) {
  const template = ICON_SVG_MAP[iconName]
  if (!template) return ''
  // 将颜色中的 # 转换为 URL 编码
  const encodedColor = encodeURIComponent(color || '#ffffff')
  return template.replace(/\{\{COLOR\}\}/g, encodedColor)
}

Component({
  properties: {
    /**
     * @description 锚点数据
     */
    anchor: {
      type: Object,
      value: {}
    },

    /**
     * @description 预设样式列表
     */
    styles: {
      type: Array,
      value: []
    },

    /**
     * @description 是否显示动画
     */
    animation: {
      type: Boolean,
      value: true
    },

    /**
     * @description 图片宽度（用于计算锚点大小）
     */
    imageWidth: {
      type: Number,
      value: 0
    }
  },

  data: {
    size: 32, // 计算后的锚点尺寸
    styleType: 'default', // 样式类型：image/shape/icon/default
    styleImage: '', // 图片样式的 URL
    shapeStyle: '', // 图形样式
    shapeClass: '', // 图形类名
    iconSvg: '', // 图标 SVG
    iconColor: '#ffffff',
    labelPosition: 'right', // 说明文本位置
    isPC: false
  },

  observers: {
    'anchor, styles, imageWidth': function(anchor, styles, imageWidth) {
      if (!anchor || !imageWidth) return
      this.updateStyle()
    }
  },

  lifetimes: {
    attached() {
      // 检测平台
      try {
        const systemInfo = wx.getSystemInfoSync()
        this.setData({
          isPC: systemInfo.platform === 'windows' || systemInfo.platform === 'mac'
        })
      } catch (e) {
        console.error('获取系统信息失败', e)
      }
    }
  },

  methods: {
    /**
     * @description 更新锚点样式
     */
    updateStyle() {
      const { anchor, styles, imageWidth, isPC } = this.data
      if (!anchor || !anchor.style) return

      // 计算锚点尺寸
      let size = (imageWidth * (anchor.style.size || 8)) / 100
      // 最小尺寸限制
      if (isPC && size < 24) size = 24
      if (!isPC && size < 20) size = 20

      // 获取预设样式
      const preset = anchor.style.presetId
        ? styles.find(s => s._id === anchor.style.presetId)
        : null

      let styleType = 'default'
      let styleImage = ''
      let shapeStyle = ''
      let shapeClass = ''
      let iconSvg = ''
      let iconColor = '#ffffff'

      if (preset) {
        styleType = preset.type || 'shape'

        if (preset.type === 'image' && preset.image) {
          styleImage = preset.image
        } else if (preset.type === 'shape' && preset.shape) {
          const shape = preset.shape
          shapeClass = 'shape-' + (shape.type || 'circle')
          const styles = []
          if (shape.color) styles.push(`background-color: ${shape.color}`)
          if (shape.borderWidth && shape.borderColor) {
            styles.push(`border: ${shape.borderWidth}px solid ${shape.borderColor}`)
          }
          shapeStyle = styles.join(';')
        } else if (preset.type === 'icon' && preset.icon) {
          iconColor = preset.icon.color || '#ffffff'
          iconSvg = getColoredIconSvg(preset.icon.name, iconColor)
        }
      } else {
        // 使用自定义样式或默认样式
        if (anchor.style.customImage) {
          styleType = 'image'
          styleImage = anchor.style.customImage
        } else {
          styleType = 'default'
        }
      }

      // 计算说明文本位置
      let labelPosition = 'right'
      if (anchor.label) {
        labelPosition = this.calculateLabelPosition(anchor)
      }

      this.setData({
        size,
        styleType,
        styleImage,
        shapeStyle,
        shapeClass,
        iconSvg,
        iconColor,
        labelPosition
      })
    },

    /**
     * @description 计算说明文本位置
     * @param {Object} anchor 锚点数据
     * @returns {String} 位置
     */
    calculateLabelPosition(anchor) {
      if (!anchor.label || !anchor.label.text) return 'right'

      const preferredPosition = anchor.label.position || 'right'
      const autoPosition = anchor.label.autoPosition !== false
      const { x, y } = anchor.position || { x: 50, y: 50 }

      if (!autoPosition) {
        return preferredPosition
      }

      // 简单的边界检测（假设 label 宽度约 20%，高度约 8%）
      const labelWidthPercent = 20
      const labelHeightPercent = 8

      const spaceMap = {
        right: (100 - x) > labelWidthPercent,
        left: x > labelWidthPercent,
        top: y > labelHeightPercent,
        bottom: (100 - y) > labelHeightPercent
      }

      // 按优先级查找可用位置
      const priorities = [preferredPosition, 'right', 'bottom', 'left', 'top']
        .filter((pos, idx, arr) => arr.indexOf(pos) === idx)

      return priorities.find(pos => spaceMap[pos]) || 'right'
    },

    /**
     * @description 点击锚点
     */
    onTap() {
      this.triggerEvent('tap', { anchor: this.data.anchor })
    }
  }
})
