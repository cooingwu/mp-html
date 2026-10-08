/**
 * @fileoverview 锚点组件
 * 用于在图片上显示单个可点击的锚点
 */

import { checkIsPc, checkIsSkyline } from "./utils"

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
/**
 * 单字符宽度系数（相对 fontSize 的 em 值），与管理端 anchor-inside.ts 保持一致：
 * 全角 1（精确）；半角按类别放量估算——大写 0.72、数字/小写 0.62、空格 0.35、其余 0.55。
 * 宁可偏宽：估算偏窄会导致浏览器提前折行，行数比预估多而被 max-height 裁掉
 * @param {String} ch 单个字符
 * @returns {Number} 宽度系数
 */
function charWidthUnit(ch) {
  if (/[\u2E80-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF\u3000-\u303F]/.test(ch)) return 1
  if (ch >= 'A' && ch <= 'Z') return 0.72
  if (ch === ' ') return 0.35
  if ((ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9')) return 0.62
  return 0.55
}

// 离屏 canvas 精确测宽（同步，基础库 >= 2.16.1）。
// app.wxss 全局 font-family: sans-serif，canvas 用同一字体测量与实际渲染一致；
// 创建失败（低版本基础库等）返回 null，调用方回退 charWidthUnit 估算
let textMeasureCtx = null
function getTextWidth(text, fontSize) {
  try {
    if (!textMeasureCtx) {
      const canvas = wx.createOffscreenCanvas({ type: '2d', width: 1, height: 1 })
      if (!canvas || !canvas.getContext) return null
      textMeasureCtx = canvas.getContext('2d')
    }
    if (!textMeasureCtx) return null
    textMeasureCtx.font = fontSize + 'px sans-serif'
    return textMeasureCtx.measureText(text).width
  } catch (e) {
    return null
  }
}

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
    },

    /**
     * @description 图片高度（用于计算说明文本位置）
     */
    imageHeight: {
      type: Number,
      value: 0
    },

    /**
     * @description 容器缩放比例因子
     * 用于保持锚点在不同缩放比例下的视觉一致性
     */
    containerScaleFactor: {
      type: Number,
      value: 1
    },
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
    labelInside: false, // 说明文本是否内嵌
    containerSizeStyle: '', // 锚点容器尺寸样式（inside autoSize 时由文字量算出显式宽高）
    insideTextStyle: '', // 内嵌文字样式
    pulseColor: '#ff4d4f', // 脉冲动画颜色
    isPc: false, // 是否是 PC 端
    isSkyline: false, // 是否使用 Skyline 渲染引擎
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
        this.setData({
          isPC: checkIsPc(),
          isSkyline: checkIsSkyline(),
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

      // 计算锚点尺寸：宽/高独立百分比（均以图片宽度为基准），旧数据只有 size 时宽高一致
      const minSize = isPC ? 24 : 20
      let size = (imageWidth * (anchor.style.size || 8)) / 100
      if (size < minSize) size = minSize
      let baseW = (imageWidth * (anchor.style.width ?? anchor.style.size ?? 8)) / 100
      let baseH = (imageWidth * (anchor.style.height ?? anchor.style.size ?? 8)) / 100
      if (baseW < minSize) baseW = minSize
      if (baseH < minSize) baseH = minSize

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
      let pulseColor = '#ff4d4f' // 脉冲动画颜色
      let shapeBorderWidth = 0 // shape 边框宽度（占 border-box 内侧，量算尺寸时须补偿）

      if (preset) {
        styleType = preset.type || 'shape'

        if (preset.type === 'image' && preset.image) {
          styleImage = preset.image
        } else if (preset.type === 'shape' && preset.shape) {
          const shape = preset.shape
          shapeClass = 'shape-' + (shape.type || 'circle')
          const styleArr = []
          if (shape.color) styleArr.push(`background-color: ${shape.color}`)
          if (shape.borderWidth && shape.borderColor) {
            styleArr.push(`border: ${shape.borderWidth}px solid ${shape.borderColor}`)
            shapeBorderWidth = shape.borderWidth
          }
          shapeStyle = styleArr.join(';')
          pulseColor = shape.color || '#ff4d4f'
        } else if (preset.type === 'icon' && preset.icon) {
          iconColor = preset.icon.color || '#ffffff'
          iconSvg = getColoredIconSvg(preset.icon.name, iconColor)
          pulseColor = iconColor
        }
      } else {
        // 使用自定义样式或默认样式
        if (anchor.style.customImage) {
          styleType = 'image'
          styleImage = anchor.style.customImage
        } else {
          styleType = 'default'
          pulseColor = anchor.style.color || '#ff4d4f'
        }
      }

      let labelInside = anchor.label?.position === 'inside' && styleType === 'shape'

      // ---- shape 内嵌文字配置解析（insideConfig） ----
      const scaleFactor = this.data.containerScaleFactor || 1
      const ic = anchor.label?.insideConfig || {}
      const fontSize = (ic.fontSize ?? 16) / scaleFactor
      // 兼容旧数据：单值 padding 同时作为横向/纵向内边距
      const insidePaddingX = (ic.paddingX ?? ic.padding ?? 4) / scaleFactor
      const insidePaddingY = (ic.paddingY ?? ic.padding ?? 4) / scaleFactor
      const insideWrap = ic.wrap ?? false
      const insideMaxChars = ic.maxCharsPerLine ?? 10
      const insideMaxLines = ic.maxLines ?? 2
      const insideAutoSize = ic.autoSize ?? true

      let containerSizeStyle = `width: ${baseW}px; height: ${baseH}px;`
      let insideTextStyle = ''

      if (labelInside) {
        const lineHeight = Math.round(fontSize * 1.5)
        insideTextStyle = `font-size: ${fontSize}px; line-height: ${lineHeight}px; color: #ffffff; padding: ${insidePaddingY}px ${insidePaddingX}px; box-sizing: border-box; text-align: center;`

        // 分行由我们决定：按"每行最多 N 字符"切块（字符数语义，即配置的本义），
        // 再被 maxLines 截断；浏览器只在给定 max-width 内 break-all 折行，
        // 每块都 ≤ max-width，浏览器行数不会超过切块数，不会被 max-height 裁掉
        const text = anchor.label?.text || ''
        const chars = [...text]
        const segments = []
        if (insideWrap && insideMaxChars > 0) {
          for (let i = 0; i < chars.length; i += insideMaxChars) {
            segments.push(chars.slice(i, i + insideMaxChars).join(''))
          }
        } else {
          segments.push(text)
        }
        const visibleSegments = insideWrap && insideMaxLines > 0 ? segments.slice(0, insideMaxLines) : segments
        const lineCount = visibleSegments.length

        // 行宽 = 可见行最大宽度：优先离屏 canvas 精确测量（+1px 容纳亚像素舍入），
        // 全部行可测才用精确值，否则整体回退系数估算（+0.25em 余量，宁宽勿窄）
        const widths = visibleSegments.map(seg => getTextWidth(seg, fontSize))
        let textW
        if (widths.every(w => w != null)) {
          textW = Math.ceil(Math.max(...widths)) + 1
        } else {
          const est = visibleSegments.map(seg => [...seg].reduce((u, ch) => u + charWidthUnit(ch), 0))
          textW = Math.ceil(Math.max(...est) * fontSize + fontSize * 0.25)
        }
        const textH = Math.ceil(lineCount * lineHeight)

        if (insideAutoSize && text) {
          // 宽高完全由文字量算决定（不与手动拖拽尺寸取 max，保证开关打开即回到适配尺寸），
          // 仅保留最小可点击尺寸下限；边框占 border-box 内侧，须补进尺寸避免压住文字
          const w = Math.max(minSize, textW + insidePaddingX * 2 + shapeBorderWidth * 2)
          const h = Math.max(minSize, textH + insidePaddingY * 2 + shapeBorderWidth * 2)
          containerSizeStyle = `width: ${w}px; height: ${h}px;`
        }

        if (insideWrap) {
          // 换行：max-width 控制每行字符数，-webkit-line-clamp + max-height 双保险截断行数
          insideTextStyle += ` white-space: normal; word-break: break-all;`
          if (insideMaxChars > 0) {
            insideTextStyle += ` max-width: ${textW + insidePaddingX * 2}px;`
          }
          if (insideMaxLines > 0) {
            insideTextStyle += ` display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: ${insideMaxLines}; max-height: ${textH + insidePaddingY * 2}px; overflow: hidden;`
          }
        } else {
          // 不换行
          insideTextStyle += ` white-space: nowrap;`
          if (!insideAutoSize) {
            // 固定宽高时单行省略
            insideTextStyle += ` overflow: hidden; text-overflow: ellipsis;`
          }
        }
      }

      // 设置数据
      this.setData({
        size,
        styleType,
        styleImage,
        shapeStyle,
        shapeClass,
        iconSvg,
        iconColor,
        labelPosition: styleType !== 'shape' && anchor.label?.position === 'inside' ? 'right' : (anchor.label?.position || 'right'),
        labelInside,
        containerSizeStyle,
        insideTextStyle,
      })

      // 延迟计算 label 位置（等待渲染完成后获取实际尺寸）
      if (anchor.label?.text && !labelInside) {
        setTimeout(() => {
          this.calculateAndUpdateLabelPosition()
        }, 50)
      }
    },

    /**
     * @description 计算并更新说明文本位置（基于实际渲染尺寸）
     */
    calculateAndUpdateLabelPosition() {
      const { anchor, imageWidth, imageHeight } = this.data
      if (!anchor?.label?.text) return

      const preferredPosition = anchor.label.position || 'right'
      const autoPosition = anchor.label.autoPosition !== false

      if (!autoPosition) {
        this.setData({ labelPosition: preferredPosition })
        return
      }

      // 使用 createSelectorQuery 获取实际尺寸
      const query = this.createSelectorQuery()
      query.select('.anchor-label').boundingClientRect()
      query.exec((res) => {
        const labelRect = res[0]
        if (!labelRect) {
          this.setData({ labelPosition: preferredPosition })
          return
        }

        const { x, y } = anchor.position || { x: 50, y: 50 }

        // 计算 label 尺寸相对于图片尺寸的百分比
        const actualImageHeight = imageHeight || (imageWidth * 0.75) // 备用默认值
        const labelWidthPercent = (labelRect.width / imageWidth) * 100 + 3 // 加上间距
        const labelHeightPercent = (labelRect.height / actualImageHeight) * 100 + 3

        // 检查各个方向是否有足够空间
        const spaceMap = {
          right: (100 - x) > labelWidthPercent,
          left: x > labelWidthPercent,
          top: y > labelHeightPercent,
          bottom: (100 - y) > labelHeightPercent
        }

        // 按优先级查找可用位置
        const priorities = [preferredPosition, 'right', 'left', 'top', 'bottom']
          .filter((pos, idx, arr) => arr.indexOf(pos) === idx)

        const validPosition = priorities.find(pos => spaceMap[pos]) || 'hidden'

        console.debug('[anchor-point] Label 位置计算:', {
          labelSize: { width: labelRect.width, height: labelRect.height },
          imageSize: { width: imageWidth, height: actualImageHeight },
          anchorPosition: { x, y },
          spaceMap,
          result: validPosition
        })

        this.setData({ labelPosition: validPosition })
      })
    },

    /**
     * @description 点击锚点
     */
    _taping: false,
    _tapTimeout: 0,
    onTap: function (e) {
      if (this._taping) {
        return;
      }

      this._taping = true;
      this._tapTimeout = setTimeout(() => {
        console.debug('[anchor-point] onTap', this.data, e);
        this.triggerEvent('anchortap', { anchor: this.data.anchor });
        this._taping = false;
        this._tapTimeout = 0;
      }, 100);
    },

    cancelTap: function () {
      if (this._tapTimeout) {
        clearTimeout(this._tapTimeout);
        this._taping = false;
        this._tapTimeout = 0;
      }
    },

    /**
     * @description 阻止事件冒泡
     */
    stopPropagation(e) {
      // 空函数，用于阻止点击穿透
      console.debug('[anchor-point] stopPropagation', e);
    },
  }
})
