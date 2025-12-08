# image-anchor 图片锚点插件

在富文本图片上显示可点击的锚点，点击后展示解读弹窗。

## 功能特性

- 支持在图片上显示多个锚点
- 支持三种锚点样式类型：图片、图形、图标
- 支持说明文本自动定位
- 支持脉冲/呼吸动画效果
- 支持多页解读内容切换
- 支持富文本、视频、音频三种解读内容类型
- 支持容器内弹窗和底部 Modal 两种显示模式
- 兼容 PC 端和移动端

## 使用方法

### 1. 引入插件

在 `tools/config.js` 的 `plugins` 数组中添加 `'image-anchor'`：

```javascript
module.exports = {
  plugins: ['image-anchor']
}
```

### 2. 构建组件包

```bash
npm run build:weixin
```

### 3. 使用组件

```wxml
<mp-html
  content="{{html}}"
  image-anchors="{{imageAnchors}}"
  anchor-styles="{{anchorStyles}}"
  tooltip-mode="container"
  show-anchor-animation="{{true}}"
  bindanchortap="onAnchorTap"
  bindtooltipshow="onTooltipShow"
  bindtooltiphide="onTooltipHide"
  bindpagechange="onPageChange"
/>
```

## 属性说明

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| image-anchors | Array | [] | 图片锚点数据数组 |
| anchor-styles | Array | [] | 锚点预设样式数组 |
| tooltip-mode | String | 'container' | 弹窗显示模式：'container'(容器内) / 'modal'(底部弹窗) |
| show-anchor-animation | Boolean | true | 是否显示锚点脉冲动画 |

## 事件说明

| 事件名 | 说明 | 返回值 |
|--------|------|--------|
| anchortap | 点击锚点时触发 | { anchor: Object } |
| tooltipshow | 弹窗显示时触发 | { anchor: Object } |
| tooltiphide | 弹窗关闭时触发 | { anchor: Object } |
| pagechange | 切换解读页面时触发 | { index: Number, page: Object, anchor: Object } |

## 数据格式

### imageAnchors 锚点数据

```javascript
[
  {
    imageIndex: 0,  // 图片索引（从0开始）
    // 或使用 imageSrc: 'xxx.jpg' 通过图片地址匹配
    anchors: [
      {
        id: 'anchor1',
        position: { x: 30, y: 40 },  // 百分比坐标 (0-100)
        style: {
          presetId: 'style1',  // 预设样式ID（可选）
          size: 8,  // 相对图片宽度的百分比 (2-30)
          color: '#ff4d4f',  // 自定义颜色（无预设时使用）
          customImage: ''  // 自定义图片URL（可选）
        },
        tooltipPages: [
          {
            id: 'page1',
            type: 'richtext',  // richtext/video/audio
            title: '解读标题',
            content: '解读内容...',
            image: 'xxx.jpg'
          }
        ],
        order: 1,  // 锚点编号
        label: {
          text: '说明文本',
          position: 'right',  // right/left/top/bottom
          autoPosition: true  // 是否自动调整位置
        }
      }
    ]
  }
]
```

### anchorStyles 预设样式

```javascript
[
  {
    _id: 'style1',
    name: '样式名称',
    type: 'shape',  // image/shape/icon
    shape: {
      type: 'circle',  // circle/square/rounded
      color: '#ff4d4f',
      borderColor: '#ffffff',
      borderWidth: 2
    },
    defaultSize: 32
  },
  {
    _id: 'style2',
    type: 'icon',
    icon: {
      name: 'info-circle',  // 支持的图标名称见下方
      color: '#ffffff'
    }
  },
  {
    _id: 'style3',
    type: 'image',
    image: 'https://xxx.com/anchor.png'
  }
]
```

### 支持的图标名称

- info-circle (信息)
- question-circle (问号)
- exclamation-circle (感叹号)
- star (星星)
- heart (爱心)
- thumb-up (点赞)
- location (定位)
- eye (眼睛)

## 弹窗模式说明

### container 模式

弹窗在图片容器内显示，覆盖图片上方或下方 40% 区域。根据锚点位置自动判断：
- 锚点 y < 60%：弹窗显示在下方
- 锚点 y >= 60%：弹窗显示在上方

### modal 模式

弹窗作为独立层从底部弹出，覆盖全屏，最大高度 70vh。点击遮罩可关闭。

## 注意事项

1. 目前仅支持微信小程序平台
2. 图片锚点数据需要在 `mp-html` 组件渲染前设置
3. 锚点位置使用百分比坐标，相对于图片尺寸
4. 预设样式的 `_id` 需要与锚点数据中的 `presetId` 对应

## 更新日志

### v1.0.0
- 初始版本
- 支持基础锚点显示和解读弹窗功能
